import { Inject, Injectable } from '@nestjs/common';
import { PaymentProviderFactoryPort } from '../../domain/ports/payment-provider-factory.port';
import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { UnsupportedPaymentProviderError } from '../../domain/errors/payment.errors';

/**
 * Token for injecting the provider registry Map
 * This allows adding new providers without modifying the factory
 */
export const PAYMENT_PROVIDER_REGISTRY = Symbol('PAYMENT_PROVIDER_REGISTRY');

/**
 * Type alias for the provider registry
 */
export type PaymentProviderRegistry = Map<string, PaymentProviderPort>;

/**
 * Payment Provider Factory Implementation
 *
 * Uses Registry Pattern (Map-based) instead of switch statement:
 * - Satisfies Open/Closed Principle: Add new providers by registering in module, not modifying factory
 * - Satisfies Dependency Rule: Lives in Infrastructure, implements Domain port
 *
 * @implements {PaymentProviderFactoryPort}
 */
@Injectable()
export class PaymentProviderFactory implements PaymentProviderFactoryPort {
  constructor(
    @Inject(PAYMENT_PROVIDER_REGISTRY)
    private readonly providerRegistry: PaymentProviderRegistry,
  ) {}

  getAdapter(providerCode: string): PaymentProviderPort {
    const normalized = providerCode.toLowerCase();
    const adapter = this.providerRegistry.get(normalized);

    if (!adapter) {
      throw new UnsupportedPaymentProviderError(providerCode);
    }

    return adapter;
  }

  isSupported(providerCode: string): boolean {
    return this.providerRegistry.has(providerCode.toLowerCase());
  }
}
