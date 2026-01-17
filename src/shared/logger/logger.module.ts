import { Global, Module } from '@nestjs/common';
// import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerService } from './infrastructure/logger.service';
import { LoggerPort } from './domain/logger.port';

@Global()
@Module({
  imports: [
    // PinoLoggerModule.forRoot({
    //   pinoHttp: {
    //     transport: {
    //       target: 'pino-pretty',
    //       options: {
    //         singleLine: true,
    //         colorize: true,
    //       },
    //     },
    //   },
    // }),
  ],
  providers: [
    {
      provide: LoggerPort,
      useClass: LoggerService,
    },
  ],
  exports: [LoggerPort],
})
export class LoggerModule {}
