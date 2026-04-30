import { createSupabaseServiceClient } from "@/lib/supabase";
import JoinForm from "./JoinForm";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const service = createSupabaseServiceClient();

  const { data: invite } = await service
    .from("group_invites")
    .select("group_id, groups(id, name)")
    .eq("code", code)
    .maybeSingle();

  if (!invite) {
    return (
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-2">Invite not found</h1>
        <p className="text-gray-500">This invite link is invalid or has expired.</p>
      </main>
    );
  }

  const group = invite.groups as { id: string; name: string };

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Join {group.name}</h1>
      <p className="text-gray-500 mb-6">Enter your details to join this group.</p>
      <JoinForm groupId={group.id} groupName={group.name} />
    </main>
  );
}
