import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Infrastructure exceptions mapping
 * Convierte domain exceptions a HTTP responses
 */

export class JobNotFoundHttpException extends HttpException {
  constructor(jobId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Job with id ${jobId} not found`,
        error: 'JobNotFound',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class JobUnauthorizedHttpException extends HttpException {
  constructor(jobId: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Not authorized to access this job`,
        error: 'JobUnauthorized',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidJobModeHttpException extends HttpException {
  constructor(mode: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid job mode: ${mode}`,
        error: 'InvalidJobMode',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ImageAssetNotFoundHttpException extends HttpException {
  constructor(imageId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Image asset ${imageId} not found`,
        error: 'ImageAssetNotFound',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
