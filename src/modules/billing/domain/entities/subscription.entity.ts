import {
  InsufficientCreditsError,
  SubscriptionNotActiveError,
} from '../errors/billing.errors';

// Business Rules for Credits
export const FREE_TIER_INITIAL_CREDITS = 10;
export const PREMIUM_TIER_INITIAL_CREDITS = 100;

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

export interface SubscriptionProps {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  creditsRemaining: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  constructor(private props: SubscriptionProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get plan(): SubscriptionPlan {
    return this.props.plan;
  }
  get status(): SubscriptionStatus {
    return this.props.status;
  }
  get creditsRemaining(): number {
    return this.props.creditsRemaining;
  }
  get currentPeriodStart(): Date {
    return this.props.currentPeriodStart;
  }
  get currentPeriodEnd(): Date | null {
    return this.props.currentPeriodEnd;
  }
  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }
  get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public hasCredits(amount: number = 1): boolean {
    return this.props.creditsRemaining >= amount && this.isActive();
  }

  public isActive(): boolean {
    return this.props.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * Deducts credits from the subscription
   * Throws error if insufficient
   */
  public deductCredits(amount: number = 1): void {
    if (!this.isActive()) {
      throw new SubscriptionNotActiveError(this.userId, this.status);
    }

    if (this.props.creditsRemaining < amount) {
      throw new InsufficientCreditsError(
        this.userId,
        this.props.creditsRemaining,
        amount,
      );
    }
    this.props.creditsRemaining -= amount;
    this.props.updatedAt = new Date();
  }

  /**
   * Adds credits (e.g. refund or purchase)
   */
  public addCredits(amount: number): void {
    this.props.creditsRemaining += amount;
    this.props.updatedAt = new Date();
  }

  /**
   * Factory method to create a new free subscription
   */
  static createFree(userId: string, id: string): Subscription {
    const now = new Date();
    return new Subscription({
      id,
      userId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      creditsRemaining: FREE_TIER_INITIAL_CREDITS,
      currentPeriodStart: now,
      currentPeriodEnd: null, // No end date for free tier
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Restore subscription from database
   */
  static restore(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }
}
