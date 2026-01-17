import { Injectable } from '@nestjs/common';
import { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { UnsupportedPaymentProviderError } from '../../domain/errors/payment.errors';
import { MercadoPagoAdapter } from '../../infrastructure/adapters/mercadopago.adapter';
import { PAYMENT_PROVIDERS } from '../../domain/constants/payment.constants';

/**
 * Payment Provider Factory (Strategy Pattern)
 * Returns the correct payment adapter based on provider code
 */
@Injectable()
export class PaymentProviderFactory {
  private readonly supportedProviders = new Set<string>([
    PAYMENT_PROVIDERS.MERCADO_PAGO,
    // Add more as implemented
  ]);

  constructor(
    private readonly mercadoPagoAdapter: MercadoPagoAdapter,
    // Future: Uncomment when Culqi is ready
    // private readonly culqiAdapter: CulqiAdapter,
    // private readonly cryptoAdapter: CryptoAdapter,
  ) {}

  getAdapter(providerCode: string): PaymentProviderPort {
    const normalized = providerCode.toLowerCase();

    if (!this.isSupported(normalized)) {
      throw new UnsupportedPaymentProviderError(providerCode);
    }

    switch (normalized) {
      case PAYMENT_PROVIDERS.MERCADO_PAGO:
        return this.mercadoPagoAdapter;

      // case PAYMENT_PROVIDERS.CULQI:
      //   return this.culqiAdapter;

      // Future providers:
      // case PAYMENT_PROVIDERS.CRYPTO:
      //   return this.cryptoAdapter;

      default:
        throw new UnsupportedPaymentProviderError(providerCode);
    }
  }

  isSupported(providerCode: string): boolean {
    return this.supportedProviders.has(providerCode.toLowerCase());
  }
}
