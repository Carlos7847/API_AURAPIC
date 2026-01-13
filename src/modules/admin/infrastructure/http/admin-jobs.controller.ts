import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../iam/infrastructure/guards/roles.guard';
import { Roles } from '../../../iam/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../../iam/domain/enums/user-role.enum';
import { CompleteJobManuallyUseCase } from '../../../jobs/application/use-cases/complete-job-manually.use-case';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobsController {
  constructor(
    private readonly completeJobManually: CompleteJobManuallyUseCase,
  ) {}

  @Post(':id/complete')
  async completeJob(
    @Param('id') id: string,
    @Body('resultUrl') resultUrl: string,
  ) {
    await this.completeJobManually.execute(id, resultUrl);
    return { success: true, message: `Job ${id} manually completed` };
  }
}
