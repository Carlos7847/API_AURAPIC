import { Injectable, Logger } from '@nestjs/common';
import { LoggerPort } from '../domain/logger.port';

@Injectable()
export class LoggerService implements LoggerPort {
  // Usamos el Logger nativo de NestJS, o Winston, o Pino...
  private readonly logger = new Logger();

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }
  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
