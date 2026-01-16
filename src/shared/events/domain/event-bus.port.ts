import { DomainEvent } from './domain-event';

/**
 * Event Bus Port (Publish-Subscribe Pattern)
 */
export abstract class EventBusPort {
  /**
   * Publish an event to all subscribers
   */
  abstract publish(event: DomainEvent): Promise<void>;

  /**
   * Subscribe to specific event types
   */
  abstract subscribe(
    eventName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void;
}
