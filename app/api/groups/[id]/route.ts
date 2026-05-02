import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();

  const { data: group } = await service
    .from("groups")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.owner_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete child rows in dependency order (no CASCADE in schema)
  const { data: prompts } = await service
    .from("prompts")
    .select("id")
    .eq("group_id", id);

  if (prompts && prompts.length > 0) {
    const promptIds = prompts.map((p) => p.id);
    await service.from("newsletters").delete().in("prompt_id", promptIds);
    await service.from("responses").delete().in("prompt_id", promptIds);
    await service.from("response_tokens").delete().in("prompt_id", promptIds);
    await service.from("prompts").delete().in("id", promptIds);
  }

  await service.from("group_members").delete().eq("group_id", id);
  await service.from("group_invites").delete().eq("group_id", id);
  await service.from("groups").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
