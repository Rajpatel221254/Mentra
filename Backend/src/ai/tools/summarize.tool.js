/**
 * Summarize Tool
 *
 * Handles text summarization requests. Detected by the Planner when the user
 * explicitly provides a body of text and asks for a TL;DR, summary, or overview.
 *
 * Input shape:
 *   { message, context }
 *
 * Output shape:
 *   { content: string, toolUsed: "summarize", metadata: { inputLength } }
 */

import { llmService } from "../services/llm.service.js";
import { buildSummarySystemPrompt, buildSummaryUserMessage } from "../prompts/summary.prompt.js";
import { TOOL_NAMES, MESSAGE_ROLES } from "../constants/ai.constants.js";
import { ApiError } from "../../utils/api-error.js";

// Strip common "summarize this:" prefixes so the model gets clean text.
const SUMMARY_PREFIXES = [
  /^(summarize|tldr|tl;dr|summary of|give me a summary of|can you summarize)[:\s]*/i,
  /^(please summarize|summarise)[:\s]*/i,
];

/**
 * Strips summarization intent preamble from the message to isolate the actual text.
 * @param {string} message
 * @returns {string}
 */
function extractTextToSummarize(message) {
  let text = message.trim();
  for (const prefix of SUMMARY_PREFIXES) {
    text = text.replace(prefix, "").trim();
  }
  return text;
}

// ── Summarize Tool ───────────────────────────────────────────────────────────

/**
 * Runs the summarize tool.
 *
 * @param {object} params
 * @param {string} params.message  - The user's original message (includes text to summarize).
 * @param {object} params.context  - Built by ContextService.
 * @returns {Promise<{ content: string, toolUsed: string, metadata: object }>}
 */
export async function runSummarizeTool({ message, context }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ApiError(422, "Summarize tool requires a non-empty message.");
  }

  const textToSummarize = extractTextToSummarize(message);

  const messages = [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: buildSummarySystemPrompt(),
    },
    // Include recent conversation history in case the user is refining a previous summary.
    ...context.recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: MESSAGE_ROLES.USER,
      content: buildSummaryUserMessage(textToSummarize),
    },
  ];

  const content = await llmService.chat(messages);

  return {
    content,
    toolUsed: TOOL_NAMES.SUMMARIZE,
    metadata: { inputLength: textToSummarize.length },
  };
}

/**
 * Streaming variant.
 *
 * @param {object} params
 * @returns {AsyncIterable<string>}
 */
export async function* streamSummarizeTool({ message, context }) {
  const textToSummarize = extractTextToSummarize(message);

  const messages = [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: buildSummarySystemPrompt(),
    },
    ...context.recentMessages.map((m) => ({ role: m.role, content: m.content })),
    {
      role: MESSAGE_ROLES.USER,
      content: buildSummaryUserMessage(textToSummarize),
    },
  ];

  yield* llmService.stream(messages);
}
