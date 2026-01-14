import { Payment } from '../entities/payment.entity';

/**
 * Payment Repository Port (Interface)
 * Defines the contract for payment persistence
 */
export abstract class PaymentRepositoryPort {
  abstract findById(id: string): Promise<Payment | null>;

  /**
   * Find payment by provider payment ID
   */
  abstract findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<Payment | null>;

  abstract findByPreferenceId(preferenceId: string): Promise<Payment | null>;

  abstract findByIdempotencyKey(key: string): Promise<Payment | null>;

  abstract findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: Payment[]; total: number }>;

  abstract create(payment: Payment): Promise<Payment>;

  abstract update(payment: Payment): Promise<Payment>;

  /**
   * Save payment (create or update)
   */
  abstract save(payment: Payment): Promise<void>;
}
