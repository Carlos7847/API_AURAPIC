import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { LoggerPort } from '../domain/logger.port';

@Injectable()
export class PinoLoggerAdapter implements LoggerPort {
  constructor(private readonly logger: Logger) {}

  log(message: string, context?: string): void {
    if (context) {
      this.logger.log({ context }, message);
    } else {
      this.logger.log(message);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (context) {
      this.logger.error({ context, trace }, message);
    } else {
      this.logger.error({ trace }, message);
    }
  }

  warn(message: string, context?: string): void {
    if (context) {
      this.logger.warn({ context }, message);
    } else {
      this.logger.warn(message);
    }
  }

  debug(message: string, context?: string): void {
    if (context) {
      this.logger.debug({ context }, message);
    } else {
      this.logger.debug(message);
    }
  }

  verbose(message: string, context?: string): void {
    if (context) {
      this.logger.verbose({ context }, message);
    } else {
      this.logger.verbose(message);
    }
  }
}
