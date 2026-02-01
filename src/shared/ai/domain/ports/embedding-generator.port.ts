/**
 * Embedding Generator Port
 *
 * Abstraction for text embedding generation.
 * Allows different implementations (Gemini, OpenAI, Cohere, etc.)
 *
 * NOTE: Uses abstract class instead of interface because NestJS requires
 * concrete tokens for dependency injection.
 */
export abstract class EmbeddingGeneratorPort {
  /**
   * Generate vector embedding for text
   * @param text The text to embed
   * @returns Array of embedding values
   */
  abstract generateEmbedding(text: string): Promise<number[]>;
}
