import { AuthCredential } from '../entities/auth-credential.entity';

export abstract class AuthCredentialRepositoryPort {
  abstract findPasswordCredentialByUserId(
    userId: string,
  ): Promise<AuthCredential | null>;

  abstract updatePasswordResetToken(
    userId: string,
    hash: string | null,
    expiresAt: Date | null,
  ): Promise<void>;

  abstract findByPasswordResetToken(
    hash: string,
  ): Promise<AuthCredential | null>;

  abstract updatePassword(id: string, newPasswordHash: string): Promise<void>;

  abstract updateEmailVerificationToken(
    userId: string,
    hash: string | null,
    expiresAt: Date | null,
  ): Promise<void>;

  abstract findByEmailVerificationToken(
    hash: string,
  ): Promise<AuthCredential | null>;
}
