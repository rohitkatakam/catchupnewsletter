import { createSupabaseServiceClient } from "@/lib/supabase";
import { validateResponseToken } from "@/lib/tokens";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p>Invalid unsubscribe link.</p>;
  }

  const result = await validateResponseToken(token);

  if (!result.valid) {
    return <p>This unsubscribe link is invalid or has expired.</p>;
  }

  const { userId, promptId } = result;
  const supabase = createSupabaseServiceClient();

  const { data: prompt } = await supabase
    .from("prompts")
    .select("group_id")
    .eq("id", promptId!)
    .single();

  if (!prompt) {
    return <p>Something went wrong. Please try again.</p>;
  }

  await supabase
    .from("group_members")
    .update({ is_active: false })
    .eq("user_id", userId!)
    .eq("group_id", prompt.group_id);

  return (
    <main style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
      <p>You&apos;ve been unsubscribed. You won&apos;t receive any more emails from this group.</p>
    </main>
  );
}
