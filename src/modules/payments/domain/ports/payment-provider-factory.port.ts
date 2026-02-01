import { PaymentProviderPort } from './payment-provider.port';

/**
 * Payment Provider Factory Port
 * Abstraction for getting the correct payment adapter based on provider code
 *
 * This interface lives in Domain layer, while the implementation
 * lives in Infrastructure layer (respecting Dependency Rule)
 */
export abstract class PaymentProviderFactoryPort {
  /**
   * Get the payment adapter for a specific provider
   * @param providerCode - The code identifying the provider (e.g., 'mercadopago')
   * @returns The payment provider adapter
   * @throws UnsupportedPaymentProviderError if provider is not supported
   */
  abstract getAdapter(providerCode: string): PaymentProviderPort;

  /**
   * Check if a provider code is supported
   * @param providerCode - The code to check
   * @returns true if the provider is supported
   */
  abstract isSupported(providerCode: string): boolean;
}
