import { Injectable } from '@nestjs/common';
import { PromptStrategyPort } from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

/**
 * E-commerce Product Prompt Strategy
 *
 * Specialized prompt for analyzing product images for e-commerce optimization.
 *
 * @implements {PromptStrategyPort}
 */
@Injectable()
export class EcommercePromptStrategy implements PromptStrategyPort {
  readonly mode = AiGenerationMode.ECOMMERCE_PRO;

  buildPrompt(customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    return `Analyze this product image for e-commerce optimization:
1. Evaluate product visibility and framing (score 1-10)
2. Assess lighting quality and shadows
3. Identify background distractions
4. Suggest composition improvements
5. List relevant product tags

Respond in JSON format: {
  "summary": "brief description",
  "visibility_score": number,
  "lighting_quality": "excellent/good/fair/poor",
  "improvements": ["suggestion1", "suggestion2"],
  "tags": ["tag1", "tag2"],
  "quality_score": number
}`;
  }
}
