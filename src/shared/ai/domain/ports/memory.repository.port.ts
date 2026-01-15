import { Memory } from '@prisma/client';

export abstract class MemoryRepositoryPort {
  abstract save(data: {
    ownerType: string;
    ownerId: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
  }): Promise<Memory>;

  abstract findSimilar(
    embedding: number[],
    limit: number,
    ownerType: string,
    minScore?: number,
  ): Promise<Array<Memory & { similarity: number }>>;
}
