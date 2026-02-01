import { Injectable, Inject } from '@nestjs/common';
import { AiProcessingResult } from '../../domain/types/ai-types';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';
import type { AiConfig } from '../../domain/config/ai.config';
import { AI_CONFIG } from '../../infrastructure/config/ai-config.provider';
import { VisionAiClientPort } from '../../domain/ports/vision-ai-client.port';
import { ImageDownloaderPort } from '../../domain/ports/image-downloader.port';
import { PromptStrategyRegistry } from '../../infrastructure/prompts/prompt-strategy.registry';
import { VisionAiResponseParser } from '../../infrastructure/parsers/vision-ai-response.parser';
import { RetryExecutor } from '../../infrastructure/utils/retry.executor';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Process Image Use Case
 *
 * APPLICATION LAYER - Contains business logic for image processing.
 * Orchestrates the workflow: download → prompt → AI call → parse.
 */
@Injectable()
export class ProcessImageUseCase {
  private static readonly CONTEXT = ProcessImageUseCase.name;

  constructor(
    @Inject(AI_CONFIG)
    private readonly config: AiConfig,
    private readonly visionClient: VisionAiClientPort,
    private readonly imageDownloader: ImageDownloaderPort,
    private readonly promptRegistry: PromptStrategyRegistry,
    private readonly responseParser: VisionAiResponseParser,
    private readonly retryExecutor: RetryExecutor,
    private readonly logger: LoggerPort,
  ) {}

  /**
   * Execute image processing workflow
   */
  async execute(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult> {
    const startTime = Date.now();

    this.logger.log(
      `Processing image: mode=${data.mode}, url=${data.imageUrl}`,
      ProcessImageUseCase.CONTEXT,
    );

    try {
      this.validateInputs(data);

      const result = await this.retryExecutor.execute(
        () => this.processInternal(data),
        {
          maxRetries: this.config.maxRetries,
          retryDelayMs: this.config.retryDelayMs,
          exponentialBackoff: true,
        },
        (error: unknown) => this.isRetryableError(error),
        ProcessImageUseCase.CONTEXT,
      );

      result.metadata.processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `Processing completed in ${result.metadata.processingTimeMs}ms`,
        ProcessImageUseCase.CONTEXT,
      );

      return result;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(
        `Processing failed: ${errorMessage}`,
        ProcessImageUseCase.CONTEXT,
      );

      return this.responseParser.createErrorResult(
        data.imageUrl,
        error,
        this.config.modelName,
      );
    }
  }

  /**
   * Check if a mode is supported
   */
  isModeSupported(mode: string): boolean {
    return (
      this.promptRegistry.hasStrategy(mode) ||
      Object.values(AiGenerationMode).includes(mode as AiGenerationMode)
    );
  }

  /**
   * Get list of supported modes
   */
  getSupportedModes(): string[] {
    return this.promptRegistry.getSupportedModes();
  }

  /**
   * Internal processing workflow
   */
  private async processInternal(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
  }): Promise<AiProcessingResult> {
    // 1. Download image
    const imageBuffer = await this.imageDownloader.download(
      data.imageUrl,
      this.config.timeoutMs,
    );
    const base64Image = imageBuffer.toString('base64');

    // 2. Build prompt using strategy
    const prompt = this.promptRegistry.resolve(data.mode, data.prompt);

    // 3. Call AI with timeout protection
    const response = await this.callWithTimeout(base64Image, prompt);

    // 4. Parse and return result
    return this.responseParser.parse(
      response,
      data.imageUrl,
      prompt,
      this.config.modelName,
    );
  }

  /**
   * Call AI with timeout protection
   */
  private async callWithTimeout(base64Image: string, prompt: string) {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('AI API timeout')),
        this.config.timeoutMs,
      ),
    );

    const apiCall = this.visionClient.generateContent({
      imageBase64: base64Image,
      mimeType: 'image/jpeg',
      prompt,
    });

    return Promise.race([apiCall, timeoutPromise]);
  }

  /**
   * Validate input data
   */
  private validateInputs(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
  }): void {
    if (!data.imageUrl || typeof data.imageUrl !== 'string') {
      throw new Error('Invalid imageUrl: must be a non-empty string');
    }

    if (!data.imageUrl.startsWith('http')) {
      throw new Error('Invalid imageUrl: must be a valid HTTP(S) URL');
    }

    if (!data.mode || typeof data.mode !== 'string') {
      throw new Error('Invalid mode: must be a non-empty string');
    }
  }

  /**
   * Check if error should trigger retry
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('429')
      );
    }
    return false;
  }

  /**
   * Extract error message safely from unknown error
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
