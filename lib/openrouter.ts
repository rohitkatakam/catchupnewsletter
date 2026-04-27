const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const PRIMARY_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

export async function generateText(_systemPrompt: string, _userPrompt: string): Promise<string> {
  throw new Error("not implemented");
}

export { OPENROUTER_BASE, PRIMARY_MODEL };
