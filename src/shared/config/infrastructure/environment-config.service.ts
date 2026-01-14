import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDatabaseConfig } from '../domain/database.interface';
import { IJwtConfig } from '../domain/jwt.interface';
import { IAppConfig } from '../domain/app.interface';
import { EnvVars } from '../../../config/env.config';
import { IAwsConfig } from '../domain/aws.interface';

import { IRedisConfig } from './redis.config.interface';

@Injectable()
export class EnvironmentConfigService
  implements IDatabaseConfig, IJwtConfig, IAppConfig, IAwsConfig, IRedisConfig
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

  // --- AWS S3 ---
  getAwsRegion(): string {
    return this.configService.getOrThrow('AWS_REGION', { infer: true });
  }

  getAwsAccessKeyId(): string {
    return this.configService.getOrThrow('AWS_ACCESS_KEY_ID', { infer: true });
  }

  getAwsSecretAccessKey(): string {
    return this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY', {
      infer: true,
    });
  }

  getS3Bucket(): string {
    return this.configService.getOrThrow('S3_BUCKET', { infer: true });
  }

  getS3PresignedUrlExpiry(): number {
    return this.configService.getOrThrow('S3_PRESIGNED_URL_EXPIRY', {
      infer: true,
    });
  }

  getRedisHost(): string {
    return this.configService.getOrThrow('REDIS_HOST', { infer: true });
  }

  getRedisPort(): number {
    return this.configService.getOrThrow('REDIS_PORT', { infer: true });
  }

  getEnableWorker(): boolean {
    return this.configService.get('ENABLE_WORKER', { infer: true }) ?? false;
  }

  // --- MERCADO PAGO ---
  getMercadoPagoAccessToken(): string {
    return this.configService.getOrThrow('MP_ACCESS_TOKEN', { infer: true });
  }

  getMercadoPagoNotificationUrl(): string {
    const apiUrl = this.configService.getOrThrow('API_URL', { infer: true });
    return `${apiUrl}/payments/webhook/mercadopago`;
  }

  getMercadoPagoWebhookSecret(): string {
    return this.configService.getOrThrow('MERCADOPAGO_WEBHOOK_SECRET', {
      infer: true,
    });
  }

  /**
   * Método genérico para obtener cualquier variable de entorno
   */
  getOrThrow<K extends keyof EnvVars>(key: K): EnvVars[K] {
    return this.configService.getOrThrow(key, { infer: true });
  }

  // --- GEMINI AI ---
  getGeminiApiKey(): string {
    return this.configService.getOrThrow('GEMINI_API_KEY', { infer: true });
  }

  getGeminiModel(): string {
    return (
      this.configService.get('GEMINI_MODEL', { infer: true }) ||
      'gemini-2.0-flash-exp'
    );
  }

  getGeminiMaxTokens(): number {
    return this.configService.get('GEMINI_MAX_TOKENS', { infer: true }) || 2048;
  }

  getGeminiTemperature(): number {
    return this.configService.get('GEMINI_TEMPERATURE', { infer: true }) || 0.7;
  }
}
