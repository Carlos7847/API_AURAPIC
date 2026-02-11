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
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<unknown>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = SystemErrorMessages.INTERNAL_SERVER_ERROR;
    let errorCode: string = SystemErrorMessages.INTERNAL_SERVER_ERROR;
    let internalMessage: string | null = null; // For logging only

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
        internalMessage = response;
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as HttpExceptionResponse;
        internalMessage = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message;
        errorCode = responseObj.error || exception.name;
      }

      // OWASP A01/A04: Sanitize validation errors in production
      // Don't expose field names or internal structure to clients
      if (this.isProduction) {
        message = this.getSanitizedMessage(httpStatus);
      } else {
        // In development, allow detailed messages for debugging
        message = internalMessage || message;
      }

      // Always log the real error internally
      if (internalMessage) {
        this.logger.warn(`Validation/HTTP Error: ${internalMessage}`);
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
        // OWASP: Never expose Prisma error codes to clients
        message = SystemErrorMessages.INTERNAL_SERVER_ERROR;
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

  /**
   * Returns a user-friendly, sanitized error message based on HTTP status
   * OWASP A01/A04: Prevents information disclosure
   */
  private getSanitizedMessage(status: HttpStatus): string {
    const sanitizedMessages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'La solicitud contiene datos inválidos.',
      [HttpStatus.UNAUTHORIZED]: 'No autorizado.',
      [HttpStatus.FORBIDDEN]: 'Acceso denegado.',
      [HttpStatus.NOT_FOUND]: 'Recurso no encontrado.',
      [HttpStatus.CONFLICT]: 'Conflicto con el estado actual del recurso.',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'No se pudo procesar la solicitud.',
      [HttpStatus.TOO_MANY_REQUESTS]:
        'Demasiadas solicitudes. Intente más tarde.',
    };

    return (
      sanitizedMessages[status] || SystemErrorMessages.INTERNAL_SERVER_ERROR
    );
  }
}
