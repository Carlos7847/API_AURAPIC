import { AiGenerationMode } from '../enums/ai-modes.enum';
import { AiProcessingResult } from '../types/ai-types';

/**
 * AI Processor Service Port (Abstraction)
 * Define operaciones para procesamiento de imágenes con IA
 * Permite diferentes implementaciones (Gemini, OpenAI, etc.)
 */
export abstract class AiProcessorServicePort {
  /**
   * Procesa una imagen según el modo solicitado
   */
  abstract processImage(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult>;

  /**
   * Valida que el modo solicitado sea soportado
   */
  abstract isModeSupported(mode: string): boolean;

  /**
   * Obtiene lista de modos soportados
   */
  abstract getSupportedModes(): string[];
}
