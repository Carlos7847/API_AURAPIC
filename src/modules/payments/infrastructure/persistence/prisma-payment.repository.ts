import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentMapper } from './mappers/payment.mapper';

/**
 * Prisma Payment Repository
 * Implements PaymentRepositoryPort using Prisma
 */
@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { providerPaymentId },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async findByPreferenceId(preferenceId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { preferenceId },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: Payment[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      data: payments.map((p) => PaymentMapper.toDomain(p)),
      total,
    };
  }

  async create(payment: Payment): Promise<Payment> {
    const data = PaymentMapper.toPrisma(payment);

    const created = await this.prisma.payment.create({
      data,
    });

    return PaymentMapper.toDomain(created);
  }

  async update(payment: Payment): Promise<Payment> {
    const data = PaymentMapper.toPrisma(payment);

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data,
    });

    return PaymentMapper.toDomain(updated);
  }

  async save(payment: Payment): Promise<void> {
    const data = PaymentMapper.toPrisma(payment);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data,
    });
  }
}
