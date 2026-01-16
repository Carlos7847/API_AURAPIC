import { Injectable } from '@nestjs/common';
import { OutboxEventRepositoryPort } from '../../domain/repositories/outbox-event.repository.port';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { EventBusPort } from '../../domain/event-bus.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { DomainEvent } from '../../domain/domain-event';

/**
 * Outbox Processor Service
 * Polls pending events and publishes them via EventBus
 */
@Injectable()
export class OutboxProcessorService {
  private readonly BATCH_SIZE = 10;
  private readonly POLL_INTERVAL_MS = 5000; // 5 seconds
  private isRunning = false;

  constructor(
    private readonly outboxRepository: OutboxEventRepositoryPort,
    private readonly eventBus: EventBusPort,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Start processing outbox events
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn(
        'OutboxProcessor already running',
        OutboxProcessorService.name,
      );
      return;
    }

    this.isRunning = true;
    this.logger.log(
      `OutboxProcessor started (poll interval: ${this.POLL_INTERVAL_MS}ms)`,
      OutboxProcessorService.name,
    );

    this.processLoop();
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.isRunning = false;
    this.logger.log('OutboxProcessor stopped', OutboxProcessorService.name);
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processPendingEvents();
      } catch (error) {
        this.logger.error(
          'Error in outbox processing loop',
          error instanceof Error ? error.stack : String(error),
          OutboxProcessorService.name,
        );
      }

      // Wait before next poll
      await this.sleep(this.POLL_INTERVAL_MS);
    }
  }

  private async processPendingEvents(): Promise<void> {
    const pendingEvents = await this.outboxRepository.findPending(
      this.BATCH_SIZE,
    );

    if (pendingEvents.length === 0) {
      return;
    }

    this.logger.debug(
      `Processing ${pendingEvents.length} pending outbox events`,
      OutboxProcessorService.name,
    );

    for (const outboxEvent of pendingEvents) {
      await this.processEvent(outboxEvent);
    }
  }

  private async processEvent(outboxEvent: OutboxEvent): Promise<void> {
    try {
      // Reconstruct domain event
      const domainEvent: DomainEvent = {
        eventName: outboxEvent.eventName,
        occurredOn: outboxEvent.createdAt,
        payload: outboxEvent.payload,
      };

      // Publish via EventBus
      await this.eventBus.publish(domainEvent);

      // Mark as processed
      outboxEvent.markProcessed();
      await this.outboxRepository.update(outboxEvent);

      this.logger.log(
        `Successfully processed outbox event: ${outboxEvent.id} (${outboxEvent.eventName})`,
        OutboxProcessorService.name,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      outboxEvent.recordFailure(errorMessage);
      await this.outboxRepository.update(outboxEvent);

      this.logger.error(
        `Failed to process outbox event ${outboxEvent.id}: ${errorMessage} (attempt ${outboxEvent.attempts})`,
        error instanceof Error ? error.stack : '',
        OutboxProcessorService.name,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
