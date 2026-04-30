import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { generateToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/brevo";
import ConfirmEmail from "@/emails/ConfirmEmail";

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, groupId } = body;

  if (!name || !email || !groupId) {
    return NextResponse.json(
      { error: "name, email, and groupId are required" },
      { status: 400 }
    );
  }

  const service = createSupabaseServiceClient();

  const { data: group } = await service
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Upsert user by email (update name if already exists)
  const { data: user, error: userError } = await service
    .from("users")
    .upsert({ email, name }, { onConflict: "email" })
    .select("id")
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Check for existing membership
  const { data: existingMember } = await service
    .from("group_members")
    .select("id, is_confirmed")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember?.is_confirmed) {
    return NextResponse.json(
      { message: "You're already a confirmed member of this group." },
      { status: 200 }
    );
  }

  const confirmToken = generateToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const confirmUrl = `${appUrl}/confirm?token=${confirmToken}`;

  if (existingMember) {
    await service
      .from("group_members")
      .update({ confirm_token: confirmToken, confirm_sent_at: new Date().toISOString() })
      .eq("id", existingMember.id);
  } else {
    const { error: memberError } = await service
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        confirm_token: confirmToken,
        is_confirmed: false,
        confirm_sent_at: new Date().toISOString(),
      });

    if (memberError) {
      return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
    }
  }

  const html = renderToStaticMarkup(
    React.createElement(ConfirmEmail, { confirmUrl, groupName: group.name })
  );

  await sendEmail({
    to: [{ email, name }],
    subject: `Confirm your membership in ${group.name}`,
    html,
  });

  return NextResponse.json(
    { message: "Check your email to confirm your membership." },
    { status: 201 }
  );
}
