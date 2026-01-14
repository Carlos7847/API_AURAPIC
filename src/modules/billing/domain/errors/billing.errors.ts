export class InsufficientCreditsError extends Error {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class SubscriptionCreationFailedError extends Error {
  constructor(userId: string, cause?: unknown) {
    super(`Failed to create subscription for user: ${userId}`);
    this.name = 'SubscriptionCreationFailedError';
    this.cause = cause;
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
