import { Injectable } from '@nestjs/common';
import { EventBusPort } from '../domain/event-bus.port';
import { DomainEvent } from '../domain/domain-event';
import { LoggerPort } from '../../logger/domain/logger.port';

/**
 * In-Memory Event Bus Implementation
 * Simple pub/sub for Domain Events
 *
 * Future: Replace with Bull/Redis for distributed systems
 */
@Injectable()
export class InMemoryEventBus extends EventBusPort {
  private handlers = new Map<
    string,
    Array<(event: DomainEvent) => Promise<void>>
  >();

  constructor(private readonly logger: LoggerPort) {
    super();
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName) || [];

    this.logger.log(
      `Publishing event: ${event.eventName} (${eventHandlers.length} handlers)`,
      InMemoryEventBus.name,
    );

    // Execute all handlers in parallel
    await Promise.all(
      eventHandlers.map((handler) =>
        handler(event).catch((error) => {
          this.logger.error(
            `Error handling event ${event.eventName}`,
            error instanceof Error ? error.stack : String(error),
            InMemoryEventBus.name,
          );
        }),
      ),
    );
  }

  subscribe(
    eventName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    this.handlers.get(eventName)!.push(handler);

    this.logger.debug(
      `Subscribed to event: ${eventName}`,
      InMemoryEventBus.name,
    );
  }
}
