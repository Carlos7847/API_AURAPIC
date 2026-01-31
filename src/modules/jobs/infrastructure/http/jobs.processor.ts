import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job as BullJob } from 'bullmq';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

import { ProcessJobUseCase } from '../../application/use-cases/process-job.use-case';
import {
  BullJobData,
  JobProcessResult,
} from '../../domain/types/job-processor.types';
import { EventEmitterPort } from 'src/shared/events/domain/ports/event-emitter.port';
import { JobStatus } from '../../domain/enums/job-status.enum';

/**
 * Jobs Processor (Worker)
 * Primary Adapter (Driven Adapter) - Escucha BullMQ
 *
 * Este es el Consumer: procesa jobs de la cola asincronicamente
 *
 * Flujo:
 * 1. Escucha eventos de la cola BullMQ
 * 2. Obtiene imagen de S3
 * 3. Procesa con IA
 * 4. Guarda resultado en S3
 * 5. Actualiza BD con resultado
 * 6. Maneja reintentos automáticos
 */

@Processor('jobs')
export class JobsProcessor extends WorkerHost {
  constructor(
    private readonly processJobUseCase: ProcessJobUseCase,
    private readonly eventEmitter: EventEmitterPort,
    private readonly logger: LoggerPort,
  ) {
    super();
  }

  async process(
    job: BullJob<BullJobData, JobProcessResult>,
  ): Promise<JobProcessResult> {
    const { jobId } = job.data;
    this.logger.debug(
      `Processing job ${jobId} via WorkerHost`,
      JobsProcessor.name,
    );

    try {
      const result = await this.processJobUseCase.execute(jobId);

      //  job complete
      this.eventEmitter.emitJobStatus({
        jobId: result.jobId,
        userId: job.data.userId,
        status: result.status,
        resultUrl: result.resultUrl || undefined,
        completedAt: new Date(),
        metadata: result.metadata,
      });

      return result;
    } catch (error) {
      this.eventEmitter.emitJobStatus({
        jobId,
        userId: job.data.userId,
        status: JobStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error; // Re-throw for BullMQ retry logic
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: BullJob) {
    this.logger.log(`Job ${job.id} completed successfully`, JobsProcessor.name);
  }

  @OnWorkerEvent('failed')
  onFailed(job: BullJob, error: Error) {
    this.logger.error(
      `Job ${job.id} failed: ${error.message}`,
      error.stack,
      JobsProcessor.name,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(
      `Worker error: ${error.message}`,
      error.stack,
      JobsProcessor.name,
    );
  }
}
