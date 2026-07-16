/**
 * Conversation Service
 *
 * All CRUD operations on Conversation documents.
 * Ownership is enforced at service level — controllers stay thin.
 */

import ConversationModel from "../models/conversation.model.js";
import MessageModel from "../models/message.model.js";
import { ApiError } from "../../utils/api-error.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/ai.constants.js";

// ── Ownership Guard ──────────────────────────────────────────────────────────

/**
 * Finds a conversation by ID and verifies ownership.
 * Throws 404 (not found or not owned) to prevent information leakage.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<import("../models/conversation.model.js").default>}
 */
export async function getOwnedConversation(conversationId, userId) {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return conversation;
}

// ── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a new conversation.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.title]
 * @param {object} [params.context] - { workspaceId, subjectId, folderId, resourceId }
 * @returns {Promise<import("../models/conversation.model.js").default>}
 */
export async function createConversation({ userId, title, context = {} }) {
  return ConversationModel.create({
    user: userId,
    title: title?.trim() || "New Conversation",
    context: {
      workspaceId: context.workspaceId ?? null,
      subjectId: context.subjectId ?? null,
      folderId: context.folderId ?? null,
      resourceId: context.resourceId ?? null,
    },
  });
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Lists conversations for a user. Sorted by most recently active.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number }} [options]
 * @returns {Promise<{ conversations: Array, total: number, page: number, pages: number }>}
 */
export async function listConversations(userId, options = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;

  const query = { user: userId, isArchived: false };

  const [conversations, total] = await Promise.all([
    ConversationModel.find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title model context messageCount lastMessageAt createdAt")
      .lean(),
    ConversationModel.countDocuments(query),
  ]);

  return {
    conversations,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Returns a conversation and verifies ownership.
 * Does NOT include messages — use messageService.getConversationMessages().
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<import("../models/conversation.model.js").default>}
 */
export async function getConversation(conversationId, userId) {
  return getOwnedConversation(conversationId, userId);
}

// ── Update ───────────────────────────────────────────────────────────────────

/**
 * Renames a conversation.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @param {string} newTitle
 * @returns {Promise<import("../models/conversation.model.js").default>}
 */
export async function renameConversation(conversationId, userId, newTitle) {
  const conversation = await getOwnedConversation(conversationId, userId);
  conversation.title = newTitle.trim();
  await conversation.save();
  return conversation;
}

// ── Delete ───────────────────────────────────────────────────────────────────

/**
 * Deletes a conversation and all its messages.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId, userId) {
  const conversation = await getOwnedConversation(conversationId, userId);

  // Delete all messages in this conversation atomically.
  await Promise.all([
    MessageModel.deleteMany({ conversation: conversation._id }),
    ConversationModel.deleteOne({ _id: conversation._id }),
  ]);
}

// ── Response Formatter ───────────────────────────────────────────────────────

/**
 * Serialises a conversation document for API responses.
 * Keeps the response shape consistent regardless of Mongoose version.
 *
 * @param {object} conv
 * @returns {object}
 */
export function toConversationResponse(conv) {
  const obj = conv.toObject ? conv.toObject() : conv;
  return {
    id: obj._id,
    title: obj.title,
    model: obj.model,
    context: obj.context,
    messageCount: obj.messageCount,
    lastMessageAt: obj.lastMessageAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}
