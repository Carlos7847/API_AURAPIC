import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { JobStatus } from '../../domain/enums/job-status.enum';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import {
  JobNotFoundError,
  JobInvalidStateError,
} from '../../domain/errors/job.exceptions';

export class CompleteJobManuallyUseCase {
  constructor(
    private readonly jobRepository: JobRepositoryPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(jobId: string, resultUrl: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    // Allow completion from QUEUED or PROCESSING extended states
    // In strict Wizard of Oz, we might want to pick up even QUEUED jobs if the worker hasn't started
    if (
      job.status !== JobStatus.PROCESSING &&
      job.status !== JobStatus.QUEUED
    ) {
      throw new JobInvalidStateError(jobId, job.status, 'manual complete');
    }

    this.logger.log(
      `Manually completing job ${jobId} with result ${resultUrl}`,
      CompleteJobManuallyUseCase.name,
    );

    // Update status to COMPLETED and set result
    await this.jobRepository.updateStatus(jobId, JobStatus.COMPLETED, {
      resultUrl: resultUrl,
      completedAt: new Date(),
    });
  }
}
