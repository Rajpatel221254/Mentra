/**
 * Planner
 *
 * Sits between the Agent and the Tool Registry.
 * Receives the user's natural language message → returns a resolved intent.
 *
 * Pipeline:
 *   User Message → Planner (cheap LLM call) → intent
 *                                              ↓
 *                                  Agent routes to Tool or general chat
 *
 * Design notes:
 * - Uses a small, fast prompt (truncated to 500 chars) to keep cost low.
 * - Falls back to GENERAL_CHAT on any parse failure so the UX never breaks.
 * - Confidence threshold (0.65) prevents weak detections from triggering tools.
 */

import { llmService } from "../services/llm.service.js";
import { buildPlannerSystemPrompt, buildPlannerUserMessage } from "../prompts/planner.prompt.js";
import { PLANNER_INTENTS, MESSAGE_ROLES } from "../constants/ai.constants.js";

const CONFIDENCE_THRESHOLD = 0.65;

/**
 * Parses the LLM's JSON response. Returns a safe fallback on any error so
 * the planner never throws — a classification error should never crash a chat.
 *
 * @param {string} raw
 * @returns {{ intent: string, confidence: number }}
 */
function parsePlannerResponse(raw) {
  try {
    // Strip markdown code fences if the model wraps output in ```json ... ```
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    const intent = parsed.intent?.toLowerCase();
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;

    // Validate intent is a known value.
    const validIntents = Object.values(PLANNER_INTENTS);
    if (!validIntents.includes(intent)) {
      return { intent: PLANNER_INTENTS.GENERAL_CHAT, confidence: 1 };
    }

    return { intent, confidence };
  } catch {
    // Any JSON parse error → safe fallback.
    return { intent: PLANNER_INTENTS.GENERAL_CHAT, confidence: 1 };
  }
}

// ── Planner ──────────────────────────────────────────────────────────────────

/**
 * Classifies user intent using a lightweight LLM call.
 *
 * @param {string} userMessage - The raw message from the user.
 * @returns {Promise<{ intent: string, confidence: number }>}
 *   intent is one of PLANNER_INTENTS values.
 */
export async function planIntent(userMessage) {
  const messages = [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: buildPlannerSystemPrompt(),
    },
    {
      role: MESSAGE_ROLES.USER,
      content: buildPlannerUserMessage(userMessage),
    },
  ];

  let raw;
  try {
    // Use temperature 0 for deterministic classification.
    raw = await llmService.chat(messages, { temperature: 0 });
  } catch {
    // If the planner LLM call itself fails, fall back gracefully.
    return { intent: PLANNER_INTENTS.GENERAL_CHAT, confidence: 1 };
  }

  const result = parsePlannerResponse(raw);

  // If confidence is too low, treat as general chat to avoid bad tool dispatch.
  if (result.confidence < CONFIDENCE_THRESHOLD) {
    return { intent: PLANNER_INTENTS.GENERAL_CHAT, confidence: result.confidence };
  }

  return result;
}
