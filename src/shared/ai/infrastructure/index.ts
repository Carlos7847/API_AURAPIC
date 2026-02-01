// Infrastructure Exports - Config
export { AiConfigProvider, AI_CONFIG } from './config/ai-config.provider';

// Infrastructure Exports - Adapters
export { GeminiVisionAdapter } from './adapters/gemini-vision.adapter';
export { AiProcessorAdapter } from './adapters/ai-processor.adapter';
export { EmbeddingGeneratorAdapter } from './adapters/embedding-generator.adapter';
export { AxiosImageDownloaderAdapter } from './adapters/axios-image-downloader.adapter';

// Infrastructure Exports - Parsers
export { VisionAiResponseParser } from './parsers/vision-ai-response.parser';
export type { AnalysisSummary } from './parsers/vision-ai-response.parser';

// Infrastructure Exports - Prompts
export { PromptStrategyRegistry } from './prompts/prompt-strategy.registry';
export { EcommercePromptStrategy } from './prompts/ecommerce.prompt-strategy';
export { PortraitPromptStrategy } from './prompts/portrait.prompt-strategy';
export { CreativePromptStrategy } from './prompts/creative.prompt-strategy';
export { RestorePromptStrategy } from './prompts/restore.prompt-strategy';
export { DefaultPromptStrategy } from './prompts/default.prompt-strategy';

// Infrastructure Exports - Persistence
export { PrismaMemoryRepository } from './persistence/prisma-memory.repository';

// Infrastructure Exports - Utils
export { RetryExecutor } from './utils/retry.executor';
export type { RetryConfig } from './utils/retry.executor';
