import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { PaymentProviderRepositoryPort } from '../../domain/ports/payment-provider.repository.port';
import { PaymentProvider } from '../../domain/entities/payment-provider.entity';
import { PaymentProviderMapper } from './mappers/payment-provider.mapper';
import { HealthStatus } from '../../domain/enums/health-status.enum';

@Injectable()
export class PrismaPaymentProviderRepository
  implements PaymentProviderRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentProvider | null> {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { id },
    });

    return provider ? PaymentProviderMapper.toDomain(provider) : null;
  }

  async findByCode(code: string): Promise<PaymentProvider | null> {
    const provider = await this.prisma.paymentProvider.findUnique({
      where: { code },
    });

    return provider ? PaymentProviderMapper.toDomain(provider) : null;
  }

  async findAll(): Promise<PaymentProvider[]> {
    const providers = await this.prisma.paymentProvider.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return providers.map((provider) =>
      PaymentProviderMapper.toDomain(provider),
    );
  }

  async findAllActive(): Promise<PaymentProvider[]> {
    const providers = await this.prisma.paymentProvider.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return providers.map((provider) =>
      PaymentProviderMapper.toDomain(provider),
    );
  }

  async save(provider: PaymentProvider): Promise<void> {
    const data = PaymentProviderMapper.toPrisma(provider);

    await this.prisma.paymentProvider.update({
      where: { id: provider.id },
      data,
    });
  }

  async updateHealthStatus(
    id: string,
    status: HealthStatus,
    failureCount: number,
  ): Promise<void> {
    await this.prisma.paymentProvider.update({
      where: { id },
      data: {
        healthStatus: status,
        failureCount,
        lastHealthCheck: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
