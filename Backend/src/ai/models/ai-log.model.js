/**
 * AI Log Model
 *
 * Records every LLM request for operational observability and future analytics.
 * Writes are configurable via AI_LOG_LEVEL env var ("db" | "console" | "none").
 *
 * This data will later power:
 *   - Usage dashboards
 *   - Cost tracking
 *   - Error rate monitoring
 *   - Per-user token budgets
 */

import mongoose from "mongoose";

const aiLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      index: true,
    },

    /** Provider name e.g. "openrouter", "anthropic", "gemini" */
    provider: {
      type: String,
      required: true,
      default: "openrouter",
    },

    /** Model identifier as returned by or sent to the provider */
    model: {
      type: String,
      required: true,
    },

    /** Which tool handled this request. null = general_chat fallback */
    toolUsed: {
      type: String,
      default: null,
    },

    /** Unix timestamp of when the request was dispatched */
    requestedAt: {
      type: Date,
      required: true,
    },

    /** Unix timestamp of when the full response was received */
    respondedAt: {
      type: Date,
      default: null,
    },

    /** End-to-end latency in milliseconds */
    latencyMs: {
      type: Number,
      default: null,
    },

    promptTokens: {
      type: Number,
      default: null,
    },

    completionTokens: {
      type: Number,
      default: null,
    },

    /** Stringified error message if the request failed */
    error: {
      type: String,
      default: null,
    },

    /** HTTP status code of the error (if any) */
    errorStatus: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    // TTL index: auto-delete logs after 90 days to keep collection lean.
    // Remove or extend for longer retention.
  }
);

aiLogSchema.index({ user: 1, createdAt: -1 });
aiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 day TTL

const AiLogModel = mongoose.model("ailog", aiLogSchema);

export default AiLogModel;
