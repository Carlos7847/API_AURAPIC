export class InsufficientCreditsError extends Error {
  constructor(
    public readonly userId: string,
    public readonly available: number,
    public readonly required: number,
  ) {
    super(
      `User ${userId} has insufficient credits. Required: ${required}, Available: ${available}`,
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`Subscription not found for user ${userId}`);
    this.name = 'SubscriptionNotFoundError';
  }
}

export class SubscriptionNotActiveError extends Error {
  constructor(
    public readonly userId: string,
    public readonly status: string,
  ) {
    super(`Subscription for user ${userId} is ${status}, not ACTIVE`);
    this.name = 'SubscriptionNotActiveError';
  }
}
