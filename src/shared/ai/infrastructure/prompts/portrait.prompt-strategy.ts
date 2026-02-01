import { Injectable } from '@nestjs/common';
import { PromptStrategyPort } from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

/**
 * Portrait Enhancement Prompt Strategy
 *
 * Specialized prompt for analyzing and enhancing portrait photographs.
 *
 * @implements {PromptStrategyPort}
 */
@Injectable()
export class PortraitPromptStrategy implements PromptStrategyPort {
  readonly mode = AiGenerationMode.PORTRAIT_PRO;

  buildPrompt(customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    return `Analyze this portrait for professional enhancement:
1. Evaluate facial lighting and skin tone balance
2. Assess background separation and depth
3. Identify areas needing retouching
4. Suggest enhancement techniques
5. Rate overall portrait quality (1-10)

Respond in JSON format: {
  "summary": "brief analysis",
  "lighting_assessment": "description of lighting quality",
  "retouching_areas": ["area1", "area2"],
  "techniques": ["technique1", "technique2"],
  "quality_score": number,
  "tags": ["tag1", "tag2"]
}`;
  }
}
