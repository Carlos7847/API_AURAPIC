import { OutboxEvent } from '../entities/outbox-event.entity';

/**
 * OutboxEvent Repository Port
 * Manages persistence of events for guaranteed delivery
 */
export abstract class OutboxEventRepositoryPort {
  /**
   * Save new outbox event (within transaction)
   */
  abstract create(event: OutboxEvent): Promise<OutboxEvent>;

  /**
   * Get pending events for processing
   */
  abstract findPending(limit?: number): Promise<OutboxEvent[]>;

  /**
   * Update event after processing attempt
   */
  abstract update(event: OutboxEvent): Promise<OutboxEvent>;

  /**
   * Find by ID
   */
  abstract findById(id: string): Promise<OutboxEvent | null>;
}
