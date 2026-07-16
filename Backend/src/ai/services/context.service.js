/**
 * Context Service
 *
 * Builds the structured context object that the Agent passes to every tool.
 * Phase 1: loads user info + recent conversation messages.
 * Phase 2: will extend to load workspace, subject, folder, resource content (RAG).
 *
 * No Pinecone. No embeddings. No document parsing. That's Phase 2.
 */

import { getContextMessages } from "./message.service.js";
import { config } from "../../config/config.js";

/**
 * Builds context for an AI agent run.
 *
 * @param {object} params
 * @param {object} params.user              - The authenticated user document (from req.user).
 * @param {string} params.conversationId    - Current conversation ID.
 * @returns {Promise<object>} Structured context object.
 */
export async function buildContext({ user, conversationId }) {
  const recentMessages = conversationId
    ? await getContextMessages(conversationId, config.AI_MAX_CONTEXT_MESSAGES)
    : [];

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      fullname: user.fullname,
    },
    conversationId: conversationId ?? null,
    recentMessages, // [{ role, content }] — chronological, ready for LLM
    // Phase 2 additions:
    // workspace: null,
    // subject: null,
    // folder: null,
    // relevantChunks: [],  ← RAG results
  };
}
