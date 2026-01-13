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
      // 1. Obtener y actualizar estado a PROCESSING
      const jobEntity = await this.jobRepository.findById(jobId);
      if (!jobEntity) {
        throw new JobNotFoundError(jobId);
      }

      // Validar si ya está completado o fallido para evitar reprocesamiento innecesario (idempotencia básica)
      if (
        jobEntity.status === JobStatus.COMPLETED ||
        jobEntity.status === JobStatus.FAILED
      ) {
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

      jobEntity.startProcessing();
      await this.jobRepository.updateStatus(jobId, JobStatus.PROCESSING);

      // 2. Obtener imagen del repositorio
      const imageAsset = await this.imageAssetRepository.findById(
        jobEntity.imageId,
      );
      if (!imageAsset) {
        throw new ImageAssetNotFoundForJobError(jobEntity.imageId);
      }

      // 3. Procesar con IA
      this.logger.debug(
        `Calling AI processor for image ${jobEntity.imageId} with mode ${jobEntity.mode}`,
        ProcessJobUseCase.name,
      );
      const { resultImageUrl, metadata } = await this.aiProcessor.processImage({
        imageUrl: imageAsset.url,
        mode: jobEntity.mode, // Remove cast, string is valid
        prompt: jobEntity.prompt,
        meta: jobEntity.meta,
      });

      // 4. Actualizar estado a COMPLETED
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
      this.logger.error(
        `Error processing job ${jobId}:`,
        error instanceof Error ? error.stack : String(error),
        ProcessJobUseCase.name,
      );
      await this.handleError(jobId, error);
      throw error; // Re-throw para que el Worker (BullMQ) sepa que falló y maneje sus retries internos de cola si aplica
    }
  }

  private async handleError(jobId: string, error: unknown): Promise<void> {
    // Obtener job actual para verificar intentos
    const currentJob = await this.jobRepository.findById(jobId);
    if (!currentJob) {
      return;
    }

    // Incrementar intentos (Dominio)
    currentJob.incrementAttempts();
    await this.jobRepository.incrementAttempts(jobId);

    // Verificar si se alcanzó máximo de intentos (Dominio)
    if (currentJob.isMaxAttemptsExceeded()) {
      const msg = `Failed after ${currentJob.attempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`;
      currentJob.fail(msg);

      await this.jobRepository.updateStatus(jobId, JobStatus.FAILED, {
        errorMessage: msg,
        completedAt: new Date(),
      });

      // Refund credit to user since job failed permanently
      try {
        await this.refundCredit.execute(currentJob.userId);
        this.logger.log(
          `Credit refunded to user ${currentJob.userId} for failed job ${jobId}`,
          ProcessJobUseCase.name,
        );
      } catch (refundError) {
        this.logger.error(
          `Failed to refund credit for user ${currentJob.userId} on job ${jobId}:`,
          refundError instanceof Error
            ? refundError.stack
            : String(refundError),
          ProcessJobUseCase.name,
        );
      }

      this.logger.error(
        `Job ${jobId} exceeded max attempts (${currentJob.attempts}/${currentJob.maxAttempts})`,
        undefined, // Trace is optional
        ProcessJobUseCase.name,
      );
      // Lanzamos error de dominio específico si se excedieron intentos, el worker capturará esto pero ya el job está FAILED en BD
      throw new JobMaxAttemptsExceededError(jobId, currentJob.attempts);
    }
  }
}
