import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { AuthCredential } from '../../domain/entities/auth-credential.entity';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class PrismaAuthCredentialRepository
  implements AuthCredentialRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findPasswordCredentialByUserId(
    userId: string,
  ): Promise<AuthCredential | null> {
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        userId: userId,
        provider: AuthProvider.EMAIL, // login clásico solo con email/password
      },
    });

    if (!credential) return null;

    return new AuthCredential(
      credential.id,
      credential.userId,
      credential.provider,
      credential.passwordHash,
    );
  }

  async updatePasswordResetToken(
    userId: string,
    hash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.prisma.authCredential.updateMany({
      where: { userId: userId, provider: AuthProvider.EMAIL },
      data: {
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  }

  async findByPasswordResetToken(hash: string): Promise<AuthCredential | null> {
    const credential = await this.prisma.authCredential.findFirst({
      where: {
        passwordResetTokenHash: hash,
        provider: AuthProvider.EMAIL,
      },
    });

    if (!credential) return null;
    return new AuthCredential(
      credential.id,
      credential.userId,
      credential.provider,
      credential.passwordHash,
    );
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await this.prisma.authCredential.update({
      where: { id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  }

  async updateEmailVerificationToken(
    userId: string,
    hash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.prisma.authCredential.updateMany({
      where: { userId, provider: AuthProvider.EMAIL },
      data: {
        emailVerificationTokenHash: hash,
        emailVerificationExpiresAt: expiresAt,
      },
    });
  }

  async findByEmailVerificationToken(
    hash: string,
  ): Promise<AuthCredential | null> {
    const persistenceModel = await this.prisma.authCredential.findFirst({
      where: {
        emailVerificationTokenHash: hash,
        provider: AuthProvider.EMAIL,
      },
    });

    if (!persistenceModel) return null;

    return new AuthCredential(
      persistenceModel.id,
      persistenceModel.userId,
      persistenceModel.provider,
      persistenceModel.passwordHash,
      persistenceModel.passwordResetTokenHash,
      persistenceModel.passwordResetExpiresAt,
      persistenceModel.emailVerificationTokenHash,
      persistenceModel.emailVerificationExpiresAt,
    );
  }
}
