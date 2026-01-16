import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface ErrorEvent {
  timestamp: Date;
  message: string;
  target: string;
}

/**
 * Prisma Service with Production Optimizations
 *
 * Features:
 * - Connection lifecycle management (connect/disconnect)
 * - Slow query logging (>1000ms threshold)
 * - Error logging for debugging
 * - Graceful shutdown support
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log slow queries (>1s) for performance monitoring
    this.$on('query' as never, (e: QueryEvent) => {
      if (e.duration > 1000) {
        console.warn(
          `[SLOW QUERY] ${e.duration}ms - ${e.query.substring(0, 100)}...`,
        );
      }
    });

    // Log database errors
    this.$on('error' as never, (e: ErrorEvent) => {
      console.error('[DATABASE ERROR]', e.message);
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Database connected successfully');
  }

  async onModuleDestroy() {
    console.log('Closing database connections...');
    await this.$disconnect();
    console.log('Database disconnected');
  }
}
