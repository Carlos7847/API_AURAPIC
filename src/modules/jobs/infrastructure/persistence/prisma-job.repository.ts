import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { JobRepositoryPort } from '../../domain/ports/job.repository.port';
import { Job, JobProps } from '../../domain/entities/job.entity';
import { JobStatus } from '../../domain/enums/job-status.enum';
import { JobMapper } from './mappers/job.mapper';
import { v4 as uuidv4 } from 'uuid';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

@Injectable()
export class PrismaJobRepository implements JobRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerPort,
  ) {}

  async create(
    props: Omit<
      JobProps,
      'id' | 'createdAt' | 'updatedAt' | 'status' | 'attempts' | 'maxAttempts'
    >,
  ): Promise<Job> {
    // Delegate ID generation and defaults to Domain Entity logic
    const userId = props.userId;
    const imageId = props.imageId;
    const mode = props.mode;
    const prompt = props.prompt;
    const meta = props.meta;

    const jobEntity = Job.create(userId, imageId, mode, uuidv4(), prompt, meta);

    // Map to persistence and save
    const jobModel = await this.prisma.job.create({
      data: JobMapper.toPersistence(jobEntity),
    });

    return JobMapper.toDomain(jobModel);
  }

  async findById(id: string): Promise<Job | null> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { result: true },
    });

    return job ? JobMapper.toDomain(job) : null;
  }

  async findByUserId(
    userId: string,
    status?: JobStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Job[]; total: number }> {
    const where = status ? { userId, status } : { userId };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { result: true },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs.map((job) => JobMapper.toDomain(job)),
      total,
    };
  }

  async findQueued(limit: number = 100): Promise<Job[]> {
    const jobs = await this.prisma.job.findMany({
      where: { status: JobStatus.QUEUED },
      include: { result: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    return jobs.map((job) => JobMapper.toDomain(job));
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    payload?: {
      resultUrl?: string;
      errorMessage?: string;
      attempts?: number;
      completedAt?: Date;
    },
  ): Promise<Job> {
    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status,
        attempts: payload?.attempts,
        updatedAt: new Date(),
        // Nota: Si el esquema de Prisma tuviera resultUrl y completedAt, se actualizarían aquí.
        // Por ahora, asumimos que solo status y attempts persisten en 'Job' table.
      },
    });

    return JobMapper.toDomain(updatedJob);
  }

  async incrementAttempts(id: string): Promise<Job> {
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    return JobMapper.toDomain(job);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.job.delete({
      where: { id },
    });
  }

  async countByUserIdGroupedByStatus(userId: string): Promise<{
    completed: number;
    failed: number;
    processing: number;
    queued: number;
  }> {
    const groupedCounts = await this.prisma.job.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    });

    // Initialize all counts to 0
    const result = {
      completed: 0,
      failed: 0,
      processing: 0,
      queued: 0,
    };

    // Map Prisma results to our structure
    for (const group of groupedCounts) {
      const count = group._count.status;
      const status = String(group.status);

      if (status === 'COMPLETED') result.completed = count;
      else if (status === 'FAILED') result.failed = count;
      else if (status === 'PROCESSING') result.processing = count;
      else if (status === 'QUEUED') result.queued = count;
    }

    return result;
  }
}
