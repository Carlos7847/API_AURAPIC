import { PaymentProvider } from '../entities/payment-provider.entity';
import { HealthStatus } from '../enums/health-status.enum';

/**
 * Payment Provider Repository Port
 * Manages payment provider persistence
 */
export abstract class PaymentProviderRepositoryPort {
  abstract findById(id: string): Promise<PaymentProvider | null>;

  abstract findByCode(code: string): Promise<PaymentProvider | null>;

  abstract findAll(): Promise<PaymentProvider[]>;

  abstract findAllActive(): Promise<PaymentProvider[]>;

  abstract save(provider: PaymentProvider): Promise<void>;

  abstract updateHealthStatus(
    id: string,
    status: HealthStatus,
    failureCount: number,
  ): Promise<void>;
}
