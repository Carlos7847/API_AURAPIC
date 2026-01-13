/**
 * Job Status Enum
 * Estados posibles de un Job de procesamiento de imágenes
 */
export enum JobStatus {
  /** Job creado pero no procesado aún */
  QUEUED = 'queued',

  PROCESSING = 'processing',

  COMPLETED = 'completed',

  FAILED = 'failed',

  /** Job fue cancelado por el usuario */
  CANCELLED = 'cancelled',
}
