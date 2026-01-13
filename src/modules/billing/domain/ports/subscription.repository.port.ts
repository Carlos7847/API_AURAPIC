import { Subscription } from '../entities/subscription.entity';

export abstract class SubscriptionRepositoryPort {
  /**
   * Find subscription by user ID
   */
  abstract findByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Create a new subscription
   */
  abstract create(subscription: Subscription): Promise<Subscription>;

  /**
   * Save subscription state (update)
   */
  abstract save(subscription: Subscription): Promise<void>;
}
