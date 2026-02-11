import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/jwt-auth.guard';
import { ActiveUser } from 'src/modules/iam/infrastructure/decorators/active-user.decorator';
import type { ActiveUserData } from 'src/modules/iam/domain/interfaces/active-user.interface';
import {
  GetDashboardStatsUseCase,
  DashboardStatsResult,
} from '../../application/use-cases/get-dashboard-stats.use-case';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
  ) {}

  @ApiOperation({
    summary: 'Get dashboard statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics returned successfully',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(
    @ActiveUser() user: ActiveUserData,
  ): Promise<DashboardStatsResult> {
    return this.getDashboardStatsUseCase.execute(user.userId);
  }
}
