import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteGroupButton from "./DeleteGroupButton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const service = createSupabaseServiceClient();
  const { data: groups } = await service
    .from("groups")
    .select("id, name, send_day, deadline_day, group_invites(code)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <main className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Your groups</h1>
        <Link
          href="/groups/new"
          className="bg-black text-white rounded px-4 py-2 text-sm"
        >
          Create group
        </Link>
      </div>

      {!groups || groups.length === 0 ? (
        <p className="text-gray-500">No groups yet. Create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group) => {
            const code = Array.isArray(group.group_invites)
              ? group.group_invites[0]?.code
              : (group.group_invites as { code: string } | null)?.code;
            return (
              <li key={group.id} className="border rounded p-4 flex flex-col gap-1">
                <span className="font-medium">{group.name}</span>
                <span className="text-sm text-gray-500">
                  Sends {DAYS[group.send_day]} · Deadline {DAYS[group.deadline_day]}
                </span>
                {code && (
                  <span className="text-sm font-mono text-blue-600 break-all">
                    {origin}/join/{code}
                  </span>
                )}
                <DeleteGroupButton groupId={group.id} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
