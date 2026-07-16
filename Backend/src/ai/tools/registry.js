/**
 * Tool Registry
 *
 * A map-based registry of all available AI tools.
 * The Planner resolves an intent name → this registry resolves the handlers.
 *
 * Adding a new tool in Phase 2:
 *   1. Create src/ai/tools/quiz.tool.js
 *   2. Import and register it here — nothing else changes.
 *
 * Each entry exposes:
 *   run(params)    → Promise<{ content, toolUsed, metadata }>
 *   stream(params) → AsyncIterable<string>
 */

import { runExplainTool, streamExplainTool } from "./explain.tool.js";
import { runSummarizeTool, streamSummarizeTool } from "./summarize.tool.js";
import { TOOL_NAMES } from "../constants/ai.constants.js";

/**
 * @type {Map<string, { run: Function, stream: Function }>}
 */
export const toolRegistry = new Map([
  [
    TOOL_NAMES.EXPLAIN,
    {
      run: runExplainTool,
      stream: streamExplainTool,
    },
  ],
  [
    TOOL_NAMES.SUMMARIZE,
    {
      run: runSummarizeTool,
      stream: streamSummarizeTool,
    },
  ],
  // ── Phase 2 tools will be registered here ──────────────────────────────
  // [TOOL_NAMES.QUIZ,       { run: runQuizTool,       stream: streamQuizTool }],
  // [TOOL_NAMES.FLASHCARD,  { run: runFlashcardTool,  stream: streamFlashcardTool }],
]);

/**
 * Look up a tool by name.
 *
 * @param {string} toolName
 * @returns {{ run: Function, stream: Function } | undefined}
 */
export function getTool(toolName) {
  return toolRegistry.get(toolName);
}

/**
 * Returns a list of all registered tool names (useful for debugging/health).
 * @returns {string[]}
 */
export function listRegisteredTools() {
  return [...toolRegistry.keys()];
}
