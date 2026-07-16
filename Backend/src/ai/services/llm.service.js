/**
 * LLMService — Provider-Agnostic LLM Abstraction
 *
 * Every piece of application code that needs language model capabilities
 * imports THIS service. No controller, tool, or agent ever touches a provider
 * directly. Swapping OpenRouter for another provider = change one import here.
 *
 * Methods:
 *   chat(messages, options?)     → Promise<string>        Full response string.
 *   stream(messages, options?)   → AsyncIterable<string>  Streaming token chunks.
 *   healthCheck()                → Promise<HealthResult>  Provider availability check.
 *   embed(texts)                 → [Phase 2] Not implemented yet.
 */

import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { createOpenRouterLLM, checkOpenRouterHealth } from "../providers/openrouter.provider.js";
import { MESSAGE_ROLES } from "../constants/ai.constants.js";
import { ApiError } from "../../utils/api-error.js";

// ── Message Conversion ───────────────────────────────────────────────────────

/**
 * Converts our internal message format `{ role, content }` array into
 * LangChain message objects. Keeps LangChain's type system internal to this
 * service — callers always use plain objects.
 *
 * @param {{ role: string, content: string }[]} messages
 * @returns {(HumanMessage | SystemMessage | AIMessage)[]}
 */
function toLangChainMessages(messages) {
  return messages.map((msg) => {
    switch (msg.role) {
      case MESSAGE_ROLES.SYSTEM:
        return new SystemMessage(msg.content);
      case MESSAGE_ROLES.USER:
        return new HumanMessage(msg.content);
      case MESSAGE_ROLES.ASSISTANT:
        return new AIMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}

// ── Error Normalisation ──────────────────────────────────────────────────────

/**
 * Maps provider-specific errors into consistent ApiError instances so callers
 * receive meaningful HTTP responses regardless of provider.
 *
 * @param {Error} err
 * @throws {ApiError}
 */
function normaliseProviderError(err) {
  const msg = err.message || "";

  if (msg.includes("401") || msg.includes("API key")) {
    throw new ApiError(502, "AI provider authentication failed. Check your API key.");
  }
  if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
    throw new ApiError(429, "AI provider rate limit reached. Please try again in a moment.");
  }
  if (msg.includes("timeout") || err.code === "ETIMEDOUT") {
    throw new ApiError(504, "AI provider timed out. Please try again.");
  }
  if (msg.includes("503") || msg.toLowerCase().includes("unavailable")) {
    throw new ApiError(503, "AI provider is temporarily unavailable.");
  }

  throw new ApiError(502, `AI provider error: ${msg || "Unknown error"}`);
}

// ── LLMService ───────────────────────────────────────────────────────────────

class LLMService {
  constructor() {
    // Lazy — provider is only created on first use so startup never fails if
    // the API key is missing (other routes still work).
    this._llm = null;
  }

  /** @returns {ChatOpenAI} */
  _getProvider(options = {}) {
    if (options.model || options.temperature !== undefined || options.streaming) {
      // Per-call override — create a new instance with those settings.
      return createOpenRouterLLM(options);
    }
    // Shared singleton for default chat calls.
    if (!this._llm) {
      this._llm = createOpenRouterLLM();
    }
    return this._llm;
  }

  // ── chat() ────────────────────────────────────────────────────────────────

  /**
   * Sends messages to the LLM and returns the complete response as a string.
   *
   * @param {{ role: string, content: string }[]} messages
   * @param {{ model?: string, temperature?: number }} [options]
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    const llm = this._getProvider(options);
    const langChainMessages = toLangChainMessages(messages);

    try {
      const response = await llm.invoke(langChainMessages);
      // response.content may be a string or an array of content blocks (vision).
      // For Phase 1 text-only use, coerce to string.
      return typeof response.content === "string"
        ? response.content
        : response.content.map((block) => block.text ?? "").join("");
    } catch (err) {
      normaliseProviderError(err);
    }
  }

  // ── stream() ──────────────────────────────────────────────────────────────

  /**
   * Streams the LLM response as an async iterable of string chunks.
   * Designed for SSE (Server-Sent Events) routes.
   *
   * Usage in a controller:
   *   for await (const chunk of llmService.stream(messages)) {
   *     res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
   *   }
   *
   * @param {{ role: string, content: string }[]} messages
   * @param {{ model?: string, temperature?: number }} [options]
   * @returns {AsyncIterable<string>}
   */
  async *stream(messages, options = {}) {
    const llm = this._getProvider({ ...options, streaming: true });
    const langChainMessages = toLangChainMessages(messages);

    try {
      const stream = await llm.stream(langChainMessages);
      for await (const chunk of stream) {
        const text =
          typeof chunk.content === "string"
            ? chunk.content
            : chunk.content?.map((b) => b.text ?? "").join("") ?? "";
        if (text) yield text;
      }
    } catch (err) {
      normaliseProviderError(err);
    }
  }

  // ── healthCheck() ─────────────────────────────────────────────────────────

  /**
   * Pings the provider to verify connectivity and API key validity.
   *
   * @returns {Promise<{ ok: boolean, model: string, latencyMs: number, error?: string }>}
   */
  async healthCheck() {
    return checkOpenRouterHealth();
  }

  // ── embed() ───────────────────────────────────────────────────────────────
  // Phase 2 placeholder — will integrate text-embedding-3-small or similar.
  // eslint-disable-next-line no-unused-vars
  async embed(_texts) {
    throw new ApiError(501, "Embeddings are not available in Phase 1.");
  }
}

// Export a single singleton — all services share the same provider instance.
export const llmService = new LLMService();
