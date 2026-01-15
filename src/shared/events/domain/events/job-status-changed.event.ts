import { JobStatus } from 'src/modules/jobs/domain/enums/job-status.enum';

export interface JobStatusChangedEvent {
  jobId: string;
  userId: string;
  status: JobStatus;
  resultUrl?: string;
  errorMessage?: string;
  completedAt?: Date;
  metadata?: {
    processingTimeMs?: number;
    aiModel?: string;
    [key: string]: unknown;
  };
}
