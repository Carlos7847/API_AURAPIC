import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO para crear un nuevo job
 */
export class CreateJobDto {
  @IsString()
  imageId: string;

  @IsString()
  mode: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
