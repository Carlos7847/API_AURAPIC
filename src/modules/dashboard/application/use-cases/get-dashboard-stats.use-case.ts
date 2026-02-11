import { JobRepositoryPort } from 'src/modules/jobs/domain/ports/job.repository.port';

export interface DashboardStatsResult {
  completed: number;
  failed: number;
  processing: number;
  queued: number;
  successRate: number;
  totalProcessed: number;
  inQueue: number;
}

export class GetDashboardStatsUseCase {
  constructor(private readonly jobRepository: JobRepositoryPort) {}

  async execute(userId: string): Promise<DashboardStatsResult> {
    const counts =
      await this.jobRepository.countByUserIdGroupedByStatus(userId);

    const totalProcessed = counts.completed + counts.failed;
    const successRate =
      totalProcessed > 0
        ? Math.round((counts.completed / totalProcessed) * 100)
        : 100;

    return {
      ...counts,
      successRate,
      totalProcessed,
      inQueue: counts.processing + counts.queued,
    };
  }
}
