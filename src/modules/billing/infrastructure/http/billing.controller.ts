import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/jwt-auth.guard';
import { type AuthenticatedRequest } from 'src/modules/iam/infrastructure/http/authenticated-request.interface';
import { GetUserSubscriptionUseCase } from '../../application/use-cases/get-user-subscription.use-case';
import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly getSubscriptionUseCase: GetUserSubscriptionUseCase,
  ) {}

  @ApiOperation({ summary: 'Get user subscription and credits' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details with credits remaining',
    type: SubscriptionResponseDto,
  })
  @Get('subscription')
  async getSubscription(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const subscription = await this.getSubscriptionUseCase.execute(userId);

    return new SubscriptionResponseDto({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      creditsRemaining: subscription.creditsRemaining,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  }
}
