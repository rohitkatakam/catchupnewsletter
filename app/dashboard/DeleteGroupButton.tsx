"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 mt-1 self-start"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
