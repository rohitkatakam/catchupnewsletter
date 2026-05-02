import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { generateText } from "@/lib/openrouter";
import { PROMPT_SYSTEM_PROMPT } from "@/lib/prompts";
import { sendEmail } from "@/lib/brevo";
import PromptEmail from "@/emails/PromptEmail";
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
    return localDay === group.send_day;
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let processed = 0;

  for (const group of matchingGroups) {
    // Compute today's date string in the group's timezone
    const localDateStr = new Date(
      today.toLocaleString("en-US", { timeZone: group.timezone })
    )
      .toISOString()
      .slice(0, 10);

    // Idempotency: skip if prompt already exists for this week
    const { data: existing } = await supabase
      .from("prompts")
      .select("id")
      .eq("group_id", group.id)
      .eq("week_of", localDateStr)
      .maybeSingle();

    if (existing) continue;

    // Fetch last 12 prompts for dedup context
    const { data: recentPrompts } = await supabase
      .from("prompts")
      .select("content")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(12);

    const recentList = recentPrompts?.map((p) => p.content).join("\n") ?? "none";
    const systemPrompt = PROMPT_SYSTEM_PROMPT.replace("{recentPrompts}", recentList);

    const promptText = await generateText(systemPrompt, "Generate a new prompt.");

    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .insert({ group_id: group.id, content: promptText, week_of: localDateStr })
      .select("id")
      .single();

    if (promptError || !prompt) continue;

    // Compute expires_at: end of deadline_day in group's timezone
    const localNow = new Date(today.toLocaleString("en-US", { timeZone: group.timezone }));
    const todayIndex = localNow.getDay();
    const daysUntil = ((group.deadline_day - todayIndex + 7) % 7) || 7;
    const deadlineLocal = new Date(localNow);
    deadlineLocal.setDate(deadlineLocal.getDate() + daysUntil);
    deadlineLocal.setHours(23, 59, 59, 999);
    // Convert back to UTC for storage
    const expiresAt = new Date(
      deadlineLocal.toLocaleString("en-US", { timeZone: "UTC" })
    );

    // Fetch active confirmed members
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, users(email, name)")
      .eq("group_id", group.id)
      .eq("is_confirmed", true)
      .eq("is_active", true);

    if (!members) continue;

    for (const member of members) {
      const token = crypto.randomUUID();
      await supabase.from("response_tokens").insert({
        user_id: member.user_id,
        prompt_id: prompt.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      const user = Array.isArray(member.users) ? member.users[0] : member.users;
      if (!user) continue;

      const respondUrl = `${origin}/respond?token=${token}`;
      const unsubscribeUrl = `${origin}/unsubscribe?token=${token}`;

      const html = await render(
        PromptEmail({ prompt: promptText, groupName: group.name, respondUrl, unsubscribeUrl })
      );

      await sendEmail({
        to: [{ email: user.email, name: user.name ?? undefined }],
        subject: `${group.name} — this week's prompt`,
        html,
      });
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
