import { PaymentStatus } from '../enums/payment-status.enum';
import { InvalidPaymentStateError } from '../errors/payment.errors';

export interface PaymentProps {
  id: string;
  userId: string;
  providerId: string; // NEW: Payment provider used
  preferenceId: string;
  providerPaymentId: string | null;
  providerCollectorId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusDetail: string | null;
  creditsAmount: number;
  packageId: string | null;
  description: string | null;
  externalReference: string | null;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  metadata: Record<string, unknown> | null;
  idempotencyKey: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Domain Entity
 * Represents a payment transaction in the system
 */
export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get providerId(): string {
    return this.props.providerId;
  }

  get preferenceId(): string {
    return this.props.preferenceId;
  }

  get providerPaymentId(): string | null {
    return this.props.providerPaymentId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get statusDetail(): string | null {
    return this.props.statusDetail;
  }

  get creditsAmount(): number {
    return this.props.creditsAmount;
  }

  get packageId(): string | null {
    return this.props.packageId;
  }

  get approvedAt(): Date | null {
    return this.props.approvedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get description(): string | null {
    return this.props.description;
  }

  get externalReference(): string | null {
    return this.props.externalReference;
  }

  get paymentMethodId(): string | null {
    return this.props.paymentMethodId;
  }

  get paymentTypeId(): string | null {
    return this.props.paymentTypeId;
  }

  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
  }

  // Business Logic

  /**
   * Check if payment is pending
   */
  isPending(): boolean {
    return (
      this.props.status === PaymentStatus.PENDING ||
      this.props.status === PaymentStatus.IN_PROCESS
    );
  }

  /**
   * Check if payment was approved
   */
  isApproved(): boolean {
    return this.props.status === PaymentStatus.APPROVED;
  }

  /**
   * Check if payment is in final state
   */
  isFinal(): boolean {
    return [
      PaymentStatus.APPROVED,
      PaymentStatus.REJECTED,
      PaymentStatus.CANCELLED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CHARGED_BACK,
    ].includes(this.props.status);
  }

  /**
   * Approve payment
   */
  approve(
    providerPaymentId: string,
    paymentMethodId?: string,
    paymentTypeId?: string,
  ): void {
    if (this.isFinal()) {
      throw new InvalidPaymentStateError(this.id, this.props.status, 'approve');
    }

    this.props.status = PaymentStatus.APPROVED;
    this.props.providerPaymentId = providerPaymentId;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    if (paymentMethodId) {
      this.props.paymentMethodId = paymentMethodId;
    }

    if (paymentTypeId) {
      this.props.paymentTypeId = paymentTypeId;
    }
  }

  /**
   * Reject payment
   */
  reject(statusDetail?: string): void {
    if (this.isFinal()) {
      throw new InvalidPaymentStateError(this.id, this.props.status, 'reject');
    }

    this.props.status = PaymentStatus.REJECTED;
    this.props.statusDetail = statusDetail || null;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel payment
   */
  cancel(): void {
    if (this.isFinal()) {
      throw new InvalidPaymentStateError(this.id, this.props.status, 'cancel');
    }

    this.props.status = PaymentStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  /**
   * Set preference ID and transition to PENDING
   * Called after successful provider preference creation
   */
  setPreferenceId(preferenceId: string, externalReference: string): void {
    if (this.props.status !== PaymentStatus.INITIALIZING) {
      throw new InvalidPaymentStateError(
        this.id,
        this.props.status,
        'setPreferenceId',
      );
    }

    this.props.preferenceId = preferenceId;
    this.props.externalReference = externalReference;
    this.props.status = PaymentStatus.PENDING;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark payment as failed during initialization
   * Used in compensation/rollback scenarios
   */
  markAsInitializationFailed(reason: string): void {
    if (this.props.status !== PaymentStatus.INITIALIZING) {
      throw new InvalidPaymentStateError(
        this.id,
        this.props.status,
        'markAsInitializationFailed',
      );
    }

    this.props.status = PaymentStatus.REJECTED;
    this.props.statusDetail = `Initialization failed: ${reason}`;
    this.props.updatedAt = new Date();
  }

  /**
   * Factory method: Create new payment
   */
  static create(
    id: string,
    userId: string,
    providerId: string,
    preferenceId: string,
    amount: number,
    creditsAmount: number,
    packageId: string | null,
    currency: string,
    idempotencyKey: string | null = null,
  ): Payment {
    const now = new Date();

    return new Payment({
      id,
      userId,
      providerId,
      preferenceId,
      providerPaymentId: null,
      providerCollectorId: null,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      statusDetail: null,
      creditsAmount,
      packageId,
      description: null,
      externalReference: null,
      paymentMethodId: null,
      paymentTypeId: null,
      metadata: null,
      idempotencyKey,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Restore from persistence
   */
  static restore(props: PaymentProps): Payment {
    return new Payment(props);
  }

  /**
   * Get all properties (for persistence)
   */
  toObject(): PaymentProps {
    return { ...this.props };
  }
}
