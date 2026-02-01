import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Domain Ports
import { AiProcessorServicePort } from './domain/ports/ai-processor.port';
import { EmbeddingGeneratorPort } from './domain/ports/embedding-generator.port';
import { ImageDownloaderPort } from './domain/ports/image-downloader.port';
import { VisionAiClientPort } from './domain/ports/vision-ai-client.port';
import { PROMPT_STRATEGIES } from './domain/ports/prompt-strategy.port';

// Application - Use Cases
import { ProcessImageUseCase } from './application/use-cases/process-image.use-case';
import { GenerateEmbeddingUseCase } from './application/use-cases/generate-embedding.use-case';

// Infrastructure - Config
import {
  AiConfigProvider,
  AI_CONFIG,
} from './infrastructure/config/ai-config.provider';

// Infrastructure - Adapters (Implementation of Ports)
import { GeminiVisionAdapter } from './infrastructure/adapters/gemini-vision.adapter';
import { AiProcessorAdapter } from './infrastructure/adapters/ai-processor.adapter';
import { EmbeddingGeneratorAdapter } from './infrastructure/adapters/embedding-generator.adapter';
import { AxiosImageDownloaderAdapter } from './infrastructure/adapters/axios-image-downloader.adapter';

// Infrastructure - Parsers
import { VisionAiResponseParser } from './infrastructure/parsers/vision-ai-response.parser';

// Infrastructure - Prompts
import { PromptStrategyRegistry } from './infrastructure/prompts/prompt-strategy.registry';
import { EcommercePromptStrategy } from './infrastructure/prompts/ecommerce.prompt-strategy';
import { PortraitPromptStrategy } from './infrastructure/prompts/portrait.prompt-strategy';
import { CreativePromptStrategy } from './infrastructure/prompts/creative.prompt-strategy';
import { RestorePromptStrategy } from './infrastructure/prompts/restore.prompt-strategy';
import { DefaultPromptStrategy } from './infrastructure/prompts/default.prompt-strategy';

// Infrastructure - Utils
import { RetryExecutor } from './infrastructure/utils/retry.executor';

/**
 * AI Module
 *
 * Follows Hexagonal Architecture (Ports & Adapters):
 *
 * DOMAIN LAYER:
 * - Ports: Interfaces that define what we need (AiProcessorServicePort, etc.)
 * - Types: Domain models and value objects
 *
 * APPLICATION LAYER:
 * - Use Cases: Business logic (ProcessImageUseCase, GenerateEmbeddingUseCase)
 *
 * INFRASTRUCTURE LAYER:
 * - Adapters: Implementations of ports (GeminiVisionAdapter, AxiosImageDownloaderAdapter)
 * - Concrete technologies (Gemini SDK, Axios, Prisma)
 *
 * DESIGN PATTERNS:
 * - Strategy: Prompt strategies for different modes
 * - Registry: PromptStrategyRegistry
 * - Adapter: GeminiVisionAdapter wraps external SDK
 * - Factory: AiConfigProvider
 */
@Module({
  imports: [ConfigModule],
  providers: [
    // ═══════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════
    AiConfigProvider,
    {
      provide: AI_CONFIG,
      useFactory: (provider: AiConfigProvider) => provider.getConfig(),
      inject: [AiConfigProvider],
    },

    // ═══════════════════════════════════════════════════════════════
    // Infrastructure - Utilities
    // ═══════════════════════════════════════════════════════════════
    RetryExecutor,
    VisionAiResponseParser,

    // ═══════════════════════════════════════════════════════════════
    // Infrastructure - Prompt Strategies
    // ═══════════════════════════════════════════════════════════════
    EcommercePromptStrategy,
    PortraitPromptStrategy,
    CreativePromptStrategy,
    RestorePromptStrategy,
    DefaultPromptStrategy,

    {
      provide: PROMPT_STRATEGIES,
      useFactory: (
        ecommerce: EcommercePromptStrategy,
        portrait: PortraitPromptStrategy,
        creative: CreativePromptStrategy,
        restore: RestorePromptStrategy,
      ) => [ecommerce, portrait, creative, restore],
      inject: [
        EcommercePromptStrategy,
        PortraitPromptStrategy,
        CreativePromptStrategy,
        RestorePromptStrategy,
      ],
    },
    PromptStrategyRegistry,

    // ═══════════════════════════════════════════════════════════════
    // Infrastructure - Technical Adapters
    // ═══════════════════════════════════════════════════════════════

    // Image Downloader (Axios)
    AxiosImageDownloaderAdapter,
    {
      provide: ImageDownloaderPort,
      useClass: AxiosImageDownloaderAdapter,
    },

    // Vision AI Client (Gemini)
    GeminiVisionAdapter,
    {
      provide: VisionAiClientPort,
      useClass: GeminiVisionAdapter,
    },
    {
      provide: EmbeddingGeneratorPort,
      useClass: GeminiVisionAdapter,
    },

    // ═══════════════════════════════════════════════════════════════
    // Application - Use Cases (Business Logic)
    // ═══════════════════════════════════════════════════════════════
    ProcessImageUseCase,
    GenerateEmbeddingUseCase,

    // ═══════════════════════════════════════════════════════════════
    // Infrastructure - Port Implementations (Driving Adapters)
    // ═══════════════════════════════════════════════════════════════
    AiProcessorAdapter,
    {
      provide: AiProcessorServicePort,
      useClass: AiProcessorAdapter,
    },

    EmbeddingGeneratorAdapter,
    // Note: EmbeddingGeneratorPort already bound to GeminiVisionAdapter above
  ],
  exports: [
    // Export ports for dependency injection in other modules
    AiProcessorServicePort,
    EmbeddingGeneratorPort,

    // Export config for modules that need it
    AI_CONFIG,

    // Export utilities for reuse
    RetryExecutor,
    PromptStrategyRegistry,
  ],
})
export class AiModule {}
