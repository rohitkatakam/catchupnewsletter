import { createSupabaseServiceClient } from "@/lib/supabase";
import JoinForm from "./JoinForm";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: invite } = await supabase
    .from("group_invites")
    .select("group_id, groups(id, name)")
    .eq("code", code)
    .single();

  if (!invite) {
    return <p>Invite link not found. Please check the link and try again.</p>;
  }

  const group = Array.isArray(invite.groups) ? invite.groups[0] : invite.groups;

  return <JoinForm groupId={group.id} groupName={group.name} />;
}
