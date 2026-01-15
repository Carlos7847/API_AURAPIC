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
import { createClient } from 'redis';
import { IoAdapter } from '@nestjs/platform-socket.io';

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
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    const redisIoAdapter = new IoAdapter(app);
    const adapterConstructor = createAdapter(pubClient, subClient);
    redisIoAdapter.createIOServer = function (port: number, options?: any) {
      const server = IoAdapter.prototype.createIOServer.call(
        this,
        port,
        options,
      );
      server.adapter(adapterConstructor);
      return server;
    };
    app.useWebSocketAdapter(redisIoAdapter);
  }

  app.use(helmet());
  app.enableCors({
    origin:
      configService.getEnvironment() === 'production'
        ? ['https://mi-frontend-real.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
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

  await app.listen(process.env.PORT ?? DEFAULT_APP_PORT);
}
bootstrap();
