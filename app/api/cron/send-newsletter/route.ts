import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { generateText } from "@/lib/openrouter";
import { buildNewsletterSystemPrompt } from "@/lib/prompts";
import { sendEmail } from "@/lib/brevo";
import NewsletterEmail from "@/emails/NewsletterEmail";
import { render } from "@react-email/render";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.CRON_ENABLED !== "true") {
    return NextResponse.json({ skipped: true });
  }

  const supabase = createSupabaseServiceClient();
  const today = new Date();

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, send_day, deadline_day, send_hour, timezone, char_limit");

  if (groupsError || !groups) {
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }

  const matchingGroups = groups.filter((group) => {
    const localDay = new Date(
      today.toLocaleString("en-US", { timeZone: group.timezone })
    ).getDay();
    return localDay === group.deadline_day;
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let processed = 0;

  for (const group of matchingGroups) {
    const { data: prompt } = await supabase
      .from("prompts")
      .select("id, content")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!prompt) continue;

    // Idempotency: skip if newsletter already sent for this prompt
    const { data: existing } = await supabase
      .from("newsletters")
      .select("id")
      .eq("prompt_id", prompt.id)
      .maybeSingle();

    if (existing) continue;

    const { data: responses } = await supabase
      .from("responses")
      .select("content, users(name)")
      .eq("prompt_id", prompt.id);

    let content: string;
    if (!responses || responses.length === 0) {
      content = "No responses were submitted this week. Check back next week!";
    } else {
      const formattedResponses = responses
        .map((r) => {
          const user = Array.isArray(r.users) ? r.users[0] : r.users;
          return `${user?.name ?? "Anonymous"}: ${r.content}`;
        })
        .join("\n");
      const systemPrompt = buildNewsletterSystemPrompt([prompt.content], formattedResponses);
      content = await generateText(systemPrompt, "Write the newsletter.");
    }

    const { error: insertError } = await supabase
      .from("newsletters")
      .insert({ prompt_id: prompt.id, content });

    if (insertError) continue;

    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, users(email, name)")
      .eq("group_id", group.id)
      .eq("is_confirmed", true)
      .eq("is_active", true);

    if (!members) continue;

    for (const member of members) {
      const user = Array.isArray(member.users) ? member.users[0] : member.users;
      if (!user) continue;

      const { data: tokenRow } = await supabase
        .from("response_tokens")
        .select("token")
        .eq("user_id", member.user_id)
        .eq("prompt_id", prompt.id)
        .maybeSingle();

      const unsubscribeUrl = tokenRow
        ? `${origin}/unsubscribe?token=${tokenRow.token}`
        : `${origin}/unsubscribe`;

      const html = await render(
        NewsletterEmail({ groupName: group.name, content, unsubscribeUrl })
      );

      await sendEmail({
        to: [{ email: user.email, name: user.name ?? undefined }],
        subject: `${group.name} — this week's newsletter`,
        html,
      });
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
