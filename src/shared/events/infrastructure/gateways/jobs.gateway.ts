import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { EventEmitterPort } from '../../domain/ports/event-emitter.port';
import { JobStatusChangedEvent } from '../../domain/events/job-status-changed.event';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket Gateway for Real-time Job Notifications
 *
 * Features:
 * - JWT Authentication on connection
 * - Room-based broadcasting (user-specific)
 * - Redis Adapter for horizontal scaling
 */
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow all origins in development, specific in production
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3001',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/jobs',
})
@Injectable()
export class JobsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, EventEmitterPort
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerPort,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided`,
          JobsGateway.name,
        );
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Join user-specific room
      const userId = payload.id || payload.userId || payload.sub;
      client.join(`user:${userId}`);
      client.data.userId = userId;

      this.logger.log(
        `Client connected: ${client.id} (user: ${userId})`,
        JobsGateway.name,
      );
    } catch (err) {
      this.logger.error(
        `Connection rejected: ${err instanceof Error ? err.message : 'Unknown error'}`,
        JobsGateway.name,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.logger.log(
      `Client disconnected: ${client.id}${userId ? ` (user: ${userId})` : ''}`,
      JobsGateway.name,
    );
  }

  /**
   * Emit job status change to specific user
   */
  emitJobStatus(event: JobStatusChangedEvent): void {
    const room = `user:${event.userId}`;

    this.logger.debug(
      `Emitting job:status to ${room} - Job ${event.jobId}: ${event.status}`,
      JobsGateway.name,
    );

    this.server.to(room).emit('job:status', event);
  }
}
