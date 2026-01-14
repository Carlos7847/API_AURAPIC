import { Payment as PrismaPayment } from '@prisma/client';
import { Payment, PaymentProps } from '../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

/**
 * Payment Mapper
 * Converts between Prisma model and Domain entity
 */
export class PaymentMapper {
  /**
   * Map Prisma model to Domain entity
   */
  static toDomain(prisma: PrismaPayment): Payment {
    const props: PaymentProps = {
      id: prisma.id,
      userId: prisma.userId,
      providerId: prisma.providerId,
      preferenceId: prisma.preferenceId,
      providerPaymentId: prisma.providerPaymentId,
      providerCollectorId: prisma.providerCollectorId,
      amount: prisma.amount,
      currency: prisma.currency,
      status: prisma.status as PaymentStatus,
      statusDetail: prisma.statusDetail,
      creditsAmount: prisma.creditsAmount,
      packageId: prisma.packageId,
      description: prisma.description,
      externalReference: prisma.externalReference,
      paymentMethodId: prisma.paymentMethodId,
      paymentTypeId: prisma.paymentTypeId,
      idempotencyKey: prisma.idempotencyKey,
      metadata: prisma.metadata as Record<string, unknown> | null,
      approvedAt: prisma.approvedAt,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };

    return Payment.restore(props);
  }

  /**
   * Map Domain entity to Prisma model data
   */
  static toPrisma(payment: Payment) {
    const props = payment.toObject();

    return {
      id: props.id,
      userId: props.userId,
      providerId: props.providerId,
      preferenceId: props.preferenceId,
      providerPaymentId: props.providerPaymentId,
      providerCollectorId: props.providerCollectorId,
      amount: props.amount,
      currency: props.currency,
      status: props.status,
      statusDetail: props.statusDetail,
      creditsAmount: props.creditsAmount,
      packageId: props.packageId,
      description: props.description,
      externalReference: props.externalReference,
      paymentMethodId: props.paymentMethodId,
      paymentTypeId: props.paymentTypeId,
      idempotencyKey: props.idempotencyKey,
      metadata: props.metadata as never, // Prisma JsonValue compatibility
      approvedAt: props.approvedAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
