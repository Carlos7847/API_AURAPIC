import { PaymentProvider as PrismaPaymentProvider } from '@prisma/client';
import { PaymentProvider } from '../../../domain/entities/payment-provider.entity';
import {
  PaymentProviderProps,
  DisplayConfig,
} from '../../../domain/entities/payment-provider.entity';
import { HealthStatus } from '../../../domain/enums/health-status.enum';

export class PaymentProviderMapper {
  /**
   * Map Prisma model to Domain entity
   */
  static toDomain(prisma: PrismaPaymentProvider): PaymentProvider {
    const props: PaymentProviderProps = {
      id: prisma.id,
      code: prisma.code,
      name: prisma.name,
      isActive: prisma.isActive,
      displayConfig: prisma.displayConfig as DisplayConfig | null,
      healthStatus: prisma.healthStatus as HealthStatus,
      lastHealthCheck: prisma.lastHealthCheck,
      failureCount: prisma.failureCount,
      lastFailureAt: prisma.lastFailureAt,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };

    return PaymentProvider.restore(props);
  }

  /**
   * Map Domain entity to Prisma model data
   */
  static toPrisma(provider: PaymentProvider) {
    const props = provider.toObject();

    return {
      id: props.id,
      code: props.code,
      name: props.name,
      isActive: props.isActive,
      displayConfig: props.displayConfig as never, // Prisma JsonValue compatibility
      healthStatus: props.healthStatus,
      lastHealthCheck: props.lastHealthCheck,
      failureCount: props.failureCount,
      lastFailureAt: props.lastFailureAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
