import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/persistence/prisma/prisma.module';
import { IamModule } from './modules/iam/iam.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from './shared/logger/logger.module';
import { EventsModule } from './shared/events/events.module';
// import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { EnvVars, validate } from './config/env.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { EnvironmentConfigService } from './shared/config/infrastructure/environment-config.service';
import { EnvironmentConfigModule } from './shared/config/infrastructure/environment-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    LoggerModule,
    EventsModule, // WebSocket Gateway for real-time notifications
    PrismaModule,
    IamModule,
    UploadsModule,
    JobsModule,
    AdminModule,
    PaymentsModule,
    BullModule.forRootAsync({
      imports: [EnvironmentConfigModule],
      inject: [EnvironmentConfigService],
      useFactory: (config: EnvironmentConfigService) => ({
        connection: {
          host: config.getRedisHost(),
          port: config.getRedisPort(),
        },
      }),
    }),
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
