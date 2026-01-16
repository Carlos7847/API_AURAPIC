export type OutboxEventStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface OutboxEventProps {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

/**
 * OutboxEvent Domain Entity
 * Represents a domain event persisted for guaranteed delivery
 */
export class OutboxEvent {
  private constructor(private readonly props: OutboxEventProps) {}

  get id(): string {
    return this.props.id;
  }

  get eventName(): string {
    return this.props.eventName;
  }

  get payload(): Record<string, unknown> {
    return this.props.payload;
  }

  get status(): OutboxEventStatus {
    return this.props.status;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get error(): string | null {
    return this.props.error;
  }

  get processedAt(): Date | null {
    return this.props.processedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Check if event can be retried
   */
  canRetry(): boolean {
    return this.props.attempts < this.props.maxAttempts;
  }

  /**
   * Mark as processed successfully
   */
  markProcessed(): void {
    this.props.status = 'PROCESSED';
    this.props.processedAt = new Date();
  }

  /**
   * Record failure and increment attempts
   */
  recordFailure(error: string): void {
    this.props.attempts += 1;
    this.props.error = error;

    if (!this.canRetry()) {
      this.props.status = 'FAILED';
    }
  }

  /**
   * Factory: Create new outbox event
   */
  static create(
    id: string,
    eventName: string,
    payload: Record<string, unknown>,
  ): OutboxEvent {
    return new OutboxEvent({
      id,
      eventName,
      payload,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      error: null,
      createdAt: new Date(),
      processedAt: null,
    });
  }

  /**
   * Factory: Restore from persistence
   */
  static restore(props: OutboxEventProps): OutboxEvent {
    return new OutboxEvent(props);
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): OutboxEventProps {
    return { ...this.props };
  }
}
