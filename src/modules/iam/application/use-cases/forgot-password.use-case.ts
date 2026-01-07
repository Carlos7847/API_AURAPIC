import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import * as crypto from 'crypto';
import { EmailServicePort } from 'src/shared/email/domain/ports/email.service.port';
import { resetPasswordTemplate } from 'src/shared/email/infrastructure/templates/reset-password.template';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly credentialRepository: AuthCredentialRepositoryPort,
    private readonly emailService: EmailServicePort,
    private readonly hashingService: HashingServicePort,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) return;

    // generar un token aleatorio seguro (High Entropy)
    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = await this.hashingService.hashToken(rawToken); //hash SHA256

    // expiración => 1 hora
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.credentialRepository.updatePasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    const resetUrl = `https://tu-app.com/reset?token=${rawToken}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Recuperación de Contraseña',
      html: resetPasswordTemplate(resetUrl),
      // template: 'forgot-password', // falta motor de plantillas
      // context: { url: resetUrl, name: user.name }
    });
  }
}
