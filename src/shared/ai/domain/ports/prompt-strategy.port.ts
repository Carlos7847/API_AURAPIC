import { AiGenerationMode } from '../enums/ai-modes.enum';

/**
 * Prompt Strategy Port
 *
 * Strategy Pattern interface for building prompts.
 * Each AI mode implements this interface with its specific prompt logic.
 *
 * @description Enables Open/Closed Principle - add new modes without modifying existing code
 */
export interface PromptStrategyPort {
  /**
   * The AI generation mode this strategy handles
   */
  readonly mode: AiGenerationMode;

  /**
   * Build the prompt for this mode
   * @param customPrompt Optional custom prompt that overrides the default
   * @returns The complete prompt string
   */
  buildPrompt(customPrompt?: string): string;
}

/**
 * Injection token for prompt strategies array
 */
export const PROMPT_STRATEGIES = Symbol('PROMPT_STRATEGIES');
