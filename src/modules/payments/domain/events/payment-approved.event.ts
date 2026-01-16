import { DomainEvent } from 'src/shared/events/domain/domain-event';

export interface PaymentApprovedEventPayload {
  paymentId: string;
  userId: string;
  creditsAmount: number;
  amount: number;
  currency: string;
  providerPaymentId: string;
}

/**
 * Domain Event: Payment Approved
 * Published when a payment is successfully approved
 *
 * Subscribers:
 * - Billing module: Add credits to user subscription
 * - Notifications module: Send payment confirmation email
 * - Analytics module: Track revenue
 */
export class PaymentApprovedEvent implements DomainEvent {
  readonly eventName = 'payment.approved';
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;

  constructor(data: PaymentApprovedEventPayload) {
    this.occurredOn = new Date();
    this.payload = data as unknown as Record<string, unknown>;
  }

  get data(): PaymentApprovedEventPayload {
    return this.payload as unknown as PaymentApprovedEventPayload;
  }
}
