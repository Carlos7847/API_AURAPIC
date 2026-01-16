export interface DomainEvent {
  /**
   * Event name (e.g., 'payment.approved', 'user.registered')
   */
  readonly eventName: string;

  /**
   * When the event occurred
   */
  readonly occurredOn: Date;

  /**
   * Event payload (strongly typed per event)
   */
  readonly payload: Record<string, unknown>;
}
