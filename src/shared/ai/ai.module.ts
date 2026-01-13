import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiAiAdapter } from './infrastructure/adapters/gemini-ai.adapter';

@Module({
  imports: [ConfigModule],
  providers: [GeminiAiAdapter],
  exports: [GeminiAiAdapter],
})
export class AiModule {}
