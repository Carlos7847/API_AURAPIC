import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { JobStatus } from '../../domain/enums/job-status.enum';
import { Job } from '../../domain/entities/job.entity';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * List User Jobs Use Case
 * Application Layer (Clean Architecture) - NO @Injectable
 *
 * Flujo:
 * 1. Obtiene todos los jobs del usuario con filtros opcionales
 * 2. Aplica paginación
 * 3. Retorna lista con total
 */
export class ListUserJobsUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(
    userId: string,
    filters?: {
      status?: JobStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ data: Job[]; total: number }> {
    this.logger.debug(
      `Listing jobs for user ${userId}`,
      ListUserJobsUseCase.name,
    );

    const { data, total } = await this.jobRepository.findByUserId(
      userId,
      filters?.status,
      filters?.limit || 50,
      filters?.offset || 0,
    );

    return {
      data,
      total,
    };
  }
}
