import { Injectable } from '@nestjs/common';
import { PromptStrategyPort } from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

/**
 * Image Restoration Prompt Strategy
 *
 * Specialized prompt for analyzing damaged images for restoration.
 *
 * @implements {PromptStrategyPort}
 */
@Injectable()
export class RestorePromptStrategy implements PromptStrategyPort {
  readonly mode = AiGenerationMode.RESTORE;

  buildPrompt(customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    return `Analyze this image for restoration:
1. Identify damage types (scratches, fading, tears)
2. Assess restoration complexity (1-10)
3. Suggest restoration techniques
4. Estimate affected areas percentage

Respond in JSON format: {
  "summary": "restoration analysis",
  "damage_types": ["type1", "type2"],
  "complexity_score": number,
  "techniques": ["technique1", "technique2"],
  "affected_percentage": number,
  "tags": ["tag1", "tag2"]
}`;
  }
}
