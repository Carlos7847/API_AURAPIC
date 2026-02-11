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

  /**
   * Returns job counts grouped by status for a user.
   * Single query to avoid N+1 API calls pattern.
   */
  abstract countByUserIdGroupedByStatus(userId: string): Promise<{
    completed: number;
    failed: number;
    processing: number;
    queued: number;
  }>;

  abstract delete(id: string): Promise<void>;
}
