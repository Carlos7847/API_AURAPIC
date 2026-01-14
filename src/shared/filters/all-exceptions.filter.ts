import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

import { PrismaErrorCodes } from '../persistence/prisma/prisma.constants';
import {
  SystemErrorCodes,
  SystemErrorMessages,
} from 'src/shared/constants/domain/error.constants';

import {
  ERROR_MAPPING,
  ErrorClass,
  ErrorResponseConfig,
} from './error-mapping';

interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<unknown>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = SystemErrorMessages.INTERNAL_SERVER_ERROR;
    let errorCode: string = SystemErrorMessages.INTERNAL_SERVER_ERROR;

    // ----------------------------------------------------------------
    // ESTRATEGIA 1: Errores de Dominio (Mapeo Automático)
    // ----------------------------------------------------------------
    // Verificamos si el constructor del error existe en nuestro mapa
    const errorType = exception?.constructor as ErrorClass;
    const mappingConfig = ERROR_MAPPING.get(errorType);

    if (mappingConfig) {
      httpStatus = mappingConfig.status;
      errorCode = mappingConfig.code;
      // Usamos el mensaje del error original, o uno sobreescrito si el mapa lo define
      message = mappingConfig.message || (exception as Error).message;
    }

    // ----------------------------------------------------------------
    // ESTRATEGIA 2: Excepciones HTTP de NestJS (Framework)
    // ----------------------------------------------------------------
    else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as HttpExceptionResponse;
        message = responseObj.message;
        errorCode = responseObj.error || exception.name;
      }
    }

    // ----------------------------------------------------------------
    // ESTRATEGIA 3: Excepciones de Prisma
    // ----------------------------------------------------------------
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaMapping: Record<string, ErrorResponseConfig> = {
        [PrismaErrorCodes.UNIQUE_CONSTRAINT]: {
          status: HttpStatus.CONFLICT,
          code: SystemErrorCodes.CONFLICT_DUPLICATE_ENTRY,
          message: SystemErrorMessages.CONFLICT_DUPLICATE,
        },
        [PrismaErrorCodes.NOT_FOUND]: {
          status: HttpStatus.NOT_FOUND,
          code: SystemErrorCodes.RESOURCE_NOT_FOUND,
          message: SystemErrorMessages.RESOURCE_NOT_FOUND,
        },
      };

      const config = prismaMapping[exception.code];

      if (config) {
        httpStatus = config.status;
        errorCode = config.code;
        message = config.message!;
      } else {
        httpStatus = HttpStatus.BAD_REQUEST;
        message = `Error de base de datos: ${exception.code}`;
        errorCode = SystemErrorCodes.DB_ERROR;
        this.logger.error(
          `Prisma Error [${exception.code}]: ${exception.message}`,
        );
        Sentry.captureException(exception);
      }
    }

    // ----------------------------------------------------------------
    // ESTRATEGIA 4: Errores Desconocidos (Logueo crítico)
    // ----------------------------------------------------------------
    else if (!mappingConfig) {
      const errorMsg =
        exception instanceof Error ? exception.message : String(exception);
      const errorStack = exception instanceof Error ? exception.stack : '';

      this.logger.error(`Unhandled Exception: ${errorMsg}`, errorStack);
      Sentry.captureException(exception);

      // Mantenemos los valores por defecto definidos al inicio
      message = SystemErrorMessages.UNEXPECTED_ERROR;
    }

    const path = httpAdapter.getRequestUrl(request) as string;
    const method = httpAdapter.getRequestMethod(request) as string;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path,
      method,
      errorCode,
      message: Array.isArray(message) ? message.join(', ') : message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
