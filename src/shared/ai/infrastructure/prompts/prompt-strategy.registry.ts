import { Injectable, Inject } from '@nestjs/common';
import {
  PromptStrategyPort,
  PROMPT_STRATEGIES,
} from '../../domain/ports/prompt-strategy.port';
import { AiGenerationMode } from '../../domain/enums/ai-modes.enum';
import { DefaultPromptStrategy } from './default.prompt-strategy';

/**
 * Prompt Strategy Registry
 *
 * Registry Pattern implementation for managing prompt strategies.
 * Resolves the appropriate strategy based on AI generation mode.
 *
 * @description Enables Open/Closed Principle - add new strategies without modifying this class
 */
@Injectable()
export class PromptStrategyRegistry {
  private readonly strategies: Map<string, PromptStrategyPort>;

  constructor(
    @Inject(PROMPT_STRATEGIES)
    strategies: PromptStrategyPort[],
    private readonly defaultStrategy: DefaultPromptStrategy,
  ) {
    this.strategies = new Map();

    for (const strategy of strategies) {
      this.strategies.set(strategy.mode, strategy);
    }
  }

  /**
   * Resolve a prompt for the given mode
   *
   * @param mode The AI generation mode
   * @param customPrompt Optional custom prompt that overrides the strategy
   * @returns The built prompt string
   */
  resolve(mode: AiGenerationMode | string, customPrompt?: string): string {
    const strategy = this.strategies.get(mode) ?? this.defaultStrategy;
    return strategy.buildPrompt(customPrompt);
  }

  /**
   * Check if a mode has a registered strategy
   *
   * @param mode The mode to check
   * @returns boolean | True if a strategy exists for this mode
   */
  hasStrategy(mode: string): boolean {
    return this.strategies.has(mode);
  }

  /**
   * Get all registered mode names
   *
   * @returns Array of supported mode names
   */
  getSupportedModes(): string[] {
    return Array.from(this.strategies.keys());
  }
}
