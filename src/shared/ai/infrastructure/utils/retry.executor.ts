import { Injectable } from '@nestjs/common';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Retry Configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Base delay between retries in milliseconds */
  retryDelayMs: number;

  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
}

/**
 * Retry Executor
 *
 * Reusable utility for executing operations with retry logic.
 * Implements exponential backoff strategy.
 *
 * @description handles only retry logic
 */
@Injectable()
export class RetryExecutor {
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Execute an operation with retry logic
   *
   * @param operation The async operation to execute
   * @param config Retry configuration
   * @param isRetryable Function to determine if an error is retryable
   * @param context Context name for logging
   * @returns The result of the operation
   * @throws The last error if all retries are exhausted
   */
  async execute<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    isRetryable: (error: unknown) => boolean,
    context: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt >= config.maxRetries || !isRetryable(error)) {
          throw error;
        }

        const delay = this.calculateDelay(config, attempt);

        this.logger.warn(
          `Retrying after ${delay}ms (attempt ${attempt}/${config.maxRetries})`,
          context,
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Calculate delay for the current attempt
   */
  private calculateDelay(config: RetryConfig, attempt: number): number {
    if (config.exponentialBackoff !== false) {
      return config.retryDelayMs * Math.pow(2, attempt - 1);
    }
    return config.retryDelayMs;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
