const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const PRIMARY_MODEL = "meta-llama/llama-3.1-8b-instruct:free";
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "meta/llama-3.1-8b-instruct";

async function callChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${baseUrl} error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    return await callChatCompletion(
      OPENROUTER_BASE,
      process.env.OPENROUTER_API_KEY!,
      PRIMARY_MODEL,
      systemPrompt,
      userPrompt
    );
  } catch {
    return await callChatCompletion(
      NVIDIA_BASE,
      process.env.NVIDIA_API_KEY!,
      NVIDIA_MODEL,
      systemPrompt,
      userPrompt
    );
  }
}

export { OPENROUTER_BASE, PRIMARY_MODEL };
