import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueServicePort } from '../../domain/ports/queue.service.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * BullMQ Queue Adapter
 * Implementación concreta de QueueServicePort usando BullMQ
 *
 * Infrastructure Layer - @Injectable es apropiado:
 * - Es una dependencia concreta (BullMQ)
 * - NestJS la inyecta en módulos
 * - Específica de este framework
 */
@Injectable()
export class BullMqQueueAdapter implements QueueServicePort {
  constructor(
    @InjectQueue('jobs') private readonly queue: Queue,
    private readonly logger: LoggerPort,
  ) {}

  async enqueue(
    jobId: string,
    data: {
      imageId: string;
      userId: string;
      mode: string;
      prompt?: string;
      meta?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      const job = await this.queue.add(
        'process-image',
        {
          jobId,
          ...data,
        },
        {
          jobId, // BullMQ: usar jobId como identificador
          attempts: 3, // Reintentos automáticos
          backoff: {
            type: 'exponential',
            delay: 2000, // 2s inicial, exponencial
          },
          removeOnComplete: true, // Limpiar jobs completados
          removeOnFail: false, // Mantener jobs fallidos para análisis
        },
      );

      this.logger.debug(
        `Job ${jobId} enqueued for processing (BullMQ job id: ${job.id})`,
        BullMqQueueAdapter.name,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue job ${jobId}`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
      throw error;
    }
  }

  async peekJob(jobId: string): Promise<unknown> {
    try {
      const job = await this.queue.getJob(jobId);
      return job?.data || null;
    } catch (error) {
      this.logger.error(
        `Failed to peek job ${jobId}`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
      return null;
    }
  }

  async completeJob(jobId: string, result: unknown): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.log(`Completed: ${JSON.stringify(result)}`);
        // El job se marca como completado automáticamente
        // cuando el processor retorna exitosamente
      }
    } catch (error) {
      this.logger.error(
        `Failed to complete job ${jobId}`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
    }
  }

  async failJob(jobId: string, error: Error): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.log(`Failed: ${error.message}`);
        // El job se marca como fallido automáticamente
        // cuando el processor lanza excepción
      }
    } catch (e) {
      this.logger.error(
        `Failed to fail job ${jobId}`,
        e instanceof Error ? e.stack : String(e),
        BullMqQueueAdapter.name,
      );
    }
  }

  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.retry();
        this.logger.debug(`Job ${jobId} retried`, BullMqQueueAdapter.name);
      }
    } catch (error) {
      this.logger.error(
        `Failed to retry job ${jobId}`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.debug(`Job ${jobId} cancelled`, BullMqQueueAdapter.name);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel job ${jobId}`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
      throw error;
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    try {
      const counts = await this.queue.getJobCounts();
      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get queue stats`,
        error instanceof Error ? error.stack : String(error),
        BullMqQueueAdapter.name,
      );
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  }
}
