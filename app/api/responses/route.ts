import { createSupabaseServiceClient } from "@/lib/supabase";
import { validateResponseToken } from "@/lib/tokens";

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.token !== "string" || typeof body.content !== "string") {
    return Response.json({ error: "Missing token or content" }, { status: 400 });
  }

  const { token, content, free_response } = body;

  const result = await validateResponseToken(token);
  if (!result.valid) {
    if (result.expired) {
      return Response.json({ error: "Submissions are closed" }, { status: 403 });
    }
    return Response.json({ error: "Invalid link" }, { status: 401 });
  }

  const { userId, promptId } = result;
  const supabase = createSupabaseServiceClient();

  const upsertData: Record<string, unknown> = {
    prompt_id: promptId,
    user_id: userId,
    content,
    updated_at: new Date().toISOString(),
  };
  if (free_response !== undefined) {
    upsertData.free_response = free_response || null;
  }

  const { error: upsertError } = await supabase.from("responses").upsert(
    upsertData,
    { onConflict: "prompt_id,user_id" }
  );
  if (upsertError) {
    return Response.json({ error: "Failed to save response" }, { status: 500 });
  }

  await supabase
    .from("response_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null);

  return Response.json({ ok: true });
}
