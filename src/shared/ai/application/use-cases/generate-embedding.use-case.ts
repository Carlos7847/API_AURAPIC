import { Injectable } from '@nestjs/common';
import { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Generate Embedding Use Case
 */
@Injectable()
export class GenerateEmbeddingUseCase {
  private static readonly CONTEXT = GenerateEmbeddingUseCase.name;

  constructor(
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Execute embedding generation
   *
   * @param text The text to embed
   * @returns Array of embedding values (768 dimensions typically)
   * @throws Error if embedding generation fails
   */
  async execute(text: string): Promise<number[]> {
    try {
      this.validateInput(text);

      this.logger.debug(
        `Generating embedding for text (${text.length} chars)`,
        GenerateEmbeddingUseCase.CONTEXT,
      );

      const embedding = await this.embeddingGenerator.generateEmbedding(text);

      this.logger.debug(
        `Embedding generated: ${embedding.length} dimensions`,
        GenerateEmbeddingUseCase.CONTEXT,
      );

      return embedding;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(
        `Failed to generate embedding: ${errorMessage}`,
        GenerateEmbeddingUseCase.CONTEXT,
      );
      throw error;
    }
  }

  /**
   * Validate input text
   */
  private validateInput(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text: must be a non-empty string');
    }

    if (text.trim().length === 0) {
      throw new Error('Invalid text: must contain non-whitespace characters');
    }
  }

  /**
   * Extract error message safely from unknown error
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
