import { createSupabaseServiceClient } from "@/lib/supabase";
import { validateConfirmToken } from "@/lib/tokens";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p>Invalid confirmation link.</p>;
  }

  const result = await validateConfirmToken(token);

  if (!result.valid || !result.memberId) {
    return <p>This confirmation link is invalid or has already been used.</p>;
  }

  if (result.isConfirmed) {
    return <p>You&apos;re already confirmed — you&apos;re in!</p>;
  }

  const supabase = createSupabaseServiceClient();
  await supabase
    .from("group_members")
    .update({ is_confirmed: true, confirm_token: null })
    .eq("id", result.memberId);

  return <p>You&apos;re confirmed! You&apos;ll receive your first prompt on the next send day.</p>;
}
