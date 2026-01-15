import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';
import { AiProcessorServicePort } from '../../domain/ports/ai-processor.port';
import { AiProcessingResult, SafetyRating } from '../../domain/types/ai-types';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';

// Gemini SDK Type Definitions
interface GeminiModelConfig {
  model: string;
  config: {
    maxOutputTokens: number;
    temperature: number;
  };
}

interface GeminiSafetyRating {
  category: string;
  probability: string;
}

interface GeminiAPIResponse {
  response: {
    candidates?: Array<{
      finishReason?: string;
      safetyRatings?: GeminiSafetyRating[];
    }>;
    text: () => string;
    usageMetadata?: {
      totalTokenCount?: number;
    };
  };
}

interface ParsedAnalysisData {
  summary?: string;
  quality_score?: number;
  confidence?: number;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Gemini AI Adapter
 * Real implementation using Google's @google/genai SDK
 *
 * @implements {AiProcessorServicePort}
 * @description Processes images using Google Gemini AI models with retry logic,
 * error handling, and safety filters
 */
import { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';

@Injectable()
export class GeminiAiAdapter
  implements AiProcessorServicePort, EmbeddingGeneratorPort
{
  private readonly genAI: GoogleGenAI;
  private readonly modelName: string;
  private readonly maxRetries: number = 3;
  private readonly timeoutMs: number = 30000; // 30 seconds
  private readonly retryDelayMs: number = 2000;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerPort,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY not configured. Please set it in environment variables.',
      );
    }

    this.genAI = new GoogleGenAI({
      apiKey,
    });
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash-exp';

