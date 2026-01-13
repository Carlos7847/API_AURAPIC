import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { QueueServicePort } from '../../domain/ports/queue.service.port';
import {
  JobNotFoundError,
  JobUnauthorizedError,
} from '../../domain/errors/job.exceptions';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Flujo:
 * 1. Valida que el job existe y pertenece al usuario
 * 2. Cancela el job en la cola
 * 3. Actualiza estado en BD
 */
export class CancelJobUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly queueService: QueueServicePort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(userId: string, jobId: string): Promise<void> {
    this.logger.debug(
      `Cancelling job ${jobId} for user ${userId}`,
      CancelJobUseCase.name,
    );

    // 1. Validar que existe y pertenece al usuario
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    if (job.userId !== userId) {
      throw new JobUnauthorizedError(jobId, userId);
    }

    // 2. Cancelar en la cola
    try {
      await this.queueService.cancelJob(jobId);
    } catch (error) {
      this.logger.warn(
        `Failed to cancel job in queue: ${error}`,
        CancelJobUseCase.name,
      );
      // Continuar aunque falle en la cola
    }

    this.logger.debug(
      `Job ${jobId} cancelled successfully`,
      CancelJobUseCase.name,
    );
  }
}
