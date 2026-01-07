import { Global, Module } from '@nestjs/common';
import { LoggerService } from './infrastructure/logger.service';
import { LoggerPort } from './domain/logger.port';

@Global()
@Module({
  providers: [
    {
      provide: LoggerPort,
      useClass: LoggerService,
    },
  ],
  exports: [LoggerPort],
})
export class LoggerModule {}
