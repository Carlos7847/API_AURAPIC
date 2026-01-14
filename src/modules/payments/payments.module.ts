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

// Infrastructure Implementations
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { PrismaCreditPackageRepository } from './infrastructure/persistence/prisma-credit-package.repository';
import { PrismaPaymentProviderRepository } from './infrastructure/persistence/prisma-payment-provider.repository';
import { MercadoPagoAdapter } from './infrastructure/adapters/mercadopago.adapter';
import { PaymentProviderFactory } from './application/services/payment-provider.factory';

// Use Cases
import { CreatePreferenceUseCase } from './application/use-cases/create-preference.use-case';
import { ProcessWebhookUseCase } from './application/use-cases/process-webhook.use-case';
import { ListPackagesUseCase } from './application/use-cases/list-packages.use-case';
import { ListPaymentProvidersUseCase } from './application/use-cases/list-payment-providers.use-case';

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

    {
      provide: PaymentProviderPort,
      useClass: MercadoPagoAdapter,
    },

    // Services
    PaymentProviderFactory,

    // Use Cases
    CreatePreferenceUseCase,
    ProcessWebhookUseCase,
    ListPackagesUseCase,
    ListPaymentProvidersUseCase,
  ],
  exports: [PaymentRepositoryPort, CreditPackageRepositoryPort],
})
export class PaymentsModule {}
