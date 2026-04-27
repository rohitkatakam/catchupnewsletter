import { createSupabaseServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("users").select("count").single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
