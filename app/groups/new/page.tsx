"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const raunchyRaw = form.get("raunchy_level") as string;
    const body = {
      name: form.get("name"),
      send_day: Number(form.get("send_day")),
      deadline_day: Number(form.get("deadline_day")),
      send_hour: Number(form.get("send_hour")),
      timezone: form.get("timezone"),
      char_limit: Number(form.get("char_limit")),
      raunchy_level: raunchyRaw === "" ? null : Number(raunchyRaw),
      num_questions: Number(form.get("num_questions")),
      custom_instructions: form.get("custom_instructions") || null,
      allow_free_response: form.get("allow_free_response") === "on",
    };
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.status === 201) {
      router.push("/dashboard");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Create a group</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Group name
          <input name="name" required className="border rounded px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Send day
          <select name="send_day" required className="border rounded px-3 py-2">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Deadline day
          <select name="deadline_day" required className="border rounded px-3 py-2">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Send hour (UTC)
          <select name="send_hour" required className="border rounded px-3 py-2">
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i}:00 UTC</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Timezone
          <input
            name="timezone"
            required
            placeholder="America/New_York"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Character limit
          <input
            name="char_limit"
            type="number"
            required
            defaultValue={500}
            min={50}
            max={5000}
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Raunchy level
          <select name="raunchy_level" className="border rounded px-3 py-2">
            <option value="">Random (pick each week)</option>
            <option value="1">1 — Wholesome</option>
            <option value="2">2 — Casual (default)</option>
            <option value="3">3 — Playful &amp; cheeky</option>
            <option value="4">4 — Adult humor</option>
            <option value="5">5 — Full raunchy</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Number of questions per week
          <input
            name="num_questions"
            type="number"
            required
            defaultValue={1}
            min={1}
            max={5}
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Custom instructions for AI (optional)
          <textarea
            name="custom_instructions"
            placeholder="e.g. Always ask about sports, keep it short"
            className="border rounded px-3 py-2"
            rows={3}
          />
        </label>

        <label className="flex flex-row items-center gap-2 text-sm">
          <input name="allow_free_response" type="checkbox" />
          Allow members to add a free-form update each week
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-3 py-2 text-sm disabled:opacity-50 mt-2"
        >
          {loading ? "Creating…" : "Create group"}
        </button>
      </form>
    </main>
  );
}
