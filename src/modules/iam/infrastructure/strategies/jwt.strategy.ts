import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../../domain/ports/token.service.port';
import { EnvironmentConfigService } from 'src/shared/config/infrastructure/environment-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: EnvironmentConfigService) {
    super({
      // token del header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Si expiró, lanza 401 automáticamente
      secretOrKey: configService.getJwtSecret(),
    });
  }

  // resultado se inyectará en `request.user`.
  validate(payload: TokenPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
