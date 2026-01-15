import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/persistence/prisma/prisma.service';
import { MemoryRepositoryPort } from '../../domain/ports/memory.repository.port';
import { Memory } from '@prisma/client';

@Injectable()
export class PrismaMemoryRepository implements MemoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: {
    ownerType: string;
    ownerId: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
  }): Promise<Memory> {
    ////   prisma issue with vector fields because it has no types
    const vectorString = `[${data.embedding.join(',')}]`;

    // We first create the record without embedding if possible, or use raw for everything.
    // Raw is safer for vector fields.
    const id = crypto.randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO "Memory" ("id", "ownerType", "ownerId", "content", "embedding", "metadata", "createdAt")
      VALUES (
        ${id}, 
        ${data.ownerType}, 
        ${data.ownerId}, 
        ${data.content}, 
        ${vectorString}::vector, 
        ${data.metadata || {}}, 
        NOW()
      )
    `;

    // Return the created record (without embedding vector data to avoid huge parsing)
    return this.prisma.memory.findUniqueOrThrow({
      where: { id },
    });
  }

  async findSimilar(
    embedding: number[],
    limit: number = 5,
    ownerType: string,
    minScore: number = 0.7, // 0.7 is a decent baseline for "relation"
  ): Promise<Array<Memory & { similarity: number }>> {
    const vectorString = `[${embedding.join(',')}]`;

    // Calculate Cosine Similarity: 1 - (embedding <=> vector)
    // Using CAST for type safety if needed, though raw works well with ::vector
    const results = await this.prisma.$queryRaw<
      Array<Memory & { similarity: number }>
    >`
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

    return results;
  }
}
