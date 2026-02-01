import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiConfig, DEFAULT_AI_CONFIG } from '../../domain/config/ai.config';

/**
 * AI Configuration Provider
 *
 * Factory that creates AiConfig from environment variables.
 * Single source of truth for AI configuration.
 *
 * @description Follows Factory Pattern - creates configured value objects
 */
@Injectable()
export class AiConfigProvider {
  private readonly config: AiConfig;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY not configured. Please set it in environment variables.',
      );
    }

    this.config = Object.freeze({
      apiKey,
      modelName:
        this.configService.get<string>('GEMINI_MODEL') ??
        DEFAULT_AI_CONFIG.modelName,
      maxOutputTokens:
        this.configService.get<number>('GEMINI_MAX_TOKENS') ??
        DEFAULT_AI_CONFIG.maxOutputTokens,
      temperature:
        this.configService.get<number>('GEMINI_TEMPERATURE') ??
        DEFAULT_AI_CONFIG.temperature,
      timeoutMs:
        this.configService.get<number>('GEMINI_TIMEOUT_MS') ??
        DEFAULT_AI_CONFIG.timeoutMs,
      maxRetries:
        this.configService.get<number>('GEMINI_MAX_RETRIES') ??
        DEFAULT_AI_CONFIG.maxRetries,
      retryDelayMs:
        this.configService.get<number>('GEMINI_RETRY_DELAY_MS') ??
        DEFAULT_AI_CONFIG.retryDelayMs,
      embeddingModel:
        this.configService.get<string>('GEMINI_EMBEDDING_MODEL') ??
        DEFAULT_AI_CONFIG.embeddingModel,
    });
  }

  /**
   * Get the immutable AI configuration
   */
  getConfig(): AiConfig {
    return this.config;
  }
}

/**
 * Injection token for AiConfig
 */
export const AI_CONFIG = Symbol('AI_CONFIG');
