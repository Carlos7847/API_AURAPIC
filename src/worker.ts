import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('🚀 Worker Process Started (PID: ' + process.pid + ')');

  // Keep the process alive
  // Nest ApplicationContext automatically keeps alive if there are listeners (like Redis/BullMQ),
  // but we can ensure graceful shutdown handling.
  // Activa los hooks nativos de NestJS (maneja SIGTERM y SIGINT automáticamente)
  app.enableShutdownHooks();
}

void bootstrap();
