import { createSupabaseServiceClient } from "@/lib/supabase";
import { validateConfirmToken } from "@/lib/tokens";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-2">Invalid link</h1>
        <p className="text-gray-500">This confirmation link is missing a token.</p>
      </main>
    );
  }

  const result = await validateConfirmToken(token);

  if (!result.valid || !result.memberId) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-2">Link already used or invalid</h1>
        <p className="text-gray-500">
          This confirmation link has already been used or is invalid. If you need a new link,
          please rejoin using the original invite.
        </p>
      </main>
    );
  }

  const service = createSupabaseServiceClient();

  const { data: member } = await service
    .from("group_members")
    .select("is_confirmed, groups(name)")
    .eq("id", result.memberId)
    .single();

  if (member?.is_confirmed) {
    const groupName = (member.groups as { name: string } | null)?.name ?? "the group";
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-2">Already confirmed</h1>
        <p className="text-gray-500">Your membership in {groupName} is already confirmed.</p>
      </main>
    );
  }

  await service
    .from("group_members")
    .update({ is_confirmed: true, confirm_token: null })
    .eq("id", result.memberId);

  const groupName = (member?.groups as { name: string } | null)?.name ?? "the group";

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">You're confirmed!</h1>
      <p className="text-gray-500">
        You've successfully joined {groupName}. You'll receive the next newsletter!
      </p>
    </main>
  );
}
