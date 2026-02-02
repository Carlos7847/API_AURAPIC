import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  DEFAULT_APP_PORT,
  GLOBAL_API_PREFIX,
} from './shared/constants/infrastructure/app.constants';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { EnvironmentConfigService } from './shared/config/infrastructure/environment-config.service';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions, Server as SocketIOServer } from 'socket.io';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    enabled: process.env.SENTRY_ENABLED === 'true',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0, // Capture 100% of transactions for now
    profilesSampleRate: 1.0, // Profile 100% of sampled transactions
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // Buffer logs until Pino is attached
  });

  app.useLogger(app.get(Logger));

  const configService = app.get(EnvironmentConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // WebSocket Redis Adapter (optional, for horizontal scaling)
  if (process.env.ENABLE_REDIS_ADAPTER === 'true') {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const pubClient = new Redis(redisUrl);
    const subClient = new Redis(redisUrl);

    const redisIoAdapter = new IoAdapter(app);
    const adapterConstructor = createAdapter(pubClient, subClient);

    redisIoAdapter.createIOServer = function (
      port: number,
      options?: ServerOptions,
    ): SocketIOServer {
      const server = IoAdapter.prototype.createIOServer.call(
        this,
        port,
        options,
      ) as SocketIOServer;
      server.adapter(adapterConstructor);
      return server;
    };

    app.useWebSocketAdapter(redisIoAdapter);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: configService.getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.set('trust proxy', 1);
  app.setGlobalPrefix(GLOBAL_API_PREFIX);

  const config = new DocumentBuilder()
    .setTitle('Auth Microservice API')
    .setDescription('API de Autenticación Nivel Enterprise con NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable graceful shutdown hooks for Prisma, BullMQ, etc.
  app.enableShutdownHooks();

  const port = process.env.PORT ?? DEFAULT_APP_PORT;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);

  // Graceful shutdown on SIGTERM ( for Docker)
  process.on('SIGTERM', () => {
    void (async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await app.close();
      console.log('Application closed gracefully');
      process.exit(0);
    })();
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    void (async () => {
      console.log('SIGINT signal received: closing HTTP server');
      await app.close();
      console.log('Application closed gracefully');
      process.exit(0);
    })();
  });
}

void bootstrap();
