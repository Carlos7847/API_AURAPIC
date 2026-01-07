import { Injectable, Logger } from '@nestjs/common';
import {
  EmailOptions,
  EmailServicePort,
} from 'src/shared/email/domain/ports/email.service.port';

@Injectable()
export class MockEmailService implements EmailServicePort {
  private readonly logger = new Logger(MockEmailService.name);

  send(options: EmailOptions): Promise<void> {
    // Simulación de un envío real
    const resetLink = `http://localhost:3000/reset-password?token=token`;

    this.logger.log('----------------------------------------------------');
    this.logger.log(`📧 [MOCK EMAIL] Enviando correo a: ${options.to}`);
    // this.logger.log(`🔑 Token (Copia esto): ${options.token}`);
    this.logger.log(`🔗 Link simulado: ${resetLink}`);
    this.logger.log('----------------------------------------------------');
    return Promise.resolve();
  }
}
