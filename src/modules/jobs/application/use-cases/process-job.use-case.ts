import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { AiProcessorServicePort } from 'src/shared/ai/domain/ports/ai-processor.port';
import { ImageAssetRepositoryPort } from 'src/modules/uploads/domain/ports/image-asset.repository.port';
import { RefundCreditUseCase } from 'src/modules/billing/application/use-cases/refund-credit.use-case';
import { JobStatus } from '../../domain/enums/job-status.enum';
import {
  JobNotFoundError,
  ImageAssetNotFoundForJobError,
  JobMaxAttemptsExceededError,
} from '../../domain/errors/job.exceptions';
import { JobProcessResult } from '../../domain/types/job-processor.types';

import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Process Job Use Case
 * Application Layer
 *
 * Encapsula la lógica de negocio para procesar un trabajo:
 * 1. Recuperar Job y cambiar estado a PROCESSING
 * 2. Invocar servicio de IA
 * 3. Guardar resultados y completar Job
 * 4. Manejar errores y reintentos (incluyendo reembolsos)
 */
export class ProcessJobUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly aiProcessor: AiProcessorServicePort,
    private readonly imageAssetRepository: ImageAssetRepositoryPort,
    private readonly refundCredit: RefundCreditUseCase,
    private readonly logger: LoggerPort,
  ) {}

  async execute(jobId: string): Promise<JobProcessResult> {
    this.logger.debug(
      `Executing ProcessJobUseCase for job ${jobId}`,
      ProcessJobUseCase.name,
    );

    try {
      // 1. Get Job
      const jobEntity = await this.jobRepository.findById(jobId);
      if (!jobEntity) {
        throw new JobNotFoundError(jobId);
      }

      // 2. Idempotency Check
      if (jobEntity.isFinalState()) {
        this.logger.warn(
          `Job ${jobId} is already ${jobEntity.status}`,
          ProcessJobUseCase.name,
        );
        return {
          jobId,
          status: jobEntity.status,
          resultUrl: jobEntity.resultUrl || '',
        };
      }

      // 3. Mark as Processing
      jobEntity.markAsProcessing();
      await this.jobRepository.updateStatus(jobId, JobStatus.PROCESSING);

      // 4. Get Image Asset
      const imageAsset = await this.imageAssetRepository.findById(
        jobEntity.imageId,
      );
      if (!imageAsset) {
        throw new ImageAssetNotFoundForJobError(jobEntity.imageId);
      }

      // 5. AI Processing
      this.logger.debug(
        `Calling AI processor for image ${jobEntity.imageId} with mode ${jobEntity.mode}`,
        ProcessJobUseCase.name,
      );

      const { resultImageUrl, metadata } = await this.aiProcessor.processImage({
        imageUrl: imageAsset.url,
        mode: jobEntity.mode,
        prompt: jobEntity.prompt,
        meta: jobEntity.meta,
      });

      // 6. Validate Result
      if (!resultImageUrl) {
        const errorMsg =
          metadata?.processingStatus === 'BLOCKED_SAFETY'
            ? 'Content blocked by AI safety filters'
            : 'AI processing returned no result image URL';
        throw new Error(errorMsg);
      }

      // 7. Complete Job
      jobEntity.complete(resultImageUrl);

      await this.jobRepository.updateStatus(jobId, JobStatus.COMPLETED, {
        resultUrl: resultImageUrl,
        completedAt: jobEntity.completedAt,
      });

      this.logger.log(
        `Job ${jobId} completed successfully. Result: ${resultImageUrl}`,
        ProcessJobUseCase.name,
      );

      return {
        jobId,
        status: JobStatus.COMPLETED,
        resultUrl: resultImageUrl,
        metadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error processing job ${jobId}: ${errorMessage}`,
        ProcessJobUseCase.name,
      );

      // Use case specific error handling logic detached from main flow
      await this.handleProcessingError(jobId, errorMessage);
      throw error;
    }
  }

  /*
   * Handle errors during processing: retry logic, refunds, etc.
   */
  private async handleProcessingError(
    jobId: string,
    errorMessage: string,
  ): Promise<void> {
    const currentJob = await this.jobRepository.findById(jobId);
    if (!currentJob) return;

    currentJob.incrementAttempts();
    await this.jobRepository.incrementAttempts(jobId);

    if (currentJob.isMaxAttemptsExceeded()) {
      const completeErrorMsg = `Failed after ${currentJob.attempts} attempts: ${errorMessage}`;

      currentJob.fail(completeErrorMsg);

      await this.jobRepository.updateStatus(jobId, JobStatus.FAILED, {
        errorMessage: completeErrorMsg,
        completedAt: new Date(),
      });

      // Refund logic
      await this.processRefund(currentJob.userId, jobId);

      throw new JobMaxAttemptsExceededError(jobId, currentJob.attempts);
    }
  }

  private async processRefund(userId: string, jobId: string): Promise<void> {
    try {
      await this.refundCredit.execute(userId);
      this.logger.log(
        `Credit refunded to user ${userId} for failed job ${jobId}`,
        ProcessJobUseCase.name,
      );
    } catch (refundError) {
      const msg =
        refundError instanceof Error
          ? refundError.message
          : String(refundError);
      this.logger.error(
        `Failed to refund credit for user ${userId} on job ${jobId}: ${msg}`,
        ProcessJobUseCase.name,
      );
    }
  }
}
