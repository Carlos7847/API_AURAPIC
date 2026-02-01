import { Injectable } from '@nestjs/common';
import { AiProcessingResult, SafetyRating } from '../../domain/types/ai-types';
import {
  VisionContentResponse,
  AiSafetyRating,
} from '../../domain/ports/vision-ai-client.port';

/**
 * Parsed Analysis Data from JSON response
 */
interface ParsedAnalysisData {
  summary?: string;
  quality_score?: number;
  confidence?: number;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Analysis Summary extracted from response
 */
export interface AnalysisSummary {
  summary: string;
  confidence: number;
  tags: string[];
}

/**
 * Vision AI Response Parser
 *
 * Dedicated parser for vision AI responses.
 * Handles JSON extraction, safety rating mapping, and result building.
 */
@Injectable()
export class VisionAiResponseParser {
  /**
   * Parse a vision AI response into an AiProcessingResult
   */
  parse(
    response: VisionContentResponse,
    imageUrl: string,
    promptUsed: string,
    modelName: string,
  ): AiProcessingResult {
    // Handle safety blocks
    if (response.finishReason === 'SAFETY') {
      return this.createSafetyBlockedResult(response, promptUsed, modelName);
    }

    const analysis = this.parseAnalysisText(response.text);

    return {
      resultImageUrl: imageUrl,
      metadata: {
        aiModel: modelName,
        analysis: response.text,
        processingStatus: 'COMPLETED',
        confidence: analysis.confidence,
        tags: analysis.tags,
        safetyRatings: this.mapSafetyRatings(response.safetyRatings),
        promptUsed,
        tokensUsed: response.tokensUsed ?? 0,
      },
    };
  }

  /**
   * Parse analysis text (try JSON first, fallback to plain text)
   */
  parseAnalysisText(text: string): AnalysisSummary {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ParsedAnalysisData;

        return {
          summary: parsed.summary ?? text.substring(0, 200),
          confidence: this.calculateConfidence(parsed),
          tags: parsed.tags ?? [],
        };
      }
    } catch {
      // JSON parsing failed, use fallback
    }

    // Fallback: plain text
    return {
      summary: text.substring(0, 200),
      confidence: 0.75,
      tags: [],
    };
  }

  /**
   * Map AI safety ratings to domain format
   */
  mapSafetyRatings(
    ratings: AiSafetyRating[] | undefined,
  ): SafetyRating[] | undefined {
    if (!ratings) return undefined;

    return ratings.map((rating) => ({
      category: rating.category ?? 'UNKNOWN',
      probability: rating.probability ?? 'UNKNOWN',
    }));
  }

  /**
   * Create error result for processing failures
   */
  createErrorResult(
    imageUrl: string,
    error: unknown,
    modelName: string,
  ): AiProcessingResult {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      resultImageUrl: null,
      metadata: {
        aiModel: modelName,
        analysis: `Processing failed: ${errorMessage}`,
        processingStatus: 'FAILED',
        error: errorMessage,
      },
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
   * Create result for safety-blocked content
   */
  private createSafetyBlockedResult(
    response: VisionContentResponse,
    promptUsed: string,
    modelName: string,
  ): AiProcessingResult {
    return {
      resultImageUrl: null,
      metadata: {
        aiModel: modelName,
        analysis: 'Content blocked by safety filters',
        processingStatus: 'BLOCKED_SAFETY',
        safetyRatings: this.mapSafetyRatings(response.safetyRatings),
        promptUsed,
      },
    };
  }
}
