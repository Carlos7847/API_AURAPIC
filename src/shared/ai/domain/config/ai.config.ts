/**
 * AI Configuration Value Object
 *
 * Immutable configuration for AI services.
 *
 * WHY MODULE-LEVEL CONFIG?
 * ========================
 * This config exists at the module level (not in global ConfigModule) because:
 *
 * 1. **Encapsulation**: AI-specific environment variables are grouped together
 * 2. **Type Safety**: Provides strongly-typed AiConfig interface
 * 3. **Defaults**: Centralizes default values for AI settings
 * 4. **Testability**: Easy to mock AiConfig in tests vs mocking ConfigService
 * 5. **Validation**: Single point to validate and transform AI config
 *
 * This follows the principle: "Configuration should be close to where it's used"
 *
 * @description Value Object pattern - immutable and self-validating
 */
export interface AiConfig {
  /** Gemini API Key */
  readonly apiKey: string;

  /** Model name (e.g., 'gemini-2.0-flash-exp') */
  readonly modelName: string;

  /** Maximum tokens in response */
  readonly maxOutputTokens: number;

  /** Temperature for generation (0.0 - 1.0) */
  readonly temperature: number;

  /** Request timeout in milliseconds */
  readonly timeoutMs: number;

  /** Maximum retry attempts */
  readonly maxRetries: number;

  /** Initial retry delay in milliseconds */
  readonly retryDelayMs: number;

  /** Embedding model name */
  readonly embeddingModel: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_AI_CONFIG: Omit<AiConfig, 'apiKey'> = {
  modelName: 'gemini-2.0-flash-exp',
  maxOutputTokens: 2048,
  temperature: 0.7,
  timeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 2000,
  embeddingModel: 'text-embedding-004',
} as const;
