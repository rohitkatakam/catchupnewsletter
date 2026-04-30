import { render } from "@react-email/components";
import ConfirmEmail from "@/emails/ConfirmEmail";
import { sendEmail } from "@/lib/brevo";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { generateToken } from "@/lib/tokens";

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const { name, email, groupId } = await request.json();

  if (!name || !email || !groupId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  // Upsert user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ email, name }, { onConflict: "email" })
    .select("id")
    .single();

  if (userError || !user) {
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Check for existing membership
  const { data: existing } = await supabase
    .from("group_members")
    .select("id, is_confirmed")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (existing?.is_confirmed) {
    return Response.json({ status: "already_confirmed" });
  }

  // Fetch group name for email
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  const confirmToken = generateToken();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const confirmUrl = `${baseUrl}/confirm?token=${confirmToken}`;

  if (existing) {
    // Resend: update token
    await supabase
      .from("group_members")
      .update({ confirm_token: confirmToken, confirm_sent_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // New member
    const { error: insertError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      is_confirmed: false,
      confirm_token: confirmToken,
      confirm_sent_at: new Date().toISOString(),
    });

    if (insertError) {
      return Response.json({ error: "Failed to add member" }, { status: 500 });
    }
  }

  const html = await render(
    ConfirmEmail({ confirmUrl, groupName: group?.name ?? "your group" })
  );

  await sendEmail({
    to: [{ email, name }],
    subject: `Confirm your membership`,
    html,
  });

  return Response.json({ status: "pending" });
}
