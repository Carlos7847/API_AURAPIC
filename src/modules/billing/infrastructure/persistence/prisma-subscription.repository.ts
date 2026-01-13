import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { SubscriptionRepositoryPort } from '../../domain/ports/subscription.repository.port';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionMapper } from './mappers/subscription.mapper';

@Injectable()
export class PrismaSubscriptionRepository
  implements SubscriptionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const prismaSubscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!prismaSubscription) {
      return null;
    }

    return SubscriptionMapper.toDomain(prismaSubscription);
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const prismaSubscription = await this.prisma.subscription.create({
      data: SubscriptionMapper.toPrisma(subscription),
    });

    return SubscriptionMapper.toDomain(prismaSubscription);
  }

  async save(subscription: Subscription): Promise<void> {
    // Persist current state of the domain entity
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: SubscriptionMapper.toPrisma(subscription),
    });
  }
}
