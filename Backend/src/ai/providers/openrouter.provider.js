/**
 * OpenRouter Provider
 *
 * Wraps @langchain/openai's ChatOpenAI with OpenRouter's OpenAI-compatible
 * base URL. This is the ONLY file that knows about OpenRouter.
 *
 * To add another provider (Gemini, Groq, Anthropic), create a sibling file
 * in this directory and register it in LLMService — zero other changes needed.
 */

import { ChatOpenAI } from "@langchain/openai";
import { config } from "../../config/config.js";
import { LLM_MAX_RETRIES, LLM_TIMEOUT_MS } from "../constants/ai.constants.js";

/**
 * Creates and returns a configured ChatOpenAI instance pointing at OpenRouter.
 *
 * @param {object} [overrides] - Optional per-call overrides (model, temperature, etc.)
 * @returns {ChatOpenAI}
 */
export function createOpenRouterLLM(overrides = {}) {
  if (!config.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env file to use AI features."
    );
  }

  return new ChatOpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    model: overrides.model ?? config.OPENROUTER_MODEL,
    temperature: overrides.temperature ?? 0.7,
    maxRetries: LLM_MAX_RETRIES,
    timeout: LLM_TIMEOUT_MS,
    streaming: overrides.streaming ?? false,
    configuration: {
      baseURL: config.OPENROUTER_BASE_URL,
      defaultHeaders: {
        // OpenRouter recommended headers for analytics & rate-limit tracking.
        "HTTP-Referer": config.API_URL,
        "X-Title": "Mentra AI",
      },
    },
    ...overrides,
  });
}

/**
 * Lightweight health check — sends a minimal prompt to verify the provider
 * is reachable and the API key is valid.
 *
 * @returns {Promise<{ ok: boolean, model: string, latencyMs: number }>}
 */
export async function checkOpenRouterHealth() {
  const start = Date.now();
  const llm = createOpenRouterLLM({ temperature: 0 });

  try {
    await llm.invoke([{ role: "user", content: "ping" }]);
    return { ok: true, model: config.OPENROUTER_MODEL, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, model: config.OPENROUTER_MODEL, latencyMs: Date.now() - start, error: err.message };
  }
}
