import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import { CreditPackageRepositoryPort } from '../../domain/ports/credit-package.repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import {
  PackageNotFoundError,
  PackageInactiveError,
} from '../../domain/errors/payment.errors';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';
import { PaymentProviderRepositoryPort } from '../../domain/ports/payment-provider.repository.port';
import { PaymentProviderFactory } from '../services/payment-provider.factory';
import {
  PaymentProviderNotFoundError,
  PaymentProviderNotAvailableError,
} from '../../domain/errors/payment.errors';
import { PAYMENT_REFERENCE_PREFIX } from '../../domain/constants/payment.constants';

export interface CreatePreferenceRequest {
  userId: string;
  packageId: string;
  providerCode: string; // NEW: Selected payment provider
  idempotencyKey?: string; // NEW: For duplicate prevention
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

export interface CreatePreferenceResponse {
  paymentId: string;
  preferenceId: string;
  initPoint: string;
  amount: number;
  currency: string;
  credits: number;
}

/**
 * Create Payment Preference Use Case
 * Creates a Mercado Pago preference and stores payment record
 */
@Injectable()
export class CreatePreferenceUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly packageRepository: CreditPackageRepositoryPort,
    private readonly providerRepository: PaymentProviderRepositoryPort,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly config: EnvironmentConfigService,
  ) {}

  async execute(
    request: CreatePreferenceRequest,
  ): Promise<CreatePreferenceResponse> {
    // 1. Check for duplicate request (idempotency)
    if (request.idempotencyKey) {
      const existingPayment = await this.paymentRepository.findByIdempotencyKey(
        request.idempotencyKey,
      );

      if (existingPayment) {
        // Return existing payment to prevent duplicate
        return {
          paymentId: existingPayment.id,
          preferenceId: existingPayment.preferenceId,
          initPoint: '', // Would need to fetch from provider
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          credits: existingPayment.creditsAmount,
        };
      }
    }

    // 2. Validate payment provider exists and is available
    const provider = await this.providerRepository.findByCode(
      request.providerCode,
    );

    if (!provider) {
      throw new PaymentProviderNotFoundError(request.providerCode);
    }

    if (!provider.isAvailable()) {
      throw new PaymentProviderNotAvailableError(
        request.providerCode,
        `Provider is ${provider.healthStatus}`,
      );
    }

    // 2. Get the correct adapter for this provider
    const adapter = this.providerFactory.getAdapter(request.providerCode);

    // 3. Validate package exists and is active
    const packageEntity = await this.packageRepository.findById(
      request.packageId,
    );

    if (!packageEntity) {
      throw new PackageNotFoundError(request.packageId);
    }

    if (!packageEntity.isAvailable()) {
      throw new PackageInactiveError(packageEntity.id, packageEntity.name);
    }

    // 4. Create payment record
    const paymentId = randomUUID();
    const externalReference = `${PAYMENT_REFERENCE_PREFIX}${paymentId}`;

    const payment = Payment.create(
      paymentId,
      request.userId,
      provider.id, // NEW: Provider ID
      '', // preferenceId will be set after creation
      packageEntity.price,
      packageEntity.credits,
      packageEntity.id,
      packageEntity.currency,
    );

    // 5. Create preference using the selected provider's adapter
    const frontendUrl = this.config.getFrontendUrl();
    const notificationUrl = this.config.getMercadoPagoNotificationUrl();

    const preference = await adapter.createPreference({
      title: `${packageEntity.name} - ${packageEntity.credits} créditos`,
      description: packageEntity.description || undefined,
      quantity: 1,
      unitPrice: packageEntity.price,
      currency: packageEntity.currency,
      externalReference,
      backUrls: {
        success: request.successUrl || `${frontendUrl}/payment/success`,
        failure: request.failureUrl || `${frontendUrl}/payment/failure`,
        pending: request.pendingUrl || `${frontendUrl}/payment/pending`,
      },
      notificationUrl,
      metadata: {
        paymentId,
        userId: request.userId,
        packageId: packageEntity.id,
      },
    });

    // 6. Update payment with preferenceId and save
    const updatedPayment = Payment.restore({
      ...payment.toObject(),
      preferenceId: preference.id,
      externalReference,
    });

    await this.paymentRepository.create(updatedPayment);

    return {
      paymentId: updatedPayment.id,
      preferenceId: preference.id,
      initPoint: preference.initPoint,
      amount: packageEntity.price,
      currency: packageEntity.currency,
      credits: packageEntity.credits,
    };
  }
}
