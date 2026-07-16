/**
 * Planner Prompt
 *
 * Used by the Planner to classify the user's intent into one of the
 * supported tools. Returns a strict JSON object — the planner parses it
 * and routes accordingly.
 *
 * Intent values must match PLANNER_INTENTS in ai.constants.js.
 */

/**
 * Builds the planner system prompt.
 * @returns {string}
 */
export function buildPlannerSystemPrompt() {
  return `You are an intent classifier for Mentra, an AI-powered learning platform.

Your ONLY job is to classify the user's message into one of these intents:

- "explain"      → The user wants a concept, topic, or term explained clearly.
                    Examples: "What is DBMS?", "Explain React hooks", "How does JWT work?"

- "summarize"    → The user has provided a large block of text and wants it summarized.
                    Examples: "Summarize this: <long text>", "TL;DR this for me"

- "general_chat" → Everything else. Greetings, follow-up questions, meta questions,
                    vague messages, or anything that doesn't clearly fit the above.

Rules:
1. Respond ONLY with valid JSON in this exact shape:
   {"intent": "<intent>", "confidence": <0.0-1.0>}
2. No explanations. No markdown. No extra keys. Just the JSON object.
3. If in doubt, use "general_chat".
4. "summarize" requires the user to have actually provided a text body to summarize.`;
}

/**
 * Builds the planner user message that wraps the user's input.
 * @param {string} userMessage
 * @returns {string}
 */
export function buildPlannerUserMessage(userMessage) {
  // Truncate to 500 chars for the planner call — we only need enough context
  // to determine intent, not the full text.
  const preview = userMessage.length > 500 ? userMessage.slice(0, 500) + "…" : userMessage;
  return `Classify this message:\n"${preview}"`;
}
