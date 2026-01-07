import { NestFactory } from '@nestjs/core';
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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(EnvironmentConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
