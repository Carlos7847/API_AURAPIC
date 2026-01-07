import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseConfig } from '../domain/database.interface';
import { IJwtConfig } from '../domain/jwt.interface';
import { IAppConfig } from '../domain/app.interface';
import { EnvVars } from '../../../config/env.config';

@Injectable()
export class EnvironmentConfigService
  implements IDatabaseConfig, IJwtConfig, IAppConfig
{
  constructor(private readonly configService: ConfigService<EnvVars>) {}

  // --- DATABASE ---
  getDatabaseUrl(): string {
    return this.configService.getOrThrow('DATABASE_URL', { infer: true });
  }

  // --- JWT ---
  getJwtSecret(): string {
    return this.configService.getOrThrow('JWT_SECRET', { infer: true });
  }

  getJwtExpirationTime(): string {
    return this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL', {
      infer: true,
    });
  }

  getJwtRefreshExpirationTime(): string {
    return this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL', {
      infer: true,
    });
  }

  // --- APP ---
  getPort(): number {
    return this.configService.getOrThrow('PORT', { infer: true });
  }

  getEnvironment(): string {
    return this.configService.getOrThrow('NODE_ENV', { infer: true });
  }

  getCorsOrigins(): string[] {
    const origins = this.configService.get('CORS_ORIGINS', { infer: true });
    return origins ? origins.split(',') : [''];
  }

  // --- EMAIL ---
  getSmtpHost(): string {
    return this.configService.getOrThrow('SMTP_HOST', { infer: true });
  }
  getSmtpPort(): number {
    return this.configService.getOrThrow('SMTP_PORT', { infer: true });
  }
  getSmtpUser(): string {
    return this.configService.getOrThrow('SMTP_USER', { infer: true });
  }
  getSmtpPass(): string {
    return this.configService.getOrThrow('SMTP_PASS', { infer: true });
  }
  getMailFrom(): string {
    return this.configService.getOrThrow('MAIL_FROM', { infer: true });
  }
  getFrontendUrl(): string {
    return this.configService.getOrThrow('FRONTEND_URL', { infer: true });
  }
}
