// ── Tool Names ──────────────────────────────────────────────────────────────
// Single source of truth for all tool identifiers used by the planner and registry.
export const TOOL_NAMES = {
  EXPLAIN: "explain",
  SUMMARIZE: "summarize",
};

// ── Planner intents ─────────────────────────────────────────────────────────
// What the planner can return. GENERAL_CHAT means no specific tool — agent
// calls LLMService.chat() directly.
export const PLANNER_INTENTS = {
  EXPLAIN: TOOL_NAMES.EXPLAIN,
  SUMMARIZE: TOOL_NAMES.SUMMARIZE,
  GENERAL_CHAT: "general_chat",
};

// ── Message Roles ───────────────────────────────────────────────────────────
export const MESSAGE_ROLES = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
};

// ── Context Window ──────────────────────────────────────────────────────────
// Max number of recent messages loaded into context before each LLM call.
export const MAX_CONTEXT_MESSAGES = 20;

// ── Message Limits ──────────────────────────────────────────────────────────
export const MAX_MESSAGE_LENGTH = 10_000; // characters
export const MAX_CONVERSATION_TITLE_LENGTH = 150;

// ── Pagination ──────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ── AI Logging ──────────────────────────────────────────────────────────────
// Set LOG_LEVEL in env to control where AI logs go.
// "db"      → persist to MongoDB AiLog collection
// "console" → log to stdout (useful in development)
// "none"    → silent (useful in tests)
export const AI_LOG_LEVELS = {
  DB: "db",
  CONSOLE: "console",
  NONE: "none",
};

// ── Retry ───────────────────────────────────────────────────────────────────
export const LLM_MAX_RETRIES = 2;
export const LLM_TIMEOUT_MS = 30_000;
