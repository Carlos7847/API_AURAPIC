import { Module } from '@nestjs/common';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { GetDashboardStatsUseCase } from './application/use-cases/get-dashboard-stats.use-case';
import { JobsModule } from '../jobs/jobs.module';
import { JobRepositoryPort } from '../jobs/domain/ports/job.repository.port';

@Module({
  imports: [JobsModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: GetDashboardStatsUseCase,
      useFactory: (jobRepository: JobRepositoryPort) => {
        return new GetDashboardStatsUseCase(jobRepository);
      },
      inject: [JobRepositoryPort],
    },
  ],
})
export class DashboardModule {}
