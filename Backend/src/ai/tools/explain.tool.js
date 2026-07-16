/**
 * Explain Tool
 *
 * Handles concept explanation requests. Detected by the Planner when the user
 * asks "what is X", "explain Y", "how does Z work", etc.
 *
 * Input shape (parsed from user message by the planner/agent):
 *   { message, context }
 *
 * Output shape:
 *   { content: string, toolUsed: "explain", metadata: { difficulty } }
 */

import { llmService } from "../services/llm.service.js";
import { buildExplainSystemPrompt, buildExplainUserMessage } from "../prompts/explain.prompt.js";
import { TOOL_NAMES, MESSAGE_ROLES } from "../constants/ai.constants.js";
import { ApiError } from "../../utils/api-error.js";

// ── Difficulty Extractor ─────────────────────────────────────────────────────

const DIFFICULTY_KEYWORDS = {
  beginner: ["simple", "basic", "easy", "beginner", "eli5", "like i'm 5", "layman"],
  advanced: ["advanced", "deep dive", "in-depth", "technical", "expert", "detailed"],
};

/**
 * Heuristically extracts difficulty from the user's message.
 * Defaults to "intermediate" if no keywords are found.
 *
 * @param {string} message
 * @returns {"beginner" | "intermediate" | "advanced"}
 */
function extractDifficulty(message) {
  const lower = message.toLowerCase();
  for (const [level, keywords] of Object.entries(DIFFICULTY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return level;
  }
  return "intermediate";
}

// ── Explain Tool ─────────────────────────────────────────────────────────────

/**
 * Runs the explain tool.
 *
 * @param {object} params
 * @param {string} params.message              - The user's original message.
 * @param {object} params.context              - Built by ContextService.
 * @param {Array}  params.context.recentMessages - Prior conversation messages.
 * @returns {Promise<{ content: string, toolUsed: string, metadata: object }>}
 */
export async function runExplainTool({ message, context }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ApiError(422, "Explain tool requires a non-empty message.");
  }

  const difficulty = extractDifficulty(message);

  // Build message array: system prompt → conversation history → user message.
  const messages = [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: buildExplainSystemPrompt({ difficulty }),
    },
    // Include recent conversation history for multi-turn context.
    ...context.recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: MESSAGE_ROLES.USER,
      content: buildExplainUserMessage(message, difficulty),
    },
  ];

  const content = await llmService.chat(messages);

  return {
    content,
    toolUsed: TOOL_NAMES.EXPLAIN,
    metadata: { difficulty },
  };
}

/**
 * Streaming variant — yields token chunks for SSE routes.
 * Same message construction as above.
 *
 * @param {object} params
 * @returns {AsyncIterable<string>}
 */
export async function* streamExplainTool({ message, context }) {
  const difficulty = extractDifficulty(message);

  const messages = [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: buildExplainSystemPrompt({ difficulty }),
    },
    ...context.recentMessages.map((m) => ({ role: m.role, content: m.content })),
    {
      role: MESSAGE_ROLES.USER,
      content: buildExplainUserMessage(message, difficulty),
    },
  ];

  yield* llmService.stream(messages);
}
