"use client";

import { useState } from "react";

interface JoinFormProps {
  groupId: string;
  groupName: string;
}

type Status = "idle" | "loading" | "done" | "already_confirmed" | "error";

export default function JoinForm({ groupId, groupName }: JoinFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, groupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        return;
      }
      if (data.status === "already_confirmed") {
        setStatus("already_confirmed");
      } else {
        setStatus("done");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p>Check your email to confirm your membership in <strong>{groupName}</strong>!</p>;
  }

  if (status === "already_confirmed") {
    return <p>You&apos;re already a confirmed member of <strong>{groupName}</strong>.</p>;
  }

  if (status === "error") {
    return <p>Something went wrong. Please try again.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Join {groupName}</h1>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading"}
        />
      </div>
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Join"}
      </button>
    </form>
  );
}
