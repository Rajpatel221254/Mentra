/**
 * Message Model
 *
 * Each document is a single turn in a conversation.
 * Stored separately from Conversation to allow:
 *   - Efficient context window queries (last N messages)
 *   - Pagination without loading the entire history
 *   - Per-message metadata (latency, tool, model, tokens)
 */

import mongoose from "mongoose";
import { MESSAGE_ROLES } from "../constants/ai.constants.js";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    /** "system" | "user" | "assistant" */
    role: {
      type: String,
      enum: Object.values(MESSAGE_ROLES),
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 50_000, // hard cap — prevents storing massive streamed outputs
    },

    /** Which tool the agent used to generate this response. null = general_chat */
    toolUsed: {
      type: String,
      default: null,
    },

    /** Model that generated this response (only set on assistant messages) */
    modelUsed: {
      type: String,
      default: null,
    },

    /** Time from request sent to full response received, in milliseconds */
    latencyMs: {
      type: Number,
      default: null,
    },

    // ── Token counters (populated when available from provider) ────────────
    promptTokens: {
      type: Number,
      default: null,
    },
    completionTokens: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    // createdAt effectively serves as the message timestamp.
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Context window query: last N messages for a conversation in order.
messageSchema.index({ conversation: 1, createdAt: 1 });

const MessageModel = mongoose.model("message", messageSchema);

export default MessageModel;
