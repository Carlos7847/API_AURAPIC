import { Injectable } from '@nestjs/common';
import { PaymentProviderRepositoryPort } from '../../domain/ports/payment-provider.repository.port';

export interface PaymentProviderDto {
  code: string;
  name: string;
  displayName: string;
  description: string;
  logoUrl: string | null;
  supportedCurrencies: string[];
  supportedCountries: string[];
  fees: number;
  estimatedTime: string;
  minAmount: number;
  maxAmount: number;
  isHealthy: boolean;
}

export interface ListPaymentProvidersResponse {
  providers: PaymentProviderDto[];
}

/**
 * List Payment Providers Use Case
 * Returns available payment providers for user selection
 */
@Injectable()
export class ListPaymentProvidersUseCase {
  constructor(
    private readonly providerRepository: PaymentProviderRepositoryPort,
  ) {}

  async execute(): Promise<ListPaymentProvidersResponse> {
    const providers = await this.providerRepository.findAllActive();

    return {
      providers: providers.map((provider) => {
        const config = provider.displayConfig;

        return {
          code: provider.code,
          name: provider.name,
          displayName: config?.displayName || provider.name,
          description: config?.description || '',
          logoUrl: config?.logoUrl || null,
          supportedCurrencies: config?.supportedCurrencies || [],
          supportedCountries: config?.supportedCountries || [],
          fees: config?.fees || 0,
          estimatedTime: config?.estimatedTime || 'unknown',
          minAmount: config?.minAmount || 0,
          maxAmount: config?.maxAmount || 999999,
          isHealthy: provider.isHealthy(),
        };
      }),
    };
  }
}
