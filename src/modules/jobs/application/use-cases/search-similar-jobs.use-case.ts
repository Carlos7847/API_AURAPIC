import { Injectable } from '@nestjs/common';
import { EmbeddingGeneratorPort } from 'src/shared/ai/domain/ports/embedding-generator.port';
import { MemoryRepositoryPort } from 'src/shared/ai/domain/ports/memory.repository.port';

interface JobMetadata {
  resultUrl?: string;
  mode?: string;
  [key: string]: unknown;
}

export interface SimilarJobResult {
  jobId: string;
  prompt: string;
  similarity: number;
  resultUrl?: string;
  mode?: string;
  createdAt: Date;
}

@Injectable()
export class SearchSimilarJobsUseCase {
  constructor(
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly memoryRepository: MemoryRepositoryPort,
  ) {}

  async execute(query: string, limit = 5): Promise<SimilarJobResult[]> {
    // 1. Generate embedding for user query
    const embedding = await this.embeddingGenerator.generateEmbedding(query);

    // 2. Find similar memories (Jobs)
    const memories = await this.memoryRepository.findSimilar(
      embedding,
      limit,
      'JOB',
    );

    // 3. Transform result - filter out memories without ownerId
    return memories
      .filter((mem) => mem.ownerId !== null)
      .map((mem) => {
        const metadata = mem.metadata as JobMetadata | undefined;

        return {
          jobId: mem.ownerId, // Guaranteed non-null after filter
          prompt: mem.content,
          similarity: mem.similarity,
          resultUrl: metadata?.resultUrl,
          mode: metadata?.mode,
          createdAt: mem.createdAt,
        };
      });
  }
}
