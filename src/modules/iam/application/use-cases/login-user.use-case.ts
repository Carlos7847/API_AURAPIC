import { LoginUserDto } from '../dtos/login-user.dto';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { AuthCredentialRepositoryPort } from '../../domain/ports/auth-credential.repository.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import {
  TokenServicePort,
  TokenResponse,
} from '../../domain/ports/token.service.port';
import { AuthErrors } from '../../domain/constants/iam.constants';
import { UnauthorizedException } from '@nestjs/common';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { Session } from '../../domain/entities/session.entity';
import { AuditService } from '../services/audit.service';
import { AuditAction } from '../../domain/constants/audit.constants';

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly credentialRepository: AuthCredentialRepositoryPort,
    private readonly hashingService: HashingServicePort,
    private readonly tokenService: TokenServicePort,
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    dto: LoginUserDto,
    meta: { ip: string; userAgent: string },
  ): Promise<TokenResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    const credential =
      await this.credentialRepository.findPasswordCredentialByUserId(user.id);

    if (!credential || !credential.passwordHash) {
      // no tiene password. quizas con Google
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.hashingService.compare(
      dto.password,
      credential.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenHash = await this.hashingService.hashToken(
      tokens.refreshToken,
    );

    const deviceInfo = this.parseUserAgent(meta.userAgent);

    // expiración 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = Session.create(user.id, refreshTokenHash, expiresAt, {
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      deviceInfo: deviceInfo,
    });

    await this.sessionRepository.save(session);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      ip: meta.ip,
      metadata: { device: deviceInfo || 'Unknown' },
    });
    return tokens;
  }

  private parseUserAgent(ua: string): string {
    return ua.substring(0, 50); // Simplificación por ahora
  }
}
