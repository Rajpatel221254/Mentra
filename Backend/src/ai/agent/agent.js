/**
 * Agent
 *
 * Orchestrates the full AI pipeline for a single chat turn:
 *
 *   1. Build context  (user + conversation history)
 *   2. Save user message to DB
 *   3. Call Planner  → get intent
 *   4. Dispatch to Tool (via registry) OR call LLMService.chat() directly
 *   5. Save assistant message to DB
 *   6. Log the request
 *   7. Return structured response
 *
 * For streaming:
 *   Steps 1-3 are synchronous setup.
 *   Step 4 yields chunks instead of returning a full string.
 *   Steps 5-6 happen after the stream is consumed.
 */

import { buildContext } from "../services/context.service.js";
import { planIntent } from "../planner/planner.js";
import { getTool } from "../tools/registry.js";
import { llmService } from "../services/llm.service.js";
import { saveUserMessage, saveAssistantMessage } from "../services/message.service.js";
import { logAiRequest, logAiError } from "../services/ai-log.service.js";
import { PLANNER_INTENTS, MESSAGE_ROLES } from "../constants/ai.constants.js";
import { config } from "../../config/config.js";

const PROVIDER = "openrouter";

// ── General Chat Fallback ────────────────────────────────────────────────────

/**
 * Builds a message array for general chat (no specific tool).
 * Includes a lightweight system prompt and full conversation history.
 *
 * @param {string} userMessage
 * @param {object} context
 * @returns {{ role: string, content: string }[]}
 */
function buildGeneralChatMessages(userMessage, context) {
  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are Mentra, a friendly and knowledgeable AI learning assistant.
Help students learn effectively. Be concise, clear, and encouraging.
If asked to explain a concept or summarize text in depth, do so helpfully.`,
    },
    ...context.recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: MESSAGE_ROLES.USER, content: userMessage },
  ];
}

// ── Non-Streaming Run ────────────────────────────────────────────────────────

/**
 * Runs the full agent pipeline and returns the complete assistant response.
 *
 * @param {object} params
 * @param {object} params.user           - req.user document
 * @param {string} params.conversationId - Existing conversation ID
 * @param {string} params.message        - User's natural language message
 * @returns {Promise<{
 *   content: string,
 *   toolUsed: string | null,
 *   intent: string,
 *   latencyMs: number,
 *   conversationId: string,
 * }>}
 */
export async function runAgent({ user, conversationId, message }) {
  const requestedAt = new Date();

  // 1. Build context
  const context = await buildContext({ user, conversationId });

  // 2. Save user message
  await saveUserMessage({ conversationId, userId: user._id.toString(), content: message });

  // 3. Plan intent
  const { intent } = await planIntent(message);

  let content;
  let toolUsed = null;

  try {
    // 4a. Dispatch to a registered tool
    if (intent !== PLANNER_INTENTS.GENERAL_CHAT) {
      const tool = getTool(intent);
      if (tool) {
        const result = await tool.run({ message, context });
        content = result.content;
        toolUsed = result.toolUsed;
      } else {
        // Tool name returned by planner but not in registry → graceful fallback.
        content = await llmService.chat(buildGeneralChatMessages(message, context));
      }
    } else {
      // 4b. General chat fallback — call LLMService directly, no tool wrapper.
      content = await llmService.chat(buildGeneralChatMessages(message, context));
    }
  } catch (err) {
    // Log the error then re-throw — the controller's asyncHandler will catch it.
    await logAiError({
      userId: user._id.toString(),
      conversationId,
      provider: PROVIDER,
      model: config.OPENROUTER_MODEL,
      toolUsed: intent,
      requestedAt,
      error: err,
      errorStatus: err.statusCode ?? null,
    });
    throw err;
  }

  const respondedAt = new Date();
  const latencyMs = respondedAt - requestedAt;

  // 5. Save assistant message
  await saveAssistantMessage({
    conversationId,
    userId: user._id.toString(),
    content,
    toolUsed,
    modelUsed: config.OPENROUTER_MODEL,
    latencyMs,
  });

  // 6. Log (fire-and-forget)
  logAiRequest({
    userId: user._id.toString(),
    conversationId,
    provider: PROVIDER,
    model: config.OPENROUTER_MODEL,
    toolUsed,
    requestedAt,
    respondedAt,
    latencyMs,
  });

  return {
    content,
    toolUsed,
    intent,
    latencyMs,
    conversationId,
  };
}

// ── Streaming Run ────────────────────────────────────────────────────────────

/**
 * Streaming variant of runAgent.
 *
 * Yields: { type: "chunk", data: string } during streaming
 * Final:  { type: "done", toolUsed, intent, latencyMs }
 *
 * The controller handles SSE formatting; the agent just yields clean data.
 *
 * @param {object} params
 * @yields {{ type: string, data?: string, toolUsed?: string, intent?: string, latencyMs?: number }}
 */
export async function* runAgentStream({ user, conversationId, message }) {
  const requestedAt = new Date();

  // 1. Build context
  const context = await buildContext({ user, conversationId });

  // 2. Save user message
  await saveUserMessage({ conversationId, userId: user._id.toString(), content: message });

  // 3. Plan intent
  const { intent } = await planIntent(message);

  let toolUsed = null;
  const chunks = [];

  try {
    let streamIterable;

    // 4a. Dispatch to registered tool (streaming variant)
    if (intent !== PLANNER_INTENTS.GENERAL_CHAT) {
      const tool = getTool(intent);
      if (tool) {
        toolUsed = intent;
        streamIterable = tool.stream({ message, context });
      } else {
        streamIterable = llmService.stream(buildGeneralChatMessages(message, context));
      }
    } else {
      // 4b. General chat streaming
      streamIterable = llmService.stream(buildGeneralChatMessages(message, context));
    }

    // Yield each chunk to the SSE controller and collect for DB storage.
    for await (const chunk of streamIterable) {
      chunks.push(chunk);
      yield { type: "chunk", data: chunk };
    }
  } catch (err) {
    await logAiError({
      userId: user._id.toString(),
      conversationId,
      provider: PROVIDER,
      model: config.OPENROUTER_MODEL,
      toolUsed: intent,
      requestedAt,
      error: err,
      errorStatus: err.statusCode ?? null,
    });
    throw err;
  }

  const respondedAt = new Date();
  const latencyMs = respondedAt - requestedAt;
  const fullContent = chunks.join("");

  console.log(fullContent);

  // 5. Save assistant message after stream completes
  await saveAssistantMessage({
    conversationId,
    userId: user._id.toString(),
    content: fullContent,
    toolUsed,
    modelUsed: config.OPENROUTER_MODEL,
    latencyMs,
  });

  // 6. Log
  logAiRequest({
    userId: user._id.toString(),
    conversationId,
    provider: PROVIDER,
    model: config.OPENROUTER_MODEL,
    toolUsed,
    requestedAt,
    respondedAt,
    latencyMs,
  });

  // Signal stream completion to the SSE controller.
  yield { type: "done", toolUsed, intent, latencyMs };
}
