/**
 * Job Domain Exceptions
 * Errores específicos del dominio de Jobs
 */

export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job with id ${jobId} not found`);
    this.name = 'JobNotFoundError';
  }
}

export class JobUnauthorizedError extends Error {
  constructor(jobId: string, userId: string) {
    super(`User ${userId} is not authorized to access job ${jobId}`);
    this.name = 'JobUnauthorizedError';
  }
}

export class JobAlreadyProcessingError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} is already being processed`);
    this.name = 'JobAlreadyProcessingError';
  }
}

export class JobMaxAttemptsExceededError extends Error {
  constructor(jobId: string, attempts: number) {
    super(`Job ${jobId} exceeded max attempts (${attempts})`);
    this.name = 'JobMaxAttemptsExceededError';
  }
}

export class InvalidJobModeError extends Error {
  constructor(mode: string) {
    super(`Invalid job mode: ${mode}`);
    this.name = 'InvalidJobModeError';
  }
}

export class ImageAssetNotFoundForJobError extends Error {
  constructor(imageId: string) {
    super(`Image asset ${imageId} not found for job processing`);
    this.name = 'ImageAssetNotFoundForJobError';
  }
}

export class InvalidJobDataError extends Error {
  constructor(message: string) {
    super(`Invalid job data: ${message}`);
    this.name = 'InvalidJobDataError';
  }
}

export class JobInvalidStateError extends Error {
  constructor(jobId: string, currentStatus: string, operation: string) {
    super(`Job ${jobId} is in status ${currentStatus}, cannot ${operation}`);
    this.name = 'JobInvalidStateError';
  }
}
