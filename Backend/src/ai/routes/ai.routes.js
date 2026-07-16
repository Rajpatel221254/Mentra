/**
 * AI Routes
 *
 * All routes are protected with the existing `authenticate` middleware.
 * Follows the same conventions as the rest of the Mentra API.
 *
 * POST   /api/ai/conversations              → Create conversation
 * GET    /api/ai/conversations              → List conversations (paginated)
 * GET    /api/ai/conversations/:id          → Get conversation
 * GET    /api/ai/conversations/:id/messages → Get messages (paginated)
 * PATCH  /api/ai/conversations/:id          → Rename conversation
 * DELETE /api/ai/conversations/:id          → Delete conversation
 * POST   /api/ai/chat                       → Send message (?stream=true for SSE)
 * GET    /api/ai/health                     → Provider health check
 */

import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  createConversationController,
  listConversationsController,
  getConversationController,
  getMessagesController,
  renameConversationController,
  deleteConversationController,
  sendMessageController,
  healthController,
} from "../controllers/ai.controller.js";
import {
  createConversationValidator,
  listConversationsValidator,
  conversationIdValidator,
  renameConversationValidator,
  sendMessageValidator,
  getMessagesValidator,
} from "../validators/ai.validator.js";

const aiRouter = express.Router();

// All AI routes require authentication.
aiRouter.use(authenticate);

// ── Health ────────────────────────────────────────────────────────────────────
aiRouter.get("/health", healthController);

// ── Chat ──────────────────────────────────────────────────────────────────────
aiRouter.post(
  "/chat",
  sendMessageValidator,
  validateRequest,
  sendMessageController
);

// ── Conversations ─────────────────────────────────────────────────────────────
aiRouter.post(
  "/conversations",
  createConversationValidator,
  validateRequest,
  createConversationController
);

aiRouter.get(
  "/conversations",
  listConversationsValidator,
  validateRequest,
  listConversationsController
);

aiRouter.get(
  "/conversations/:id",
  conversationIdValidator,
  validateRequest,
  getConversationController
);

aiRouter.get(
  "/conversations/:id/messages",
  getMessagesValidator,
  validateRequest,
  getMessagesController
);

aiRouter.patch(
  "/conversations/:id",
  renameConversationValidator,
  validateRequest,
  renameConversationController
);

aiRouter.delete(
  "/conversations/:id",
  conversationIdValidator,
  validateRequest,
  deleteConversationController
);

export default aiRouter;
