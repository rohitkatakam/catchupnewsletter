import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, send_day, deadline_day, send_hour, timezone, char_limit } = body;

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
    !char_limit
  ) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  const { data: group, error: groupError } = await service
    .from("groups")
    .insert({ name, owner_id: user.id, send_day, deadline_day, send_hour, timezone, char_limit })
    .select("id")
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }

  const code = randomBytes(6).toString("base64url");

  const { error: inviteError } = await service
    .from("group_invites")
    .insert({ group_id: group.id, code, created_by: user.id });

  if (inviteError) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  await service.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    is_confirmed: true,
    is_active: true,
  });

  return NextResponse.json({ code }, { status: 201 });
}
