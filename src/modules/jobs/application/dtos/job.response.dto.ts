import { JobStatus } from '../../domain/enums/job-status.enum';

/**
 * DTO de respuesta para un Job
 */
export class JobResponseDto {
  id: string;
  userId: string;
  imageId: string;
  mode: string;
  status: JobStatus;
  prompt?: string;
  meta?: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  resultUrl?: string;
  errorMessage?: string;

  constructor(partial: Partial<JobResponseDto>) {
    Object.assign(this, partial);
  }
}
