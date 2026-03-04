import Anthropic from "@anthropic-ai/sdk";
import { CONFIG } from "../config.js";

export const anthropic = new Anthropic({ apiKey: CONFIG.ANTHROPIC_API_KEY });

/**
 * Adaptive thinking — SDK 0.51 types don't include 'adaptive', cast via unknown.
 */
export const THINKING_PARAM = {
  type: "adaptive",
} as unknown as { type: "enabled"; budget_tokens: number };
