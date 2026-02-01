/**
 * Memory Entity
 *
 * Domain entity representing a stored memory with vector embedding.
 * This is a pure domain object, independent of any ORM or database.
 */
export interface MemoryEntity {
  /** Unique identifier */
  id: string;

  /** Type of owner (e.g., 'JOB', 'USER') */
  ownerType: string;

  /** ID of the owner */
  ownerId: string;

  /** Text content of the memory */
  content: string;

  /** Vector embedding for similarity search */
  embedding: number[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Memory with Similarity Score
 *
 * Extended memory entity that includes similarity score from vector search.
 */
export interface MemoryWithSimilarity extends MemoryEntity {
  /** Cosine similarity score (0-1) */
  similarity: number;
}

/**
 * Create Memory Input
 *
 * Input DTO for creating a new memory.
 */
export interface CreateMemoryInput {
  ownerType: string;
  ownerId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}
