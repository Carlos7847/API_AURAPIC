import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProcessorServicePort } from 'src/shared/ai/domain/ports/ai-processor.port';
import { AiGenerationMode } from 'src/shared/ai/domain/enums/ai-modes.enum';
import { AiProcessingResult } from 'src/shared/ai/domain/types/ai-types';

@Injectable()
export class GeminiAiAdapter implements AiProcessorServicePort {
  private readonly logger = new Logger(GeminiAiAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async processImage(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult> {
    this.logger.log(
      `🤖 Gemini AI Processing: ${data.mode} | Image: ${data.imageUrl}`,
    );
    this.logger.debug(`Context Prompt: ${data.prompt || 'None'}`);

    // Simulation of AI Deliberation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Implement real Gemini call
    // const apiKey = this.configService.get('GEMINI_API_KEY');

    return {
      resultImageUrl: data.imageUrl, // Pass-through for now
      metadata: {
        aiModel: 'gemini-pro-vision',
        analysis: 'Image analysis simulation: Good lighting required.',
        processingStatus: 'AWAITING_HUMAN_REVIEW',
      },
    };
  }

  isModeSupported(mode: string): boolean {
    return Object.values(AiGenerationMode).includes(mode as AiGenerationMode);
  }

  getSupportedModes(): string[] {
    return Object.values(AiGenerationMode);
  }
}
