import { Injectable } from '@nestjs/common';
import { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';
import { GenerateEmbeddingUseCase } from '../../application/use-cases/generate-embedding.use-case';

/**
 * Embedding Generator Adapter
 *
 * @extends {EmbeddingGeneratorPort}
 * @description Adapter that connects infrastructure to application layer
 */
@Injectable()
export class EmbeddingGeneratorAdapter extends EmbeddingGeneratorPort {
  constructor(
    private readonly generateEmbeddingUseCase: GenerateEmbeddingUseCase,
  ) {
    super();
  }

  /**
   * Generate embedding - delegates to use case
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateEmbeddingUseCase.execute(text);
  }
}
