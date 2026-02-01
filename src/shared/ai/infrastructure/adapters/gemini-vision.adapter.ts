import { Injectable, Inject } from '@nestjs/common';
import {
  GoogleGenAI,
  GenerateContentResponse,
  EmbedContentResponse,
  SafetyRating as GeminiSafetyRating,
} from '@google/genai';
import { VisionAiClientPort } from '../../domain/ports/vision-ai-client.port';
import { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';
import {
  VisionContentRequest,
  VisionContentResponse,
} from '../../domain/ports/vision-ai-client.port';
import type { AiConfig } from '../../domain/config/ai.config';
import { AI_CONFIG } from '../config/ai-config.provider';
import { LoggerPort } from 'src/shared/logger/domain/logger.port';

/**
 * Gemini Vision Adapter
 *
 * Adapter that wraps the Google Generative AI SDK.
 * Implements both vision and embedding capabilities.
 *
 * @extends {VisionAiClientPort}
 * @implements {EmbeddingGeneratorPort}
 */
@Injectable()
export class GeminiVisionAdapter
  extends VisionAiClientPort
  implements EmbeddingGeneratorPort
{
  private readonly genAI: GoogleGenAI;
  private static readonly CONTEXT = GeminiVisionAdapter.name;

  constructor(
    @Inject(AI_CONFIG)
    private readonly config: AiConfig,
    private readonly logger: LoggerPort,
  ) {
    super();

    this.genAI = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    this.logger.log(
      `Initialized with model: ${config.modelName}`,
      GeminiVisionAdapter.CONTEXT,
    );
  }

  /**
   * Generate content from an image and prompt
   */
  async generateContent(
    request: VisionContentRequest,
  ): Promise<VisionContentResponse> {
    const result: GenerateContentResponse =
      await this.genAI.models.generateContent({
        model: this.config.modelName,
        config: {
          maxOutputTokens: this.config.maxOutputTokens,
          temperature: this.config.temperature,
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: request.imageBase64,
                  mimeType: request.mimeType,
                },
              },
              {
                text: request.prompt,
              },
            ],
          },
        ],
      });

    const candidate = result.candidates?.[0];
    const text: string = result.text ?? '';

    return {
      text,
      finishReason: candidate?.finishReason,
      safetyRatings: this.mapGeminiSafetyRatings(candidate?.safetyRatings),
      tokensUsed: result.usageMetadata?.totalTokenCount,
    };
  }

  /**
   * Generate a vector embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug(
        `Generating embedding for text (${text.length} chars)`,
        GeminiVisionAdapter.CONTEXT,
      );

      const result: EmbedContentResponse = await this.genAI.models.embedContent(
        {
          model: this.config.embeddingModel,
          contents: text,
        },
      );

      const values = result.embeddings?.[0]?.values;
      if (!values) {
        throw new Error('No embedding values returned from Gemini API');
      }

      this.logger.debug(
        `Embedding generated: ${values.length} dimensions`,
        GeminiVisionAdapter.CONTEXT,
      );

      return values;
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(
        `Failed to generate embedding: ${errorMessage}`,
        GeminiVisionAdapter.CONTEXT,
      );
      throw error;
    }
  }

  /**
   * Map Gemini SDK safety ratings to domain format
   */
  private mapGeminiSafetyRatings(
    ratings: GeminiSafetyRating[] | undefined,
  ): Array<{ category: string; probability: string }> | undefined {
    if (!ratings) return undefined;

    return ratings.map((rating) => ({
      category: String(rating.category ?? 'UNKNOWN'),
      probability: String(rating.probability ?? 'UNKNOWN'),
    }));
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
