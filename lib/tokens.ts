import { createSupabaseServiceClient } from "./supabase";

export function generateToken(): string {
  return crypto.randomUUID();
}

export async function validateConfirmToken(
  token: string
): Promise<{ valid: boolean; memberId?: string; isConfirmed?: boolean }> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("group_members")
    .select("id, is_confirmed")
    .eq("confirm_token", token)
    .single();
  if (!data) return { valid: false };
  return { valid: true, memberId: data.id, isConfirmed: data.is_confirmed };
}

export async function validateResponseToken(
  token: string
): Promise<{ valid: boolean; expired?: boolean; userId?: string; promptId?: string }> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("response_tokens")
    .select("user_id, prompt_id, expires_at")
    .eq("token", token)
    .single();
  if (!data) return { valid: false };
  if (new Date(data.expires_at) < new Date()) return { valid: false, expired: true };
  return { valid: true, userId: data.user_id, promptId: data.prompt_id };
}
