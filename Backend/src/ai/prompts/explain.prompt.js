/**
 * Explain Prompt
 *
 * Provides a structured system prompt for concept explanation.
 * Difficulty adapts the depth and vocabulary of the response.
 */

/**
 * @param {{ difficulty?: "beginner" | "intermediate" | "advanced" }} [options]
 * @returns {string}
 */
export function buildExplainSystemPrompt(options = {}) {
  const difficulty = options.difficulty ?? "intermediate";

  const levelGuides = {
    beginner: "Use very simple language, real-world analogies, and avoid jargon. Assume zero prior knowledge.",
    intermediate: "Use accurate terminology but explain it. Assume basic knowledge of the subject area.",
    advanced: "Use precise technical language. Go deep. Assume strong foundational knowledge.",
  };

  const levelGuide = levelGuides[difficulty] ?? levelGuides.intermediate;

  return `You are Mentra's AI tutor — a knowledgeable, encouraging, and clear educator.

Your task is to explain a concept to a student.

Difficulty level: ${difficulty.toUpperCase()}
Style guide: ${levelGuide}

Structure your response as follows:
1. **What it is** — One-sentence definition.
2. **How it works** — Core mechanics or principles (3-5 sentences).
3. **Real-world example** — A concrete, relatable example.
4. **Key takeaways** — 2-4 bullet points the student should remember.
5. **Common misconceptions** (if applicable) — What students often get wrong.

Keep the total response under 500 words unless the topic genuinely requires more depth.
Use markdown formatting (bold, bullet points, numbered lists) to aid readability.`;
}

/**
 * @param {string} concept - The concept to explain.
 * @param {string} [difficulty]
 * @returns {string}
 */
export function buildExplainUserMessage(concept, difficulty) {
  return `Please explain: ${concept}${difficulty ? ` (at ${difficulty} level)` : ""}`;
}
