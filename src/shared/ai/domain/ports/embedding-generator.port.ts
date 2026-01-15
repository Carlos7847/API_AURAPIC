export abstract class EmbeddingGeneratorPort {
  abstract generateEmbedding(text: string): Promise<number[]>;
}
