import { SubscriptionRepositoryPort } from '../../domain/ports/subscription.repository.port';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionNotFoundError } from '../../domain/errors/billing.errors';

export class GetUserSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new SubscriptionNotFoundError(userId);
    }

    return subscription;
  }
}
