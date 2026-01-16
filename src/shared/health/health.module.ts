import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../persistence/prisma/prisma.module';

/**
 * Health Module
 *
 * Provides health check endpoints for production monitoring
 * and container orchestration.
 */
@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
