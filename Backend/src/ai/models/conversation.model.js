/**
 * Conversation Model
 *
 * Represents a single chat session between a user and the AI.
 * Powers the ChatGPT-style sidebar on the frontend.
 *
 * Design decisions:
 * - Messages are stored in a SEPARATE collection (message.model.js) to avoid
 *   unbounded document growth and to allow efficient pagination.
 * - context uses an extensible object instead of top-level workspace/subject
 *   fields so Phase 2+ can add folderId, resourceId, noteId without schema changes.
 */

import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "New Conversation",
    },

    /**
     * The AI model used for the most recent message.
     * Stored here so the sidebar can show which model was used.
     */
    model: {
      type: String,
      trim: true,
      default: null,
    },

    /**
     * Extensible context object. Populated by the frontend/client.
     * Phase 1: workspaceId, subjectId
     * Phase 2: folderId, resourceId (for note chat, PDF chat, etc.)
     */
    context: {
      workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "workspace",
        default: null,
      },
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
        default: null,
      },
      folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "folder",
        default: null,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "resource",
        default: null,
      },
    },

    /** Cached count to avoid COUNT queries for the sidebar. */
    messageCount: {
      type: Number,
      default: 0,
    },

    /** Updated whenever a message is added. Used to sort sidebar by recency. */
    lastMessageAt: {
      type: Date,
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Main sidebar query: user's active conversations ordered by recency.
conversationSchema.index({ user: 1, isArchived: 1, lastMessageAt: -1 });

const ConversationModel = mongoose.model("conversation", conversationSchema);

export default ConversationModel;
