import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobsGateway } from './infrastructure/gateways/jobs.gateway';
import { EventEmitterPort } from './domain/ports/event-emitter.port';
import { LoggerModule } from '../logger/logger.module';

/**
 * Events Module - WebSocket Gateway for Real-time Notifications
 *
 * Provides:
 * - JobsGateway (Socket.IO WebSocket server)
 * - EventEmitterPort implementation
 * - Redis Adapter for horizontal scaling (configured in main.ts)
 *
 * JwtService is provided globally by IamModule
 */
@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    JobsGateway,
    {
      provide: EventEmitterPort,
      useExisting: JobsGateway,
    },
  ],
  exports: [JobsGateway, EventEmitterPort],
})
export class EventsModule {}
