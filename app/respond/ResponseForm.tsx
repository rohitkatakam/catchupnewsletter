"use client";

import { useState } from "react";

interface ResponseFormProps {
  token: string;
  prompt: string;
  groupName: string;
  charLimit: number;
  existing: string;
}

export default function ResponseForm({ token, prompt, groupName, charLimit, existing }: ResponseFormProps) {
  const [content, setContent] = useState(existing);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overLimit = content.length > charLimit;
  const isEmpty = content.trim().length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, content }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <p style={{ color: "#888", marginBottom: "4px" }}>{groupName}</p>
      <p style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "24px" }}>{prompt}</p>

      {submitted ? (
        <p>Response submitted! You can update it until the deadline.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }}
            placeholder="Write your response here…"
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{ color: overLimit ? "red" : "#888", fontSize: "0.875rem" }}>
              {content.length} / {charLimit}
            </span>
            <button type="submit" disabled={isEmpty || overLimit || submitting}>
              {submitting ? "Submitting…" : existing ? "Update response" : "Submit"}
            </button>
          </div>
          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
