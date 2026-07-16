/**
 * AI Log Service
 *
 * Configurable logging layer for all LLM requests.
 * Behaviour is controlled by AI_LOG_LEVEL in .env:
 *
 *   "db"      → Persist to MongoDB AiLog collection (production)
 *   "console" → Print to stdout (development)
 *   "none"    → Silent (testing)
 *
 * All methods are fire-and-forget — they NEVER throw, so a logging failure
 * never disrupts the AI response pipeline.
 */

import AiLogModel from "../models/ai-log.model.js";
import { config } from "../../config/config.js";
import { AI_LOG_LEVELS } from "../constants/ai.constants.js";

const level = config.AI_LOG_LEVEL || AI_LOG_LEVELS.CONSOLE;

// ── Internal Helpers ─────────────────────────────────────────────────────────

function shouldLogToDb() {
  return level === AI_LOG_LEVELS.DB;
}

function shouldLogToConsole() {
  return level === AI_LOG_LEVELS.CONSOLE || level === AI_LOG_LEVELS.DB;
}

/**
 * @param {object} data
 */
async function writeToDb(data) {
  try {
    await AiLogModel.create(data);
  } catch (err) {
    // Never propagate — DB log failure must not break the response.
    console.error("[AiLogService] Failed to write log to DB:", err.message);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Log a successful LLM request.
 *
 * @param {object} data
 * @param {string}  data.userId
 * @param {string}  [data.conversationId]
 * @param {string}  data.provider
 * @param {string}  data.model
 * @param {string}  [data.toolUsed]
 * @param {Date}    data.requestedAt
 * @param {Date}    data.respondedAt
 * @param {number}  data.latencyMs
 * @param {number}  [data.promptTokens]
 * @param {number}  [data.completionTokens]
 */
export async function logAiRequest(data) {
  if (shouldLogToConsole()) {
    console.log(
      `[AI] ${data.provider}/${data.model} | tool=${data.toolUsed ?? "general_chat"} | ${data.latencyMs}ms`
    );
  }

  if (shouldLogToDb()) {
    await writeToDb({
      user: data.userId,
      conversation: data.conversationId ?? null,
      provider: data.provider,
      model: data.model,
      toolUsed: data.toolUsed ?? null,
      requestedAt: data.requestedAt,
      respondedAt: data.respondedAt,
      latencyMs: data.latencyMs,
      promptTokens: data.promptTokens ?? null,
      completionTokens: data.completionTokens ?? null,
    });
  }
}

/**
 * Log a failed LLM request.
 *
 * @param {object} data
 * @param {string}  data.userId
 * @param {string}  [data.conversationId]
 * @param {string}  data.provider
 * @param {string}  data.model
 * @param {string}  [data.toolUsed]
 * @param {Date}    data.requestedAt
 * @param {Error|string} data.error
 * @param {number}  [data.errorStatus]
 */
export async function logAiError(data) {
  const errorMessage = data.error instanceof Error ? data.error.message : String(data.error);

  if (shouldLogToConsole()) {
    console.error(
      `[AI ERROR] ${data.provider}/${data.model} | tool=${data.toolUsed ?? "general_chat"} | ${errorMessage}`
    );
  }

  if (shouldLogToDb()) {
    await writeToDb({
      user: data.userId,
      conversation: data.conversationId ?? null,
      provider: data.provider,
      model: data.model,
      toolUsed: data.toolUsed ?? null,
      requestedAt: data.requestedAt,
      respondedAt: new Date(),
      latencyMs: Date.now() - data.requestedAt.getTime(),
      error: errorMessage,
      errorStatus: data.errorStatus ?? null,
    });
  }
}
