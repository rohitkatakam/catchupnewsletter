import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createSupabaseServiceClient();
  const { data: group } = await service
    .from("groups")
    .select("id, name, send_day, deadline_day, send_hour, timezone, char_limit, raunchy_level, num_questions, custom_instructions, allow_free_response, owner_id")
    .eq("id", id)
    .single();

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(group);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const body = await request.json();
  const { name, send_day, deadline_day, send_hour, timezone, char_limit, raunchy_level, num_questions, custom_instructions, allow_free_response } = body;

  let isValidTimezone = false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    isValidTimezone = true;
  } catch {}

  if (
    !name ||
    send_day == null || send_day < 0 || send_day > 6 ||
    deadline_day == null || deadline_day < 0 || deadline_day > 6 ||
    send_hour == null || send_hour < 0 || send_hour > 23 ||
    !timezone || !isValidTimezone ||
    !char_limit ||
    (raunchy_level != null && (raunchy_level < 1 || raunchy_level > 5)) ||
    (num_questions != null && (num_questions < 1 || num_questions > 5))
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const { error: updateError } = await service
    .from("groups")
    .update({
      name, send_day, deadline_day, send_hour, timezone, char_limit,
      raunchy_level: raunchy_level ?? null,
      num_questions: num_questions ?? 1,
      custom_instructions: custom_instructions || null,
      allow_free_response: allow_free_response ?? false,
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: "Failed to update group" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

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
