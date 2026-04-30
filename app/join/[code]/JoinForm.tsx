"use client";

import { useState } from "react";

interface JoinFormProps {
  groupId: string;
  groupName: string;
}

export default function JoinForm({ groupId, groupName }: JoinFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      groupId,
    };
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <div className="py-4">
        <h2 className="text-xl font-semibold mb-2">Check your email!</h2>
        <p className="text-gray-500">We sent a confirmation link to your email address.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input name="name" required className="border rounded px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input name="email" type="email" required className="border rounded px-3 py-2" />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white rounded px-3 py-2 text-sm disabled:opacity-50 mt-2"
      >
        {loading ? "Joining…" : `Join ${groupName}`}
      </button>
    </form>
  );
}
