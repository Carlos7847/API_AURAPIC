import { Module } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { EnvironmentConfigModule } from 'src/shared/config/infrastructure/environment-config.module';
import { BillingModule } from '../billing/billing.module';
import { LoggerModule } from 'src/shared/logger/logger.module';

// Domain Ports
import { PaymentRepositoryPort } from './domain/ports/payment.repository.port';
import { CreditPackageRepositoryPort } from './domain/ports/credit-package.repository.port';
import { PaymentProviderPort } from './domain/ports/payment-provider.port';
import { PaymentProviderRepositoryPort } from './domain/ports/payment-provider.repository.port';
import { PaymentProviderFactoryPort } from './domain/ports/payment-provider-factory.port';

// Infrastructure Implementations
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { PrismaCreditPackageRepository } from './infrastructure/persistence/prisma-credit-package.repository';
import { PrismaPaymentProviderRepository } from './infrastructure/persistence/prisma-payment-provider.repository';
import { MercadoPagoAdapter } from './infrastructure/adapters/mercadopago.adapter';
import {
  PaymentProviderFactory,
  PAYMENT_PROVIDER_REGISTRY,
} from './infrastructure/services/payment-provider.factory';

// Domain Constants
import { PAYMENT_PROVIDERS } from './domain/constants/payment.constants';

// Use Cases
import { CreatePreferenceUseCase } from './application/use-cases/create-preference.use-case';
import { ProcessWebhookUseCase } from './application/use-cases/process-webhook.use-case';
import { ListPackagesUseCase } from './application/use-cases/list-packages.use-case';
import { ListPaymentProvidersUseCase } from './application/use-cases/list-payment-providers.use-case';
import { ListUserPaymentsUseCase } from './application/use-cases/list-user-payments.use-case';

// Controllers
import { PaymentsController } from './infrastructure/http/payments.controller';

@Module({
  imports: [
    EnvironmentConfigModule,
    BillingModule, // For subscription updates in webhook
    LoggerModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PrismaService,

    // Repository Implementations
    {
      provide: PaymentRepositoryPort,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: CreditPackageRepositoryPort,
      useClass: PrismaCreditPackageRepository,
    },

    {
      provide: PaymentProviderRepositoryPort,
      useClass: PrismaPaymentProviderRepository,
    },

    // Payment Provider Adapters (concrete classes)
    MercadoPagoAdapter,

    {
      provide: PaymentProviderPort,
      useClass: MercadoPagoAdapter,
    },

    // Provider Registry (Map-based for Open/Closed compliance)
    // To add a new provider: 1) Create adapter, 2) Add to this Map
    {
      provide: PAYMENT_PROVIDER_REGISTRY,
      useFactory: (mercadoPago: MercadoPagoAdapter) => {
        const registry = new Map<string, PaymentProviderPort>();
        registry.set(PAYMENT_PROVIDERS.MERCADO_PAGO, mercadoPago);
        // Future: registry.set(PAYMENT_PROVIDERS.CULQI, culqiAdapter);
        // Future: registry.set(PAYMENT_PROVIDERS.CRYPTO, cryptoAdapter);
        return registry;
      },
      inject: [MercadoPagoAdapter],
    },

    // Factory bound to abstract port (Dependency Rule compliance)
    {
      provide: PaymentProviderFactoryPort,
      useClass: PaymentProviderFactory,
    },

    // Use Cases
    CreatePreferenceUseCase,
    ProcessWebhookUseCase,
    ListPackagesUseCase,
    ListPaymentProvidersUseCase,
    ListUserPaymentsUseCase,
  ],
  exports: [
    PaymentRepositoryPort,
    CreditPackageRepositoryPort,
    ListUserPaymentsUseCase,
  ],
})
export class PaymentsModule {}
