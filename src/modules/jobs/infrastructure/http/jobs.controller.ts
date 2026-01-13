import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Inject,
} from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/modules/iam/infrastructure/http/authenticated-request.interface';
import { CreateJobUseCase } from '../../application/use-cases/create-job.use-case';
import { GetJobUseCase } from '../../application/use-cases/get-job.use-case';
import { ListUserJobsUseCase } from '../../application/use-cases/list-user-jobs.use-case';
import { CancelJobUseCase } from '../../application/use-cases/cancel-job.use-case';
import { CreateJobDto } from '../../application/dtos/create-job.dto';
import { JobResponseDto } from '../../application/dtos/job.response.dto';
import { JwtAuthGuard } from '../../../iam/infrastructure/guards/jwt-auth.guard';
import { JobStatus } from '../../domain/enums/job-status.enum';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { JobResponseMapper } from './mappers/job-response.mapper';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * Jobs Controller
 * Primary Adapter (Driving Adapter) - Escucha HTTP
 *
 * Endpoints:
 * - POST /jobs → Crear job (Producer: encola para procesamiento)
 * - GET /jobs/:id → Obtener estado de job
 * - GET /jobs → Listar jobs del usuario
 * - DELETE /jobs/:id → Cancelar job
 */
@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    @Inject(CreateJobUseCase)
    private readonly createJobUseCase: CreateJobUseCase,
    @Inject(GetJobUseCase)
    private readonly getJobUseCase: GetJobUseCase,
    @Inject(ListUserJobsUseCase)
    private readonly listUserJobsUseCase: ListUserJobsUseCase,
    @Inject(CancelJobUseCase)
    private readonly cancelJobUseCase: CancelJobUseCase,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * POST /jobs
   * Crear nuevo job de procesamiento
   */
  @ApiOperation({ summary: 'Create a new image processing job' })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient credits or unauthorized',
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateJobDto,
  ): Promise<JobResponseDto> {
    const userId = req.user.id;
    this.logger.debug(`Creating job for user ${userId}`, JobsController.name);
    const job = await this.createJobUseCase.execute(userId, dto);
    return JobResponseMapper.toDto(job);
  }

  /**
   * GET /jobs/:id
   * Obtener estado de un job específico
   */
  @ApiOperation({ summary: 'Get a specific job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Job found',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized - not job owner' })
  @Get(':id')
  async getJob(
    @Req() req: AuthenticatedRequest,
    @Param('id') jobId: string,
  ): Promise<JobResponseDto> {
    const userId = req.user.id;
    this.logger.debug(
      `Getting job ${jobId} for user ${userId}`,
      JobsController.name,
    );
    const job = await this.getJobUseCase.execute(userId, jobId);
    return JobResponseMapper.toDto(job);
  }

  /**
   * GET /jobs
   * Listar todos los jobs del usuario con filtros opcionales
   */
  @ApiOperation({ summary: 'List all jobs for the authenticated user' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: JobStatus,
    description: 'Filter by job status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max items per page (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Pagination offset (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs list retrieved successfully',
  })
  @Get()
  async listJobs(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: JobStatus,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ): Promise<{ data: JobResponseDto[]; total: number }> {
    const userId = req.user.id;
    this.logger.debug(
      `Listing jobs for user ${userId}, status: ${status}, limit: ${limit}, offset: ${offset}`,
      JobsController.name,
    );
    const result = await this.listUserJobsUseCase.execute(userId, {
      status,
      limit,
      offset,
    });
    return {
      data: JobResponseMapper.toDtoList(result.data),
      total: result.total,
    };
  }

  /**
   * DELETE /jobs/:id
   * Cancelar un job
   */
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiParam({ name: 'id', description: 'Job ID to cancel', type: String })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized - not job owner' })
  @ApiResponse({
    status: 400,
    description: 'Job cannot be cancelled (already completed/failed)',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelJob(
    @Req() req: AuthenticatedRequest,
    @Param('id') jobId: string,
  ): Promise<void> {
    const userId = req.user.id;
    this.logger.debug(
      `Cancelling job ${jobId} for user ${userId}`,
      JobsController.name,
    );
    await this.cancelJobUseCase.execute(userId, jobId);
  }
}
