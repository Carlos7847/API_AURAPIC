import { ProcessedEvent } from '../entities/processed-event.entity';

/**
 * ProcessedEvent Repository Port
 * Manages idempotency checking for event handlers
 */
export abstract class ProcessedEventRepositoryPort {
  /**
   * Record that an event has been processed
   */
  abstract create(event: ProcessedEvent): Promise<ProcessedEvent>;

  /**
   * Check if event has already been processed
   */
  abstract findByEventId(eventId: string): Promise<ProcessedEvent | null>;

  /**
   * Check if event was processed by specific handler
   */
  abstract wasProcessedBy(
    eventId: string,
    handlerName: string,
  ): Promise<boolean>;
}
