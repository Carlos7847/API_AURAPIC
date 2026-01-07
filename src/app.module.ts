import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/persistence/prisma/prisma.module';
import { IamModule } from './modules/iam/iam.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from './shared/logger/logger.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { EnvVars, validate } from './config/env.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    LoggerModule,
    PrismaModule,
    IamModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars>) => ({
        throttlers: [
          {
            ttl: config.getOrThrow('THROTTLE_TTL', { infer: true }),
            limit: config.getOrThrow('THROTTLE_LIMIT', { infer: true }),
          },
        ],
        errorMessage: 'Has excedido el límite de peticiones.',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
