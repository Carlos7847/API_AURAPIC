import { SubscriptionRepositoryPort } from '../../domain/ports/subscription.repository.port';
import { SubscriptionNotFoundError } from '../../domain/errors/billing.errors';

export class DeductCreditUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepositoryPort,
  ) {}

  async execute(userId: string, amount: number = 1): Promise<void> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new SubscriptionNotFoundError(userId);
    }

    // Domain Logic: Validate and Deduct
    subscription.deductCredits(amount);

    await this.subscriptionRepository.save(subscription);
  }
}
