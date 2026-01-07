import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  TokenServicePort,
  TokenResponse,
} from '../../domain/ports/token.service.port';
import { HashingServicePort } from '../../domain/ports/hashing.service.port';
import { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { AuthErrors } from '../../domain/constants/iam.constants';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: TokenServicePort,
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly hashingService: HashingServicePort,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<TokenResponse> {
    const payload = await this.tokenService.verifyToken(dto.refreshToken);

    const incomingTokenHash = await this.hashingService.hashToken(
      dto.refreshToken,
    );

    const session =
      await this.sessionRepository.findByTokenHash(incomingTokenHash);

    if (!session) {
      // pendiente "Token Reuse Detection" (revocar todo), CHECKTHIS
      //Alertar al user o registrar el evento de seguridad (AuthEvent).
      throw new UnauthorizedException(AuthErrors.INVALID_CREDENTIALS);
    }

    if (!session.isValid) {
      throw new UnauthorizedException(AuthErrors.ACCOUNT_SUSPENDED);
    }

    const newTokens = await this.tokenService.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    const newTokenHash = await this.hashingService.hashToken(
      newTokens.refreshToken,
    );

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const rotatedSession = session.rotate(newTokenHash, sevenDaysFromNow);

    await this.sessionRepository.update(rotatedSession);

    return newTokens;
  }
}
