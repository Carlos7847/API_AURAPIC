import { Job } from '../../../domain/entities/job.entity';
import { JobResponseDto } from '../../../application/dtos/job.response.dto';

/**
 * Mapper: Job Entity -> JobResponseDto
 * Infrastructure Layer
 *
 * Responsabilidad: Convertir entidades de dominio en DTOs para la capa HTTP.
 */
export class JobResponseMapper {
  /**
   * Maps a single Job entity to JobResponseDto
   */
  static toDto(job: Job): JobResponseDto {
    return new JobResponseDto({
      id: job.id,
      userId: job.userId,
      imageId: job.imageId,
      mode: job.mode,
      status: job.status,
      prompt: job.prompt,
      meta: job.meta,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      resultUrl: job.resultUrl,
      errorMessage: job.errorMessage,
      originalFilename: JobResponseMapper.extractOriginalFilename(job),
    });
  }

  /**
   * Safely extracts originalFilename from job metadata
   */
  private static extractOriginalFilename(job: Job): string {
    if (
      job.meta &&
      typeof job.meta === 'object' &&
      'originalFilename' in job.meta &&
      typeof job.meta.originalFilename === 'string'
    ) {
      return job.meta.originalFilename;
    }
    return `Job ${job.id.slice(0, 8)}`;
  }

  /**
   * Maps an array of Job entities to JobResponseDto array
   */
  static toDtoList(jobs: Job[]): JobResponseDto[] {
    return jobs.map((job) => this.toDto(job));
  }
}
