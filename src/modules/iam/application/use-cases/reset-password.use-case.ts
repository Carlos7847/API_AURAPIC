import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { InvalidTokenError } from '../../domain/errors/invalid-token.error';
import { PasswordResetTokenExpiredError } from '../../domain/errors/password-reset-token-expired.error';

export class ResetPasswordUseCase {
  constructor(
    private readonly credentialRepository: AuthCredentialRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = await this.hashingService.hashToken(dto.token);

    const credential =
      await this.credentialRepository.findByPasswordResetToken(tokenHash);

    if (!credential) {
      throw new InvalidTokenError();
    }

    if (
      credential.passwordResetExpiresAt &&
      credential.passwordResetExpiresAt < new Date()
    ) {
      throw new PasswordResetTokenExpiredError();
    }

    const newPasswordHash = await this.hashingService.hash(dto.newPassword);

    await this.credentialRepository.updatePassword(
      credential.id,
      newPasswordHash,
    );

    await this.sessionRepository.deleteByUserId(credential.userId);
  }
}
