import { Module } from '@nestjs/common';
import { EmailServicePort } from './domain/ports/email.service.port';
import { NodemailerEmailService } from './infrastructure/nodemailer/nodemailer-email.service';
import { EnvironmentConfigModule } from '../config/infrastructure/environment-config.module';

@Module({
  imports: [EnvironmentConfigModule],
  providers: [
    {
      provide: EmailServicePort,
      useClass: NodemailerEmailService,
    },
  ],
  exports: [EmailServicePort],
})
export class EmailModule {}
