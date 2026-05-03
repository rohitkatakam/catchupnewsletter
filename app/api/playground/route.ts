import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/openrouter";
import { buildPromptSystemPrompt, buildNewsletterSystemPrompt } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-playground-password");
  if (!password || password !== process.env.PLAYGROUND_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, raunchyLevel, numQuestions, customInstructions, pastPrompts, prompts, responses } = body;

  let systemPrompt: string;
  let userPrompt: string;

  if (type === "prompt") {
    systemPrompt = buildPromptSystemPrompt({
      raunchyLevel,
      numQuestions,
      customInstructions,
      recentPrompts: pastPrompts,
    });
    userPrompt = numQuestions > 1 ? `Generate ${numQuestions} new prompts.` : "Generate a new prompt.";
  } else if (type === "newsletter") {
    const formattedResponses = (responses as { name: string; response: string }[])
      .map((r) => `${r.name}: ${r.response}`)
      .join("\n");
    systemPrompt = buildNewsletterSystemPrompt(prompts, formattedResponses, {
      raunchyLevel,
      customInstructions,
    });
    userPrompt = "Write the newsletter.";
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const result = await generateText(systemPrompt, userPrompt);
  return NextResponse.json({ result });
}
