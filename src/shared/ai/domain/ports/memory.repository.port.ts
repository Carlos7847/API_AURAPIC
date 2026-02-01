import {
  MemoryEntity,
  MemoryWithSimilarity,
  CreateMemoryInput,
} from '../entities/memory.entity';

/**
 * Memory Repository Port
 *
 * Abstraction for memory storage with vector similarity search.
 * Implementations can use Prisma, pgvector, Pinecone, etc.
 */
export abstract class MemoryRepositoryPort {
  /**
   * Save a new memory with embedding
   */
  abstract save(data: CreateMemoryInput): Promise<MemoryEntity>;

  /**
   * Find similar memories using vector similarity
   *
   * @param embedding Vector embedding to search against
   * @param limit Maximum number of results
   * @param ownerType Filter by owner type
   * @param minScore Minimum similarity score (0-1)
   */
  abstract findSimilar(
    embedding: number[],
    limit: number,
    ownerType: string,
    minScore?: number,
  ): Promise<MemoryWithSimilarity[]>;
}
