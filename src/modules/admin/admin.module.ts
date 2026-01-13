import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AdminJobsController } from './infrastructure/http/admin-jobs.controller';
import { CompleteJobManuallyUseCase } from 'src/modules/jobs/application/use-cases/complete-job-manually.use-case';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { JobRepositoryPort } from '../jobs/domain/ports/job.repository.port';

@Module({
  imports: [JobsModule],
  controllers: [AdminJobsController],
  providers: [
    {
      provide: CompleteJobManuallyUseCase,
      useFactory: (jobRepo: JobRepositoryPort, logger: LoggerPort) => {
        return new CompleteJobManuallyUseCase(jobRepo, logger);
      },
      inject: [JobRepositoryPort, LoggerPort],
    },
  ],
})
export class AdminModule {}
