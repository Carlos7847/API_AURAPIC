import { Subscription as PrismaSubscription } from '@prisma/client';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../../domain/entities/subscription.entity';

export class SubscriptionMapper {
  static toDomain(prisma: PrismaSubscription): Subscription {
    return Subscription.restore({
      id: prisma.id,
      userId: prisma.userId,
      plan: prisma.plan as SubscriptionPlan,
      status: prisma.status as SubscriptionStatus,
      creditsRemaining: prisma.creditsRemaining,
      currentPeriodStart: prisma.currentPeriodStart,
      currentPeriodEnd: prisma.currentPeriodEnd,
      stripeCustomerId: prisma.stripeCustomerId,
      stripeSubscriptionId: prisma.stripeSubscriptionId,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrisma(domain: Subscription) {
    return {
      id: domain.id,
      userId: domain.userId,
      plan: domain.plan,
      status: domain.status,
      creditsRemaining: domain.creditsRemaining,
      currentPeriodStart: domain.currentPeriodStart,
      currentPeriodEnd: domain.currentPeriodEnd,
      stripeCustomerId: domain.stripeCustomerId,
      stripeSubscriptionId: domain.stripeSubscriptionId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
