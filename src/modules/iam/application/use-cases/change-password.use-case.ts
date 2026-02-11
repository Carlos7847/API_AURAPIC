import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

/**
 * Change Password Use Case
 *
 * Allows authenticated users to change their password.
 * Requires verification of current password before update.
 * Invalidates all sessions after password change for security.
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly credentialRepository: AuthCredentialRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly sessionRepository: SessionRepositoryPort,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    // 1. Get user's password credential
    const credential =
      await this.credentialRepository.findPasswordCredentialByUserId(userId);

    if (!credential) {
      throw new InvalidCredentialsError();
    }

    // Users registered via OAuth may not have a password
    if (!credential.passwordHash) {
      throw new InvalidCredentialsError();
    }

    // 2. Verify current password
    const isCurrentPasswordValid = await this.hashingService.compare(
      dto.currentPassword,
      credential.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 3. Hash new password
    const newPasswordHash = await this.hashingService.hash(dto.newPassword);

    // 4. Update password in repository
    await this.credentialRepository.updatePassword(
      credential.id,
      newPasswordHash,
    );

    // 5. Invalidate all sessions (security best practice)
    await this.sessionRepository.deleteByUserId(userId);
  }
}
