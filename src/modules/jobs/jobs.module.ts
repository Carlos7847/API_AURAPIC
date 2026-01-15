import { Module } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { UploadsModule } from '../uploads/uploads.module';
import { BillingModule } from '../billing/billing.module';
import { BullModule } from '@nestjs/bullmq';

// Ports
import { JobRepositoryPort } from './domain/ports/job.repository.port';
import { QueueServicePort } from './domain/ports/queue.service.port';
import { AiProcessorServicePort } from 'src/shared/ai/domain/ports/ai-processor.port';
import { AiModule } from 'src/shared/ai/ai.module';
import { GeminiAiAdapter } from 'src/shared/ai/infrastructure/adapters/gemini-ai.adapter';
import { DeductCreditUseCase } from '../billing/application/use-cases/deduct-credit.use-case';
import { RefundCreditUseCase } from '../billing/application/use-cases/refund-credit.use-case';
import { ImageAssetRepositoryPort } from '../uploads/domain/ports/image-asset.repository.port';
import { EmbeddingGeneratorPort } from 'src/shared/ai/domain/ports/embedding-generator.port';
import { MemoryRepositoryPort } from 'src/shared/ai/domain/ports/memory.repository.port';

// Adapters & Repositories
import { PrismaJobRepository } from './infrastructure/persistence/prisma-job.repository';
import { PrismaMemoryRepository } from 'src/shared/ai/infrastructure/persistence/prisma-memory.repository';
import { BullMqQueueAdapter } from './infrastructure/adapters/bullmq-queue.adapter';

// Use Cases
import { CreateJobUseCase } from './application/use-cases/create-job.use-case';
import { GetJobUseCase } from './application/use-cases/get-job.use-case';
import { ListUserJobsUseCase } from './application/use-cases/list-user-jobs.use-case';
import { CancelJobUseCase } from './application/use-cases/cancel-job.use-case';
import { ProcessJobUseCase } from './application/use-cases/process-job.use-case';
import { SearchSimilarJobsUseCase } from './application/use-cases/search-similar-jobs.use-case';

// Driving Adapters (Controller & Processor)
import { JobsController } from './infrastructure/http/jobs.controller';
import { JobsProcessor } from './infrastructure/http/jobs.processor';

/**
 * Jobs Module
 *
 * Driving Adapters:
 * - JobsController (HTTP - Producer): escucha requests, encola jobs
 * - JobsProcessor (BullMQ - Consumer): procesa jobs de forma asincrónica
 *
 * Note: Requiere Redis corriendo para BullMQ
 */
@Module({
  imports: [
    UploadsModule,
    AiModule,
    BillingModule,
    BullModule.registerQueue({
      name: 'jobs',
    }),
  ],
  controllers: [JobsController],
  providers: [
    PrismaService,

    {
      provide: JobRepositoryPort,
      useClass: PrismaJobRepository,
    },
    {
      provide: QueueServicePort,
      useClass: BullMqQueueAdapter,
    },

    {
      provide: AiProcessorServicePort,
      useExisting: GeminiAiAdapter,
    },
    {
      provide: EmbeddingGeneratorPort,
      useExisting: GeminiAiAdapter,
    },
    {
      provide: MemoryRepositoryPort,
      useClass: PrismaMemoryRepository,
    },

    {
      provide: CreateJobUseCase,
      useFactory: (
        jobRepo: JobRepositoryPort,
        queueService: QueueServicePort,
        aiProcessor: AiProcessorServicePort,
        deductCredit: DeductCreditUseCase,
        refundCredit: RefundCreditUseCase,
        logger: LoggerPort,
      ) => {
        return new CreateJobUseCase(
          jobRepo,
          queueService,
          aiProcessor,
          deductCredit,
          refundCredit,
          logger,
        );
      },
      inject: [
        JobRepositoryPort,
        QueueServicePort,
        AiProcessorServicePort,
        DeductCreditUseCase,
        RefundCreditUseCase,
        LoggerPort,
      ],
    },
    {
      provide: GetJobUseCase,
      useFactory: (jobRepo: JobRepositoryPort, logger: LoggerPort) => {
        return new GetJobUseCase(jobRepo, logger);
      },
      inject: [JobRepositoryPort, LoggerPort],
    },
    {
      provide: ListUserJobsUseCase,
      useFactory: (jobRepo: JobRepositoryPort, logger: LoggerPort) => {
        return new ListUserJobsUseCase(jobRepo, logger);
      },
      inject: [JobRepositoryPort, LoggerPort],
    },
    {
      provide: CancelJobUseCase,
      useFactory: (
        jobRepo: JobRepositoryPort,
        queueService: QueueServicePort,
        logger: LoggerPort,
      ) => {
        return new CancelJobUseCase(jobRepo, queueService, logger);
      },
      inject: [JobRepositoryPort, QueueServicePort, LoggerPort],
    },

    {
      provide: ProcessJobUseCase,
      useFactory: (
        jobRepo: JobRepositoryPort,
        aiProcessor: AiProcessorServicePort,
        imageAssetRepo: ImageAssetRepositoryPort,
        refundCredit: RefundCreditUseCase,
        logger: LoggerPort,
        embeddingGenerator: EmbeddingGeneratorPort,
        memoryRepo: MemoryRepositoryPort,
      ) => {
        return new ProcessJobUseCase(
          jobRepo,
          aiProcessor,
          imageAssetRepo,
          refundCredit,
          logger,
          embeddingGenerator,
          memoryRepo,
        );
      },
      inject: [
        JobRepositoryPort,
        AiProcessorServicePort,
        ImageAssetRepositoryPort,
        RefundCreditUseCase,
        LoggerPort,
        EmbeddingGeneratorPort,
        MemoryRepositoryPort,
      ],
    },

    {
      provide: SearchSimilarJobsUseCase,
      useFactory: (
        embeddingGen: EmbeddingGeneratorPort,
        memoryRepo: MemoryRepositoryPort,
      ) => {
        return new SearchSimilarJobsUseCase(embeddingGen, memoryRepo);
      },
      inject: [EmbeddingGeneratorPort, MemoryRepositoryPort],
    },

    // Processor (Consumer) - Solo si estamos en modo worker
    ...(process.env.ENABLE_WORKER === 'true' ? [JobsProcessor] : []),
  ],
  exports: [JobRepositoryPort, QueueServicePort, AiProcessorServicePort],
})
export class JobsModule {}
