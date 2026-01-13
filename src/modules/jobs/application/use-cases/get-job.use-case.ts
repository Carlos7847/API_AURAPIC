import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import {
  JobNotFoundError,
  JobUnauthorizedError,
} from '../../domain/errors/job.exceptions';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { Job } from '../../domain/entities/job.entity';

/**
 * Get Job Use Case
 *
 * Flujo:
 * 1. Valida que el job existe
 * 2. Valida autorización (el usuario es propietario)
 * 3. Retorna datos del job
 */
export class GetJobUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(userId: string, jobId: string): Promise<Job> {
    this.logger.debug(
      `Getting job ${jobId} for user ${userId}`,
      GetJobUseCase.name,
    );

    // 1. Obtener job
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    // 2. Validar autorización
    if (job.userId !== userId) {
      throw new JobUnauthorizedError(jobId, userId);
    }

    // 3. Retornar
    return job;
  }
}
