import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiAiAdapter } from './infrastructure/adapters/gemini-ai.adapter';
import { EmbeddingGeneratorPort } from './domain/ports/embedding-generator.port';
import { AiProcessorServicePort } from './domain/ports/ai-processor.port';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiAiAdapter,
    {
      provide: EmbeddingGeneratorPort,
      useExisting: GeminiAiAdapter,
    },
    {
      provide: AiProcessorServicePort,
      useExisting: GeminiAiAdapter,
    },
  ],
  exports: [GeminiAiAdapter, EmbeddingGeneratorPort, AiProcessorServicePort],
})
export class AiModule {}
