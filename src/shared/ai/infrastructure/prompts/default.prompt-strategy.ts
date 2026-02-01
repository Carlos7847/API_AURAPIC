import { Injectable } from '@nestjs/common';
import { PromptStrategyPort } from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

/**
 * Default Prompt Strategy
 *
 * Fallback strategy for unknown or custom modes.
 * Provides a generic analysis prompt.
 *
 * @implements {PromptStrategyPort}
 */
@Injectable()
export class DefaultPromptStrategy implements PromptStrategyPort {
  readonly mode = 'DEFAULT' as AiGenerationMode;

  buildPrompt(customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    return `Analyze this image and provide detailed insights in JSON format with keys: {
  "summary": "brief description of the image",
  "analysis": "detailed analysis",
  "tags": ["tag1", "tag2"],
  "quality_score": number
}`;
  }
}
