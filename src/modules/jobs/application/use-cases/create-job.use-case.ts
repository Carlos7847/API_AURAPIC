import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { QueueServicePort } from '../../domain/ports/queue.service.port';
import { AiProcessorServicePort } from 'src/shared/ai/domain/ports/ai-processor.port';
import { CreateJobDto } from '../dtos/create-job.dto';
import { InvalidJobModeError } from '../../domain/errors/job.exceptions';
import { DeductCreditUseCase } from 'src/modules/billing/application/use-cases/deduct-credit.use-case';
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
export class CreateJobUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly queueService: QueueServicePort,
    private readonly aiProcessor: AiProcessorServicePort,
    private readonly deductCredit: DeductCreditUseCase,
    private readonly logger: LoggerPort,
  ) {}

  async execute(userId: string, dto: CreateJobDto): Promise<Job> {
    // 1. Validar modo
    if (!this.aiProcessor.isModeSupported(dto.mode)) {
      throw new InvalidJobModeError(dto.mode);
    }

    this.logger.debug(
      `Creating job for user ${userId}, mode: ${dto.mode}, image: ${dto.imageId}`,
      CreateJobUseCase.name,
    );

    // 2. Deduct credit BEFORE creating the job (atomic operation)
    // throw InsufficientCreditsError if user doesn't have credits
    await this.deductCredit.execute(userId);
    this.logger.debug(
      `Credit deducted for user ${userId}`,
      CreateJobUseCase.name,
    );

    // 3. Crear job en BD (QUEUED status)
    const job = await this.jobRepository.create({
      userId,
      imageId: dto.imageId,
      mode: dto.mode,
      prompt: dto.prompt,
      meta: dto.meta,
    });
    this.logger.debug(
      `Created job ${job.id}, enqueueing for processing`,
      CreateJobUseCase.name,
    );

    // 3. Encolar para procesamiento
    try {
      await this.queueService.enqueue(job.id, {
        imageId: dto.imageId,
        userId,
        mode: dto.mode,
        prompt: dto.prompt,
        meta: dto.meta,
      });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue job ${job.id}`,
        error instanceof Error ? error.stack : String(error),
        CreateJobUseCase.name,
      );
      // Job quedó creado pero no fue encolado - puede reintentarse
      throw error;
    }

    this.logger.debug(
      `Job ${job.id} successfully enqueued`,
      CreateJobUseCase.name,
    );

    return job;
  }
}
