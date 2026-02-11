import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { QueueServicePort } from '../../domain/ports/queue.service.port';
import { AiProcessorServicePort } from 'src/shared/ai/domain/ports/ai-processor.port';
import { CreateJobDto } from '../dtos/create-job.dto';
import { InvalidJobModeError } from '../../domain/errors/job.exceptions';
import { DeductCreditUseCase } from 'src/modules/billing/application/use-cases/deduct-credit.use-case';
import { RefundCreditUseCase } from 'src/modules/billing/application/use-cases/refund-credit.use-case';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { Job } from '../../domain/entities/job.entity';

/**
 * Create Job Use Case
 *
 * Flujo:
 * 1. Valida modo soportado
 * 2. Crea registro de job en BD (QUEUED)
 * 3. Encola job para procesamiento asincrónico
 * 4. Retorna Job response
 */
import { ImageAssetRepositoryPort } from 'src/modules/uploads/domain/ports/image-asset.repository.port';

export class CreateJobUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly queueService: QueueServicePort,
    private readonly aiProcessor: AiProcessorServicePort,
    private readonly deductCredit: DeductCreditUseCase,
    private readonly refundCredit: RefundCreditUseCase,
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(userId: string, dto: CreateJobDto): Promise<Job> {
    await this.validateAndDeductCredits(userId, dto.mode);

    this.logger.debug(
      `Creating job for user ${userId}, mode: ${dto.mode}, image: ${dto.imageId}`,
      CreateJobUseCase.name,
    );

    // Enrich metadata with original filename if not present
    const meta = { ...dto.meta };
    if (!meta.originalFilename) {
      const imageAsset = await this.imageAssetRepository.findById(dto.imageId);
      if (imageAsset) {
        // storageKey format: kind/userId/timestamp-filename.ext
        const parts = imageAsset.storageKey.split('-');
        if (parts.length > 1) {
          // Join back parts in case filename had hyphens, skipping the timestamp part (first part after last slash)
          // Actually, finding the first hyphen after the last slash is safer.
          // Simple heuristic: take everything after the first hyphen of the filename part
          const filenamePart = imageAsset.storageKey.split('/').pop() || '';
          const firstHyphenIndex = filenamePart.indexOf('-');
          if (firstHyphenIndex !== -1) {
            meta.originalFilename = filenamePart.substring(
              firstHyphenIndex + 1,
            );
          }
        }
      }
    }

    const job = await this.jobRepository.create({
      userId,
      imageId: dto.imageId,
      mode: dto.mode,
      prompt: dto.prompt,
      meta,
    });

    await this.queueJob(job, userId, dto);

    return job;
  }

  private async validateAndDeductCredits(
    userId: string,
    mode: string,
  ): Promise<void> {
    if (!this.aiProcessor.isModeSupported(mode)) {
      throw new InvalidJobModeError(mode);
    }

    await this.deductCredit.execute(userId);
    this.logger.debug(
      `Credit deducted for user ${userId}`,
      CreateJobUseCase.name,
    );
  }

  private async queueJob(
    job: Job,
    userId: string,
    dto: CreateJobDto,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Created job ${job.id}, enqueueing for processing`,
        CreateJobUseCase.name,
      );

      await this.queueService.enqueue(job.id, {
        imageId: dto.imageId,
        userId,
        mode: dto.mode,
        prompt: dto.prompt,
        meta: dto.meta,
      });

      this.logger.debug(
        `Job ${job.id} successfully enqueued`,
        CreateJobUseCase.name,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue job ${job.id}`,
        error instanceof Error ? error.stack : String(error),
        CreateJobUseCase.name,
      );

      // Compensation Logic
      await this.compensateFailure(job, userId);

      throw error;
    }
  }

  private async compensateFailure(job: Job, userId: string): Promise<void> {
    try {
      // 1. Refund credits
      await this.refundCredit.execute(userId);
      this.logger.log(
        `Credits refunded for failed job ${job.id}`,
        CreateJobUseCase.name,
      );

      // 2. Mark job as failed
      job.fail('System error: Failed to queue job');

      // Update status in repository
      await this.jobRepository.updateStatus(job.id, job.status, {
        errorMessage: job.errorMessage,
        completedAt: job.completedAt,
      });
    } catch (compensationError) {
      this.logger.error(
        `CRITICAL: Failed to compensate job ${job.id}`,
        compensationError instanceof Error
          ? compensationError.stack
          : String(compensationError),
        CreateJobUseCase.name,
      );
    }
  }
}
