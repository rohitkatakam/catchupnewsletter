interface PromptOptions {
  raunchyLevel?: number; // 1–5, default 2
  numQuestions?: number; // 1–5, default 1
  customInstructions?: string;
  recentPrompts?: string;
}

interface NewsletterOptions {
  raunchyLevel?: number;
  customInstructions?: string;
}

const RAUNCHY_DESCRIPTIONS: Record<number, string> = {
  1: "Keep it completely clean and wholesome — nothing edgy.",
  2: "Casual and friendly. Light humor is fine, nothing risqué.",
  3: "Playful and a bit cheeky. Mild adult humor is okay.",
  4: "Leaning into adult humor. Innuendo and mild raunchy content is welcome.",
  5: "Go full raunchy. Adult humor, spicy topics, nothing off-limits for a close friend group.",
};

export function buildPromptSystemPrompt(opts: PromptOptions = {}): string {
  const { raunchyLevel = 2, numQuestions = 1, customInstructions, recentPrompts } = opts;
  const raunchyDesc = RAUNCHY_DESCRIPTIONS[raunchyLevel] ?? RAUNCHY_DESCRIPTIONS[2];
  const questionWord = numQuestions === 1 ? "prompt" : `${numQuestions} prompts`;
  const recentList = recentPrompts?.trim() || "none";

  return [
    `You generate weekly ${questionWord} for a college friend group (recently graduated) newsletter. These questions are meant to allow close friends to keep up with each other in a fun way on a weekly basis.`,
    `These questions should be related to recent life updates, as this group should be using them to keep up with each other's lives. They can be about anything - work, relationships, hobbies, random thoughts - as long as they invite sharing about what's recently happening in their lives."`,
    `Questions should be tailored to RECENT experiences; they shouldn't be generic questions that could apply to any time in the past. Ask questions about recent events, activities, feelings, things that would have relevant answers within the last week/month."`,
    `Tone: casual, warm, fun. Think "catching up over dinner" not "corporate icebreaker. Stay away from sexual content, but other than that anything goes."`,
    `${questionWord.charAt(0).toUpperCase() + questionWord.slice(1)} should be open-ended and invite short personal stories or opinions.`,
    `Raunchy level: ${raunchyLevel}/5 — ${raunchyDesc}`,
    `Do NOT repeat or closely resemble any of these recent prompts:\n${recentList}`,
    customInstructions ? `Additional instructions: ${customInstructions}` : "",
    `Respond with only the prompt text${numQuestions > 1 ? ", one per line, numbered" : ""}, no preamble.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildNewsletterSystemPrompt(
  prompts: string[],
  responses: string,
  opts: NewsletterOptions = {}
): string {
  const { raunchyLevel = 2, customInstructions } = opts;
  const raunchyDesc = RAUNCHY_DESCRIPTIONS[raunchyLevel] ?? RAUNCHY_DESCRIPTIONS[2];
  const promptsBlock =
    prompts.length === 1
      ? `This week's prompt was: ${prompts[0]}`
      : `This week's prompts were:\n${prompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;

  return [
    `You are writing a fun weekly newsletter for a college friend group.`,
    promptsBlock,
    `Here are the responses, each labeled with the person's name:\n${responses}`,
    `Write a warm, lightly editorialized summary (not just stitching responses together).`,
    `Highlight interesting agreements, differences, and funny moments.`,
    `Keep it under 400 words. Include the prompt(s) at the top, clearly labeled.`,
    `Tone: like a fun group chat recap, not a news article.`,
    `Raunchy level: ${raunchyLevel}/5 — ${raunchyDesc}`,
    customInstructions ? `Additional instructions: ${customInstructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Legacy exports used by cron routes — kept for backwards compat during migration
export const PROMPT_SYSTEM_PROMPT = buildPromptSystemPrompt();
export const NEWSLETTER_SYSTEM_PROMPT = "";
