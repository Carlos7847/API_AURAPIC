import { Injectable } from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import { PaymentProviderRepositoryPort } from '../../domain/ports/payment-provider.repository.port';
import { PaymentResponseDto } from '../dtos/payment.response.dto';
import { PaymentProvider } from '../../domain/entities/payment-provider.entity';

@Injectable()
export class ListUserPaymentsUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly paymentProviderRepository: PaymentProviderRepositoryPort,
  ) {}

  async execute(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: PaymentResponseDto[]; total: number }> {
    // 1. Fetch payments
    const { data: payments, total } = await this.paymentRepository.findByUserId(
      userId,
      { limit, offset },
    );

    if (payments.length === 0) {
      return { data: [], total: 0 };
    }

    // 2. Fetch all providers to resolve providerCode
    // Optimization: We could cache this or use a Map if providers list is static
    const providers = await this.paymentProviderRepository.findAll();
    const providersMap = new Map<string, PaymentProvider>();
    providers.forEach((p) => providersMap.set(p.id, p));

    // 3. Map to DTO
    const dtos = payments.map((payment) => {
      const provider = providersMap.get(payment.providerId);
      const providerCode = provider ? provider.code : 'unknown';

      return new PaymentResponseDto({
        id: payment.id,
        providerCode,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description || undefined,
        creditsAmount: payment.creditsAmount,
        packageId: payment.packageId || undefined,
        paymentMethodId: payment.paymentMethodId || undefined,
        paymentTypeId: payment.paymentTypeId || undefined,
        createdAt: payment.createdAt,
        approvedAt: payment.approvedAt || undefined,
      });
    });

    return { data: dtos, total };
  }
}
