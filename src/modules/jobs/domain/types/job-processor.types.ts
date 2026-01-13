import { JobStatus } from '../enums/job-status.enum';

/**
 * Estructura de datos de un job en BullMQ
 */
export interface BullJobData {
  jobId: string;
  imageId: string;
  userId: string;
  mode: string;
  prompt?: string;
  meta?: Record<string, unknown>;
}

/**
 * Resultado del procesamiento de un job
 */
export interface JobProcessResult {
  jobId: string;
  status: JobStatus;
  resultUrl: string;
  metadata?: Record<string, unknown>;
}
