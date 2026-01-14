import { Job as PrismaJobModel, JobResult, Prisma } from '@prisma/client';
import { Job, JobProps } from '../../../domain/entities/job.entity';
import { JOB_CONFIG } from '../../../domain/constants/job.constants';
import { JobStatus } from '../../../domain/enums/job-status.enum';

type PrismaJobWithResult = PrismaJobModel & { result?: JobResult | null };

export class JobMapper {
  static toDomain(prismaJob: PrismaJobWithResult): Job {
    const props: JobProps = {
      id: prismaJob.id,
      userId: prismaJob.userId,
      imageId: prismaJob.imageId ?? '',
      mode: prismaJob.mode,
      status: prismaJob.status as JobStatus,
      prompt: prismaJob.prompt ?? undefined,
      meta: (prismaJob.meta as Record<string, unknown>) ?? undefined,
      attempts: prismaJob.attempts,
      maxAttempts: JOB_CONFIG.MAX_ATTEMPTS,
      createdAt: prismaJob.createdAt,
      updatedAt: prismaJob.updatedAt,
      completedAt: prismaJob.result?.createdAt,
      resultUrl: prismaJob.result?.url,
      errorMessage:
        prismaJob.status === 'FAILED' ? 'Processing failed' : undefined,
    };
    return Job.fromPersistence(props);
  }

  static toPersistence(job: Job): Prisma.JobUncheckedCreateInput {
    return {
      id: job.id,
      userId: job.userId,
      imageId: job.imageId,
      mode: job.mode,
      status: job.status,
      prompt: job.prompt,
      meta: job.meta as Prisma.InputJsonValue,
      attempts: job.attempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
