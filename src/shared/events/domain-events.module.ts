import { Global, Module, OnModuleInit } from '@nestjs/common';
import { EventBusPort } from './domain/event-bus.port';
import { InMemoryEventBus } from './infrastructure/in-memory-event-bus';
import { OutboxEventRepositoryPort } from './domain/repositories/outbox-event.repository.port';
import { ProcessedEventRepositoryPort } from './domain/repositories/processed-event.repository.port';
import { PrismaOutboxEventRepository } from './infrastructure/repositories/prisma-outbox-event.repository';
import { PrismaProcessedEventRepository } from './infrastructure/repositories/prisma-processed-event.repository';
import { OutboxProcessorService } from './application/services/outbox-processor.service';

/**
 * Domain Events Module (Outbox Pattern)
 * Provides guaranteed event delivery and eventual consistency
 *
 * Separate from EventsModule (WebSocket Gateway) for clean separation of concerns
 */
@Global()
@Module({
  providers: [
    {
      provide: EventBusPort,
      useClass: InMemoryEventBus,
    },
    {
      provide: OutboxEventRepositoryPort,
      useClass: PrismaOutboxEventRepository,
    },
    {
      provide: ProcessedEventRepositoryPort,
      useClass: PrismaProcessedEventRepository,
    },
    OutboxProcessorService,
  ],
  exports: [
    EventBusPort,
    OutboxEventRepositoryPort,
    ProcessedEventRepositoryPort,
  ],
})
export class DomainEventsModule implements OnModuleInit {
  constructor(private readonly outboxProcessor: OutboxProcessorService) {}

  onModuleInit() {
    // Start outbox processor when module initializes
    this.outboxProcessor.start();
  }
}
