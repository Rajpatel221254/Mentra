/**
 * Message Service
 *
 * Handles all database operations on Message documents.
 * Controllers and the Agent only interact with conversations through this service.
 */

import MessageModel from "../models/message.model.js";
import ConversationModel from "../models/conversation.model.js";
import { MESSAGE_ROLES, MAX_CONTEXT_MESSAGES } from "../constants/ai.constants.js";

// ── Save ─────────────────────────────────────────────────────────────────────

/**
 * Saves the user's message and updates conversation metadata.
 *
 * @param {{ conversationId: string, userId: string, content: string }} params
 * @returns {Promise<import("../models/message.model.js").default>}
 */
export async function saveUserMessage({ conversationId, userId, content }) {
  const message = await MessageModel.create({
    conversation: conversationId,
    user: userId,
    role: MESSAGE_ROLES.USER,
    content,
  });

  // Update conversation's lastMessageAt for sidebar sorting.
  await ConversationModel.findByIdAndUpdate(conversationId, {
    $inc: { messageCount: 1 },
    lastMessageAt: message.createdAt,
  });

  return message;
}

/**
 * Saves the assistant's response and updates conversation metadata.
 *
 * @param {object} params
 * @param {string} params.conversationId
 * @param {string} params.userId
 * @param {string} params.content
 * @param {string} [params.toolUsed]
 * @param {string} [params.modelUsed]
 * @param {number} [params.latencyMs]
 * @param {number} [params.promptTokens]
 * @param {number} [params.completionTokens]
 * @returns {Promise<import("../models/message.model.js").default>}
 */
export async function saveAssistantMessage({
  conversationId,
  userId,
  content,
  toolUsed = null,
  modelUsed = null,
  latencyMs = null,
  promptTokens = null,
  completionTokens = null,
}) {
  const message = await MessageModel.create({
    conversation: conversationId,
    user: userId,
    role: MESSAGE_ROLES.ASSISTANT,
    content,
    toolUsed,
    modelUsed,
    latencyMs,
    promptTokens,
    completionTokens,
  });

  await ConversationModel.findByIdAndUpdate(conversationId, {
    $inc: { messageCount: 1 },
    lastMessageAt: message.createdAt,
    // Cache the latest model for sidebar display.
    ...(modelUsed && { model: modelUsed }),
  });

  return message;
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns the last N messages for context window injection.
 * Ordered oldest-first (chronological) so the LLM sees the correct turn order.
 *
 * @param {string} conversationId
 * @param {number} [limit]
 * @returns {Promise<Array<{ role: string, content: string }>>}
 */
export async function getContextMessages(conversationId, limit = MAX_CONTEXT_MESSAGES) {
  const messages = await MessageModel.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content")
    .lean();

  // Reverse to get chronological order (oldest first for LLM context).
  return messages.reverse();
}

/**
 * Returns all messages for a conversation for display on the frontend.
 * Supports cursor-based pagination for long histories.
 *
 * @param {string} conversationId
 * @param {{ before?: Date, limit?: number }} [options]
 * @returns {Promise<Array>}
 */
export async function getConversationMessages(conversationId, options = {}) {
  const { before, limit = 50 } = options;

  const query = { conversation: conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  return MessageModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("role content toolUsed modelUsed latencyMs createdAt")
    .lean();
}
