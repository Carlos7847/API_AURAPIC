import { Module } from '@nestjs/common';

// Ports
import { SubscriptionRepositoryPort } from './domain/ports/subscription.repository.port';

// Repository
import { PrismaSubscriptionRepository } from './infrastructure/persistence/prisma-subscription.repository';

// Use Cases
import { DeductCreditUseCase } from './application/use-cases/deduct-credit.use-case';
import { RefundCreditUseCase } from './application/use-cases/refund-credit.use-case';
import { GetUserSubscriptionUseCase } from './application/use-cases/get-user-subscription.use-case';

// Event Handlers
import { PaymentApprovedHandler } from './application/event-handlers/payment-approved.handler';

// Guards
import { CreditGuard } from './infrastructure/guards/credit.guard';

@Module({
  providers: [
    // Repository binding
    {
      provide: SubscriptionRepositoryPort,
      useClass: PrismaSubscriptionRepository,
    },

    // Use Cases
    {
      provide: DeductCreditUseCase,
      useFactory: (repo: SubscriptionRepositoryPort) => {
        return new DeductCreditUseCase(repo);
      },
      inject: [SubscriptionRepositoryPort],
    },
    {
      provide: RefundCreditUseCase,
      useFactory: (repo: SubscriptionRepositoryPort) => {
        return new RefundCreditUseCase(repo);
      },
      inject: [SubscriptionRepositoryPort],
    },
    {
      provide: GetUserSubscriptionUseCase,
      useFactory: (repo: SubscriptionRepositoryPort) => {
        return new GetUserSubscriptionUseCase(repo);
      },
      inject: [SubscriptionRepositoryPort],
    },

    // Event Handlers
    PaymentApprovedHandler,

    // Guards
    CreditGuard,
  ],
  exports: [
    SubscriptionRepositoryPort,
    DeductCreditUseCase,
    RefundCreditUseCase,
    GetUserSubscriptionUseCase,
    CreditGuard,
  ],
})
export class BillingModule {}
