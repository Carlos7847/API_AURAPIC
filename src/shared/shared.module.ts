import { Module } from '@nestjs/common';
import { EnvironmentConfigModule } from './config/infrastructure/environment-config.module';
import { PersistenceModule } from './persistence/persistence.module';
import { LoggerModule } from './logger/logger.module';
import { EmailModule } from './email/email.module';
import { DateModule } from './date/date.module';

@Module({
  imports: [
    EnvironmentConfigModule,
    PersistenceModule,
    LoggerModule,
    EmailModule,
    DateModule,
  ],
  providers: [],
  exports: [
    EnvironmentConfigModule,
    LoggerModule,
    PersistenceModule,
    EmailModule,
    DateModule,
  ],
})
export class SharedModule {}
