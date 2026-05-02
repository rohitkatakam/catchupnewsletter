import { createSupabaseServiceClient } from "@/lib/supabase";
import { validateResponseToken } from "@/lib/tokens";
import ResponseForm from "./ResponseForm";

export default async function RespondPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p>Invalid link.</p>;
  }

  const result = await validateResponseToken(token);

  if (!result.valid) {
    if (result.expired) {
      return <p>Submissions are closed for this week.</p>;
    }
    return <p>This link is invalid.</p>;
  }

  const { userId, promptId } = result;
  const supabase = createSupabaseServiceClient();

  const { data: prompt } = await supabase
    .from("prompts")
    .select("content, groups(name, char_limit)")
    .eq("id", promptId!)
    .single();

  if (!prompt) {
    return <p>Something went wrong loading this week&apos;s prompt.</p>;
  }

  const group = Array.isArray(prompt.groups) ? prompt.groups[0] : prompt.groups;

  const { data: existing } = await supabase
    .from("responses")
    .select("content")
    .eq("prompt_id", promptId!)
    .eq("user_id", userId!)
    .maybeSingle();

  return (
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
      <ResponseForm
        token={token}
        prompt={prompt.content}
        groupName={group?.name ?? ""}
        charLimit={group?.char_limit ?? 500}
        existing={existing?.content ?? ""}
      />
    </main>
  );
}
