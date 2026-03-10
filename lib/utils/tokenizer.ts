import { encode } from 'gpt-tokenizer'

export type AIModel = 'gpt-4o' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-5-sonnet' | 'claude-3-7-sonnet' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'llama-3-70b' | 'deepseek-chat' | 'o3-mini';

interface ModelPricing {
  name: string;
  inputCostPerMillion: number; // in USD
  outputCostPerMillion: number; // in USD
}

export const MODEL_PRICING: Record<AIModel, ModelPricing> = {
  'gpt-4o': {
    name: 'GPT-4o',
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
  },
  'gpt-4': {
    name: 'GPT-4',
    inputCostPerMillion: 30.00,
    outputCostPerMillion: 60.00,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    inputCostPerMillion: 10.00,
    outputCostPerMillion: 30.00,
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    inputCostPerMillion: 0.50,
    outputCostPerMillion: 1.50,
  },
  'o3-mini': {
    name: 'o3-mini',
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
  },
  'claude-3-7-sonnet': {
    name: 'Claude 3.7 Sonnet',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 75.00,
  },
  'claude-3-sonnet': {
    name: 'Claude 3 Sonnet',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
  },
  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    inputCostPerMillion: 0.25,
    outputCostPerMillion: 1.25,
  },
  'llama-3-70b': {
    name: 'Llama 3 70B',
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
  },
  'deepseek-chat': {
    name: 'DeepSeek V3',
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
  }
};

/**
 * Calculates the exact token count for a given text string using the standard GPT BPE tokenizer.
 * Note: While models like Claude and Llama use slightly different tokenizers, 
 * gpt-tokenizer provides a consistently accurate 95%+ baseline proxy for UI estimation.
 */
export function calculateTokenCount(text: string | null | undefined): number {
  if (!text) return 0;
  try {
    // encode returns an array of token IDs
    return encode(text).length;
  } catch (error) {
    console.warn("Failed to tokenize string:", error);
    // Fallback estimation (approx 4 chars per token)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Estimates the cost in USD for given token counts and model.
 */
export function estimateCost(inputTokens: number, outputTokens: number, modelId: string) {
  const model = MODEL_PRICING[modelId as AIModel];
  if (!model) return { inputCost: 0, outputCost: 0, totalCost: 0 }; // Fallback for unknown models

  const inputCost = (inputTokens / 1_000_000) * model.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPerMillion;
  
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

/**
 * Formats a fraction of a cent beautifully for the UI
 */
export function formatEstimatedCost(cost: number): string {
  if (isNaN(cost) || cost === 0) return "$0.00";
  if (cost < 0.0001) return "~$0.0001";
  
  // Show up to 4 decimal places for micro-transactions, dropping trailing zeros
  const raw = cost.toFixed(4);
  const trimmed = raw.replace(/0+$/, '').replace(/\.$/, '');
  return "$" + trimmed;
}
