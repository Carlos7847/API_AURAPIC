import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  TokenServicePort,
  TokenPayload,
  TokenResponse,
} from '../../domain/ports/token.service.port';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: EnvironmentConfigService,
  ) {}

  async generateTokens(payload: TokenPayload): Promise<TokenResponse> {
    const accessTokenTtl =
      this.configService.getJwtExpirationTime() as JwtSignOptions['expiresIn'];
    const refreshTokenTtl =
      this.configService.getJwtRefreshExpirationTime() as JwtSignOptions['expiresIn'];

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessTokenTtl }),
      this.jwtService.signAsync(payload, { expiresIn: refreshTokenTtl }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token);
  }
}
