import { Injectable } from '@nestjs/common';
import { AiProcessorServicePort } from '../../domain/ports/ai-processor.port';
import { AiProcessingResult } from '../../domain/types/ai-types';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';
import { ProcessImageUseCase } from '../../application/use-cases/process-image.use-case';

/**
 * AI Processor Adapter
 *
 * INFRASTRUCTURE LAYER - Implements port by delegating to application use case.
 *
 * @extends {AiProcessorServicePort}
 * @description Adapter that connects infrastructure to application layer
 */
@Injectable()
export class AiProcessorAdapter extends AiProcessorServicePort {
  constructor(private readonly processImageUseCase: ProcessImageUseCase) {
    super();
  }

  /**
   * Process an image - delegates to use case
   */
  async processImage(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult> {
    return this.processImageUseCase.execute(data);
  }

  /**
   * Check if mode is supported
   */
  isModeSupported(mode: string): boolean {
    return this.processImageUseCase.isModeSupported(mode);
  }

  /**
   * Get supported modes
   */
  getSupportedModes(): string[] {
    return this.processImageUseCase.getSupportedModes();
  }
}
