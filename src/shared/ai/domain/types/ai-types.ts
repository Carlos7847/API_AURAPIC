export interface AiProcessingResult {
  resultImageUrl: string | null;
  metadata: {
    aiModel: string;
    analysis: string;
    processingStatus: 'COMPLETED' | 'FAILED' | 'BLOCKED_SAFETY' | 'TIMEOUT';
    confidence?: number;
    tags?: string[];
    safetyRatings?: SafetyRating[];
    promptUsed?: string;
    tokensUsed?: number;
    processingTimeMs?: number;
    error?: string;
  };
}

export interface SafetyRating {
  category: string;
  probability: string;
}
