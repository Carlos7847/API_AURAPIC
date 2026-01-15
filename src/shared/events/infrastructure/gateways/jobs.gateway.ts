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

interface JwtPayload {
  id?: string;
  userId?: string;
  sub?: string;
  [key: string]: unknown;
}

interface SocketData {
  userId: string;
}

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
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
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
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerPort,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.query?.token as string | undefined);

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided`,
          JobsGateway.name,
        );
        void client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.id || payload.userId || payload.sub;

      if (!userId) {
        this.logger.warn(
          `Connection rejected: No userId in token`,
          JobsGateway.name,
        );
        void client.disconnect();
        return;
      }

      void client.join(`user:${userId}`);
      (client.data as SocketData).userId = userId;

      this.logger.log(
        `Client connected: ${client.id} (user: ${userId})`,
        JobsGateway.name,
      );
    } catch (err) {
      this.logger.error(
        `Connection rejected: ${err instanceof Error ? err.message : 'Unknown error'}`,
        JobsGateway.name,
      );
      void client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.data as Partial<SocketData>).userId;
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
