/**
 * AI Controller
 *
 * Thin HTTP handlers — no business logic lives here.
 * All logic is delegated to services and the agent.
 *
 * Routes handled:
 *   POST   /api/ai/conversations          → createConversationController
 *   GET    /api/ai/conversations          → listConversationsController
 *   GET    /api/ai/conversations/:id      → getConversationController
 *   GET    /api/ai/conversations/:id/messages → getMessagesController
 *   PATCH  /api/ai/conversations/:id      → renameConversationController
 *   DELETE /api/ai/conversations/:id      → deleteConversationController
 *   POST   /api/ai/chat                   → sendMessageController (+ streaming)
 *   GET    /api/ai/health                 → healthController
 */

import { asyncHandler } from "../../utils/async-handler.js";
import {
  createConversation,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  toConversationResponse,
} from "../services/conversation.service.js";
import { getConversationMessages } from "../services/message.service.js";
import { runAgent, runAgentStream } from "../agent/agent.js";
import { llmService } from "../services/llm.service.js";
import { config } from "../../config/config.js";
import { listRegisteredTools } from "../tools/registry.js";

// ── Conversations ─────────────────────────────────────────────────────────────

export const createConversationController = asyncHandler(async (req, res) => {
  const conversation = await createConversation({
    userId: req.user._id.toString(),
    title: req.body.title,
    context: req.body.context,
  });

  res.status(201).json({
    success: true,
    message: "Conversation created",
    resource: toConversationResponse(conversation),
  });
});

export const listConversationsController = asyncHandler(async (req, res) => {
  const { conversations, total, page, pages } = await listConversations(
    req.user._id.toString(),
    {
      page: req.query.page,
      limit: req.query.limit,
    }
  );

  res.status(200).json({
    success: true,
    resources: conversations.map(toConversationResponse),
    pagination: { total, page, pages },
  });
});

export const getConversationController = asyncHandler(async (req, res) => {
  const conversation = await getConversation(req.params.id, req.user._id.toString());

  res.status(200).json({
    success: true,
    resource: toConversationResponse(conversation),
  });
});

export const getMessagesController = asyncHandler(async (req, res) => {
  // Ownership check first
  await getConversation(req.params.id, req.user._id.toString());

  const messages = await getConversationMessages(req.params.id, {
    before: req.query.before,
    limit: req.query.limit ?? 50,
  });

  // Return in chronological order for the frontend.
  res.status(200).json({
    success: true,
    resources: messages.reverse(),
  });
});

export const renameConversationController = asyncHandler(async (req, res) => {
  const conversation = await renameConversation(
    req.params.id,
    req.user._id.toString(),
    req.body.title
  );

  res.status(200).json({
    success: true,
    message: "Conversation renamed",
    resource: toConversationResponse(conversation),
  });
});

export const deleteConversationController = asyncHandler(async (req, res) => {
  await deleteConversation(req.params.id, req.user._id.toString());

  res.status(200).json({
    success: true,
    message: "Conversation deleted",
  });
});

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 *
 * Accepts:
 *   { conversationId, message }
 *
 * Query params:
 *   ?stream=true   → returns Server-Sent Events stream
 *
 * The controller decides between streaming and non-streaming based on the
 * query param — the agent supports both paths transparently.
 */
export const sendMessageController = asyncHandler(async (req, res) => {
  const { conversationId, message } = req.body;
  const wantsStream = req.query.stream === "true";

  if (wantsStream) {
    // ── Streaming (SSE) ──────────────────────────────────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Ensure nginx / proxies don't buffer the stream.
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      for await (const event of runAgentStream({
        user: req.user,
        conversationId,
        message,
      })) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        if (event.type === "done") {
          // Final metadata event — signal end of stream.
          res.write("data: [DONE]\n\n");
          break;
        }
      }
    } catch (err) {
      // Send error as SSE event so the client can handle it gracefully.
      res.write(
        `data: ${JSON.stringify({ type: "error", message: err.message || "AI request failed" })}\n\n`
      );
    } finally {
      res.end();
    }

    return;
  }

  // ── Non-Streaming ────────────────────────────────────────────────────────
  const result = await runAgent({
    user: req.user,
    conversationId,
    message,
  });

  res.status(200).json({
    success: true,
    resource: {
      content: result.content,
      toolUsed: result.toolUsed,
      intent: result.intent,
      latencyMs: result.latencyMs,
      conversationId: result.conversationId,
    },
  });
});

// ── Health ────────────────────────────────────────────────────────────────────

/**
 * GET /api/ai/health
 *
 * Returns provider connectivity status, current model, and registered tools.
 * Useful during CI, deployments, and debugging.
 */
export const healthController = asyncHandler(async (req, res) => {
  const health = await llmService.healthCheck();

  res.status(health.ok ? 200 : 503).json({
    success: health.ok,
    provider: "openrouter",
    model: config.OPENROUTER_MODEL,
    registeredTools: listRegisteredTools(),
    latencyMs: health.latencyMs,
    ...(health.error && { error: health.error }),
  });
});
