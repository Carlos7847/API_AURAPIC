import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GetUserSubscriptionUseCase } from '../../application/use-cases/get-user-subscription.use-case';
import { AuthenticatedRequest } from '../../../iam/infrastructure/http/authenticated-request.interface';
import { Subscription } from '../../domain/entities/subscription.entity';

/**
 * Guard to verify user has available credits
 * Use with @UseGuards(CreditGuard) on endpoints that consume credits
 */
@Injectable()
export class CreditGuard implements CanActivate {
  constructor(
    private readonly getUserSubscription: GetUserSubscriptionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & { subscription?: Subscription }>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const subscription = await this.getUserSubscription.execute(user.userId);

      if (!subscription.hasCredits()) {
        throw new ForbiddenException(
          `Insufficient credits. You have ${subscription.creditsRemaining} credits remaining.`,
        );
      }

      // Attach subscription to request for potential use in controller
      request.subscription = subscription;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Unable to verify credits');
    }
  }
}
