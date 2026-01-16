export interface ProcessedEventProps {
  id: string;
  eventId: string;
  eventName: string;
  processedAt: Date;
  processedBy: string;
  metadata: Record<string, unknown> | null;
}

/**
 * ProcessedEvent Domain Entity
 * Tracks successfully processed events for idempotency
 */
export class ProcessedEvent {
  private constructor(private readonly props: ProcessedEventProps) {}

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get eventName(): string {
    return this.props.eventName;
  }

  get processedBy(): string {
    return this.props.processedBy;
  }

  /**
   * Factory: Create processed event record
   */
  static create(
    id: string,
    eventId: string,
    eventName: string,
    processedBy: string,
    metadata?: Record<string, unknown>,
  ): ProcessedEvent {
    return new ProcessedEvent({
      id,
      eventId,
      eventName,
      processedAt: new Date(),
      processedBy,
      metadata: metadata || null,
    });
  }

  /**
   * Factory: Restore from persistence
   */
  static restore(props: ProcessedEventProps): ProcessedEvent {
    return new ProcessedEvent(props);
  }

  toObject(): ProcessedEventProps {
    return { ...this.props };
  }
}
