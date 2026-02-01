import { AiGenerationMode } from '../enums/ai-modes.enum';
import { AiProcessingResult } from '../types/ai-types';

/**
 * AI Processor Service Port
 *
 * Defines operations for AI image processing.
 * Allows different implementations (Gemini, OpenAI, etc.)
 *
 */
export abstract class AiProcessorServicePort {
  /**
   * Process an image according to the requested mode
   */
  abstract processImage(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult>;

  /**
   * Validate that the requested mode is supported
   */
  abstract isModeSupported(mode: string): boolean;

  /**
   * Get list of supported modes
   */
  abstract getSupportedModes(): string[];
}
