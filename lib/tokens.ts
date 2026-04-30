import { createSupabaseServiceClient } from "./supabase";

export function generateToken(): string {
  return crypto.randomUUID();
}

export async function validateConfirmToken(
  token: string
): Promise<{ valid: boolean; memberId?: string }> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("group_members")
    .select("id")
    .eq("confirm_token", token)
    .maybeSingle();
  if (!data) return { valid: false };
  return { valid: true, memberId: data.id };
}

export async function validateResponseToken(
  token: string
): Promise<{ valid: boolean; userId?: string; promptId?: string }> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("response_tokens")
    .select("user_id, prompt_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { valid: false };
  if (data.used_at) return { valid: false };
  if (new Date(data.expires_at) < new Date()) return { valid: false };
  return { valid: true, userId: data.user_id, promptId: data.prompt_id };
}
