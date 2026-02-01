/**
 * Vision AI Content Request
 */
export interface VisionContentRequest {
  /** Base64-encoded image data */
  imageBase64: string;

  /** MIME type of the image */
  mimeType: string;

  /** The prompt/instructions for the AI */
  prompt: string;
}

/**
 * AI Safety Rating
 * Safety assessment from the AI provider
 */
export interface AiSafetyRating {
  category: string;
  probability: string;
}

/**
 * Vision AI Content Response
 * Normalized response from vision AI providers
 */
export interface VisionContentResponse {
  /** The generated text content */
  text: string;

  /** Finish reason (e.g., 'STOP', 'SAFETY') */
  finishReason?: string;

  /** Safety ratings from the API */
  safetyRatings?: AiSafetyRating[];

  /** Token usage metadata */
  tokensUsed?: number;
}

/**
 * Vision AI Client Port
 *
 * Abstraction for vision-based AI providers (Gemini, OpenAI Vision, etc.)
 * Enables testing and swapping of AI providers.
 *
 * NOTE: Uses abstract class instead of interface because NestJS requires
 * concrete tokens for dependency injection.
 *
 * @description Adapter Pattern - wraps external AI SDKs
 */
export abstract class VisionAiClientPort {
  /**
   * Generate content from an image and prompt
   */
  abstract generateContent(
    request: VisionContentRequest,
  ): Promise<VisionContentResponse>;
}
