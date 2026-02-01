import { Injectable } from '@nestjs/common';
import { PromptStrategyPort } from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

/**
 * Creative Transformation Prompt Strategy
 *
 * Specialized prompt for artistic and creative image transformations.
 *
 * @implements {PromptStrategyPort}
 */
@Injectable()
export class CreativePromptStrategy implements PromptStrategyPort {
  readonly mode = AiGenerationMode.CREATIVE;

  buildPrompt(customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    return `Analyze this image for creative transformation:
1. Identify artistic elements and composition
2. Suggest compatible art styles
3. Recommend color palette adjustments
4. List areas suitable for creative effects

Respond in JSON format: {
  "summary": "artistic analysis",
  "artistic_elements": ["element1", "element2"],
  "suggested_styles": ["style1", "style2"],
  "palette": {
    "current": ["color1", "color2"],
    "suggested": ["color1", "color2"]
  },
  "creative_areas": ["area1", "area2"],
  "tags": ["tag1", "tag2"]
}`;
  }
}