    this.logger.log(
      `Gemini AI Adapter initialized with model: ${this.modelName}`,
      GeminiAiAdapter.name,
    );
  }

  /**
   * Process image using Gemini Vision API
   *
   * @param {Object} data - Processing parameters
   * @param {string} data.imageUrl - S3 URL of the image
   * @param {AiGenerationMode | string} data.mode - Processing mode
   * @param {string} [data.prompt] - Optional custom prompt
   * @returns {Promise<AiProcessingResult>} Analysis result
   */
  async processImage(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
    meta?: Record<string, unknown>;
  }): Promise<AiProcessingResult> {
    const startTime = Date.now();

    this.logger.log(
      `Processing image with Gemini: mode=${data.mode}, url=${data.imageUrl}`,
      GeminiAiAdapter.name,
    );

    try {
      // Validate inputs
      this.validateInputs(data);

      // Execute with retry logic
      const result = await this.executeWithRetry(async () => {
        return await this.processImageInternal(data);
      });

      const processingTimeMs = Date.now() - startTime;
      result.metadata.processingTimeMs = processingTimeMs;

      this.logger.log(
        `Image processing completed in ${processingTimeMs}ms`,
        GeminiAiAdapter.name,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GeminiAiAdapter.name,
      );

      return this.createErrorResult(data.imageUrl, error);
    }
  }

  /**
   * Internal processing logic (wrapped by retry)
   */
  private async processImageInternal(data: {
    imageUrl: string;
    mode: AiGenerationMode | string;
    prompt?: string;
  }): Promise<AiProcessingResult> {
    // 1. Download image with timeout
    const imageBuffer = await this.downloadImageWithTimeout(data.imageUrl);
    const base64Image = imageBuffer.toString('base64');

    // 2. Build prompt based on mode
    const systemPrompt = this.buildPromptForMode(data.mode, data.prompt);

    // 3. Get generative model with config
    const model = this.getModel();

    // 4. Call Gemini API with timeout protection
    const response = await this.callGeminiWithTimeout(
      model,
      base64Image,
      systemPrompt,
    );

    // 5. Validate and process response
    return this.processResponse(response, data.imageUrl, systemPrompt);
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        this.logger.warn(
          `Retrying after ${delay}ms (attempt ${attempt}/${this.maxRetries})`,
          GeminiAiAdapter.name,
        );

        await this.sleep(delay);
        return this.executeWithRetry(fn, attempt + 1);
      }

      throw error;
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
   * Download image with timeout protection
   */
  private async downloadImageWithTimeout(url: string): Promise<Buffer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Get configured Gemini model
   */
  private getModel() {
    const maxTokens =
      this.configService.get<number>('GEMINI_MAX_TOKENS') || 2048;
    const temperature =
      this.configService.get<number>('GEMINI_TEMPERATURE') || 0.7;

    return {
      model: this.modelName,
      config: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    };
  }

  /**
   * Call Gemini API with timeout protection
   */
  private async callGeminiWithTimeout(
    modelConfig: GeminiModelConfig,
    base64Image: string,
    prompt: string,
  ): Promise<GeminiAPIResponse> {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), this.timeoutMs),
    );

    const apiCall = this.genAI.models.generateContent({
      ...modelConfig,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    return Promise.race([
      apiCall,
      timeoutPromise,
    ]) as Promise<GeminiAPIResponse>;
  }

  /**
   * Process Gemini API response
   */
  private processResponse(
    result: GeminiAPIResponse,
    imageUrl: string,
    promptUsed: string,
  ): AiProcessingResult {
    const response = result.response;
    const candidate = response.candidates?.[0];

    // Check for safety blocks
    if (candidate?.finishReason === 'SAFETY') {
      this.logger.warn('Image blocked by safety filters', GeminiAiAdapter.name);

      return {
        resultImageUrl: null,
        metadata: {
          aiModel: this.modelName,
          analysis: 'Content blocked by safety filters',
          processingStatus: 'BLOCKED_SAFETY',
          safetyRatings: this.mapSafetyRatings(candidate.safetyRatings),
          promptUsed,
        },
      };
    }

    const analysisText = response.text();
    const analysis = this.parseAnalysisText(analysisText);

    return {
      resultImageUrl: imageUrl,
      metadata: {
        aiModel: this.modelName,
        analysis: analysisText,
        processingStatus: 'COMPLETED',
        confidence: analysis.confidence,
        tags: analysis.tags,
        safetyRatings: this.mapSafetyRatings(candidate?.safetyRatings),
        promptUsed,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  /**
   * Map Gemini safety ratings to our format
   */
  private mapSafetyRatings(
    ratings: GeminiSafetyRating[] | undefined,
  ): SafetyRating[] | undefined {
    if (!ratings) return undefined;

    return ratings.map((rating) => ({
      category: rating.category || 'UNKNOWN',
      probability: rating.probability || 'UNKNOWN',
    }));
  }

  /**
   * Build prompt based on processing mode
   */
  private buildPromptForMode(mode: string, customPrompt?: string): string {
    if (customPrompt) return customPrompt;

    const prompts: Record<string, string> = {
      ECOMMERCE_PRO: `Analyze this product image for e-commerce optimization:
1. Evaluate product visibility and framing (score 1-10)
2. Assess lighting quality and shadows
3. Identify background distractions
4. Suggest composition improvements
5. List relevant product tags

Respond in JSON format: {
  "summary": "brief description",
  "visibility_score": number,
  "lighting_quality": "excellent/good/fair/poor",
  "improvements": ["suggestion1", "suggestion2"],
  "tags": ["tag1", "tag2"],
  "quality_score": number
}`,

      PORTRAIT_PRO: `Analyze this portrait for professional enhancement:
1. Evaluate facial lighting and skin tone balance
2. Assess background separation and depth
3. Identify areas needing retouching
4. Suggest enhancement techniques
5. Rate overall portrait quality (1-10)

Respond in JSON with: summary, lighting_assessment, retouching_areas, techniques, quality_score, tags`,

      CREATIVE: `Analyze this image for creative transformation:
1. Identify artistic elements and composition
2. Suggest compatible art styles
3. Recommend color palette adjustments
4. List areas suitable for creative effects

JSON format: summary, artistic_elements, suggested_styles, palette, creative_areas, tags`,

      RESTORE: `Analyze this image for restoration:
1. Identify damage types (scratches, fading, tears)
2. Assess restoration complexity (1-10)
3. Suggest restoration techniques
4. Estimate affected areas percentage

JSON: summary, damage_types, complexity_score, techniques, affected_percentage, tags`,
    };

    return (
      prompts[mode] ||
      `Analyze this image and provide detailed insights in JSON format with keys: summary, analysis, tags, quality_score`
    );
  }

  /**
   * Parse analysis text (try JSON first, fallback to plain text)
   */
  private parseAnalysisText(text: string): {
    summary: string;
    confidence: number;
    tags: string[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ParsedAnalysisData;

        return {
          summary: parsed.summary || text.substring(0, 200),
          confidence: this.calculateConfidence(parsed),
          tags: parsed.tags || [],
        };
      }
    } catch {
      this.logger.debug(
        'Failed to parse JSON from response, using plain text',
        GeminiAiAdapter.name,
      );
    }

    // Fallback: plain text
    return {
      summary: text.substring(0, 200),
      confidence: 0.75,
      tags: [],
    };
  }

  /**
   * Calculate confidence score from parsed data
   */
  private calculateConfidence(data: ParsedAnalysisData): number {
    if (data.quality_score && typeof data.quality_score === 'number') {
      return Math.min(data.quality_score / 10, 1.0);
    }
    if (data.confidence && typeof data.confidence === 'number') {
      return Math.min(data.confidence, 1.0);
    }
    return 0.8; // Default confidence
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
   * Create error result
   */
  private createErrorResult(
    imageUrl: string,
    error: unknown,
  ): AiProcessingResult {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      resultImageUrl: null,
      metadata: {
        aiModel: this.modelName,
        analysis: `Processing failed: ${errorMessage}`,
        processingStatus: 'FAILED',
        error: errorMessage,
      },
    };
  }

  /**
   * Utility: sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate vector embedding for text
   * Uses text-embedding-004 model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.genAI.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });

      if (!result.embeddings?.[0]?.values) {
        throw new Error('No embedding values returned');
      }

      return result.embeddings[0].values;
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GeminiAiAdapter.name,
      );
      throw error;
    }
  }

  /**
   * Check if mode is supported
   */
  isModeSupported(mode: string): boolean {
    return Object.values(AiGenerationMode).includes(mode as AiGenerationMode);
  }

  /**
   * Get list of supported modes
   */
  getSupportedModes(): string[] {
    return Object.values(AiGenerationMode);
  }
}
