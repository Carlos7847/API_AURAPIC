/**
 * Queue Service Port (Abstraction)
 * Define operaciones de encola para Jobs
 * Permite diferentes implementaciones (BullMQ, RabbitMQ, etc.)
 */
export abstract class QueueServicePort {
  /**
   * Encola un job para procesamiento
   */
  abstract enqueue(
    jobId: string,
    data: {
      imageId: string;
      userId: string;
      mode: string;
      prompt?: string;
      meta?: Record<string, unknown>;
    },
  ): Promise<void>;

  /**
   * Obtiene un job de la cola (sin procesarlo)
   */
  abstract peekJob(jobId: string): Promise<unknown>;

  /**
   * Marca un job como completado
   */
  abstract completeJob(jobId: string, result: unknown): Promise<void>;

  /**
   * Marca un job como fallido
   */
  abstract failJob(jobId: string, error: Error): Promise<void>;

  /**
   * Reinicia un job fallido
   */
  abstract retryJob(jobId: string): Promise<void>;

  /**
   * Cancela un job
   */
  abstract cancelJob(jobId: string): Promise<void>;

  /**
   * Obtiene estadísticas de la cola
   */
  abstract getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}
