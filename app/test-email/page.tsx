"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/test-email");
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Email delivery test</h1>
      <p>Sends all three templates to rohitkatakam@gmail.com.</p>
      <button onClick={send} disabled={loading}>
        {loading ? "Sending..." : "Send test emails"}
      </button>
      {result && (
        <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
