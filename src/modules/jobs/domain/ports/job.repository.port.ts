import { Job, JobProps } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';

export abstract class JobRepositoryPort {
  abstract create(
    data: Omit<
      JobProps,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'attempts' | 'maxAttempts'
    >,
  ): Promise<Job>;

  abstract findById(id: string): Promise<Job | null>;

  abstract findByUserId(
    userId: string,
    status?: JobStatus,
    limit?: number,
    offset?: number,
  ): Promise<{ data: Job[]; total: number }>;

  /**
   * Obtiene jobs pendientes para procesar (QUEUED status)
   */
  abstract findQueued(limit?: number): Promise<Job[]>;

  /**
   * Actualiza el estado de un job
   */
  abstract updateStatus(
    id: string,
    status: JobStatus,
    payload?: {
      resultUrl?: string;
      errorMessage?: string;
      attempts?: number;
      completedAt?: Date;
    },
  ): Promise<Job>;

  /**
   * Incrementa contador de intentos
   */
  abstract incrementAttempts(id: string): Promise<Job>;

  abstract delete(id: string): Promise<void>;
}
