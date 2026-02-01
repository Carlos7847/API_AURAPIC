import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma/prisma.service';
import { MemoryRepositoryPort } from '../../domain/ports/memory.repository.port';
import {
  MemoryEntity,
  MemoryWithSimilarity,
  CreateMemoryInput,
} from '../../domain/entities/memory.entity';

/**
 * Raw query result type for similarity search
 */
interface RawSimilarityResult {
  id: string;
  ownerType: string;
  ownerId: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  similarity: number;
}

/**
 * Prisma Memory Repository
 *
 * Implementation of MemoryRepositoryPort using Prisma with pgvector.
 */
@Injectable()
export class PrismaMemoryRepository extends MemoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(data: CreateMemoryInput): Promise<MemoryEntity> {
    const vectorString = `[${data.embedding.join(',')}]`;
    const id = crypto.randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO "Memory" ("id", "ownerType", "ownerId", "content", "embedding", "metadata", "createdAt")
      VALUES (
        ${id}, 
        ${data.ownerType}, 
        ${data.ownerId}, 
        ${data.content}, 
        ${vectorString}::vector, 
        ${data.metadata ?? {}}, 
        NOW()
      )
    `;

    // Return domain entity (not Prisma model)
    const saved = await this.prisma.memory.findUniqueOrThrow({
      where: { id },
    });

    return this.mapToEntity(saved);
  }

  async findSimilar(
    embedding: number[],
    limit: number = 5,
    ownerType: string,
    minScore: number = 0.7,
  ): Promise<MemoryWithSimilarity[]> {
    const vectorString = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRaw<RawSimilarityResult[]>`
      SELECT 
        id, 
        "ownerType", 
        "ownerId", 
        content, 
        metadata, 
        "createdAt",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "Memory"
      WHERE "ownerType" = ${ownerType}
      AND (1 - (embedding <=> ${vectorString}::vector)) > ${minScore}
      ORDER BY similarity DESC
      LIMIT ${limit};
    `;

    return results.map((row) => this.mapToEntityWithSimilarity(row));
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToEntity(prismaRecord: {
    id: string;
    ownerType: string;
    ownerId: string | null;
    content: string;
    metadata: unknown;
    createdAt: Date;
    embedding?: unknown;
  }): MemoryEntity {
    return {
      id: prismaRecord.id,
      ownerType: prismaRecord.ownerType,
      ownerId: prismaRecord.ownerId ?? '',
      content: prismaRecord.content,
      metadata: (prismaRecord.metadata as Record<string, unknown>) ?? undefined,
      createdAt: prismaRecord.createdAt,
      embedding: [], // Embedding not returned to avoid large data transfer
    };
  }

  /**
   * Map raw query result to domain entity with similarity
   */
  private mapToEntityWithSimilarity(
    row: RawSimilarityResult,
  ): MemoryWithSimilarity {
    return {
      id: row.id,
      ownerType: row.ownerType,
      ownerId: row.ownerId,
      content: row.content,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
      embedding: [], // Embedding not returned to avoid large data transfer
      similarity: row.similarity,
    };
  }
}
