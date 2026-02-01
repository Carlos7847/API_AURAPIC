// Domain Exports - Config
export type { AiConfig } from './config/ai.config';
export { DEFAULT_AI_CONFIG } from './config/ai.config';

// Domain Exports - Enums
export { AiGenerationMode } from './enums/ai-modes.enum';

// Domain Exports - Types
export type { AiProcessingResult, SafetyRating } from './types/ai-types';

// Domain Exports - Entities
export type {
  MemoryEntity,
  MemoryWithSimilarity,
  CreateMemoryInput,
} from './entities/memory.entity';

// Domain Exports - Ports
export { AiProcessorServicePort } from './ports/ai-processor.port';
export { EmbeddingGeneratorPort } from './ports/embedding-generator.port';
export { MemoryRepositoryPort } from './ports/memory.repository.port';
export { ImageDownloaderPort } from './ports/image-downloader.port';
export {
  VisionAiClientPort,
  type VisionContentRequest,
  type VisionContentResponse,
  type AiSafetyRating,
} from './ports/vision-ai-client.port';
export type { PromptStrategyPort } from './ports/prompt-strategy.port';
export { PROMPT_STRATEGIES } from './ports/prompt-strategy.port';
