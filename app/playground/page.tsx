"use client";

import { useState, useEffect } from "react";

type Tab = "prompt" | "newsletter";

interface Response {
  name: string;
  response: string;
}

function RaunchySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels: Record<number, string> = {
    1: "Clean",
    2: "Casual",
    3: "Cheeky",
    4: "Adult",
    5: "Raunchy",
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        Raunchy level: <span className="font-bold">{value} — {labels[value]}</span>
      </label>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function PlaygroundPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("prompt");

  // Prompt tab state
  const [raunchyPrompt, setRaunchyPrompt] = useState(2);
  const [numQuestions, setNumQuestions] = useState(1);
  const [customInstructionsPrompt, setCustomInstructionsPrompt] = useState("");
  const [pastPrompts, setPastPrompts] = useState("");

  // Newsletter tab state
  const [nlPrompts, setNlPrompts] = useState<string[]>([""]);
  const [raunchyNewsletter, setRaunchyNewsletter] = useState(2);
  const [responses, setResponses] = useState<Response[]>([{ name: "", response: "" }]);
  const [customInstructionsNewsletter, setCustomInstructionsNewsletter] = useState("");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("playground_pw");
    if (stored) setAuthed(true);
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/playground", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-playground-password": password },
      body: JSON.stringify({ type: "prompt", raunchyLevel: 2, numQuestions: 1 }),
    });
    if (res.status === 401) {
      setAuthError("Wrong password.");
      return;
    }
    sessionStorage.setItem("playground_pw", password);
    setAuthed(true);
  }

  async function generate() {
    setLoading(true);
    setError("");
    setOutput("");
    const pw = sessionStorage.getItem("playground_pw") ?? "";
    try {
      let body: Record<string, unknown>;
      if (tab === "prompt") {
        body = { type: "prompt", raunchyLevel: raunchyPrompt, numQuestions, customInstructions: customInstructionsPrompt, pastPrompts };
      } else {
        body = { type: "newsletter", prompts: nlPrompts.filter(Boolean), raunchyLevel: raunchyNewsletter, responses, customInstructions: customInstructionsNewsletter };
      }
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-playground-password": pw },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(`Error ${res.status}`);
        return;
      }
      const data = await res.json();
      setOutput(data.result);
    } catch {
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handlePasswordSubmit} className="bg-white p-8 rounded-lg shadow w-80 space-y-4">
          <h1 className="text-xl font-semibold">Playground</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            autoFocus
          />
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button type="submit" className="w-full bg-black text-white rounded py-2 text-sm font-medium">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Prompt Playground</h1>

      <div className="flex gap-2 border-b pb-2">
        {(["prompt", "newsletter"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setOutput(""); setError(""); }}
            className={`px-4 py-1 rounded-full text-sm font-medium ${tab === t ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {t === "prompt" ? "Question Generation" : "Newsletter Compilation"}
          </button>
        ))}
      </div>

      {tab === "prompt" && (
        <div className="space-y-4">
          <RaunchySlider value={raunchyPrompt} onChange={setRaunchyPrompt} />
          <div>
            <label className="block text-sm font-medium mb-1">Number of questions: {numQuestions}</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Past prompts (one per line, for dedup)</label>
            <textarea
              value={pastPrompts}
              onChange={(e) => setPastPrompts(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm font-mono"
              placeholder="What's a meal that reminds you of college?&#10;If you could live anywhere for a month..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custom instructions</label>
            <textarea
              value={customInstructionsPrompt}
              onChange={(e) => setCustomInstructionsPrompt(e.target.value)}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. focus on travel themes"
            />
          </div>
        </div>
      )}

      {tab === "newsletter" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prompts</label>
            <div className="space-y-2">
              {nlPrompts.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={p}
                    onChange={(e) => {
                      const next = [...nlPrompts];
                      next[i] = e.target.value;
                      setNlPrompts(next);
                    }}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder={`Prompt ${i + 1}`}
                  />
                  {nlPrompts.length > 1 && (
                    <button
                      onClick={() => setNlPrompts(nlPrompts.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500 text-sm px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setNlPrompts([...nlPrompts, ""])}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              + Add prompt
            </button>
          </div>

          <RaunchySlider value={raunchyNewsletter} onChange={setRaunchyNewsletter} />

          <div>
            <label className="block text-sm font-medium mb-1">Responses</label>
            <div className="space-y-2">
              {responses.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={r.name}
                    onChange={(e) => {
                      const next = [...responses];
                      next[i] = { ...next[i], name: e.target.value };
                      setResponses(next);
                    }}
                    className="w-28 border rounded px-3 py-2 text-sm"
                    placeholder="Name"
                  />
                  <textarea
                    value={r.response}
                    onChange={(e) => {
                      const next = [...responses];
                      next[i] = { ...next[i], response: e.target.value };
                      setResponses(next);
                    }}
                    rows={2}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="Their response..."
                  />
                  {responses.length > 1 && (
                    <button
                      onClick={() => setResponses(responses.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500 text-sm px-2 pt-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setResponses([...responses, { name: "", response: "" }])}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              + Add response
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Custom instructions</label>
            <textarea
              value={customInstructionsNewsletter}
              onChange={(e) => setCustomInstructionsNewsletter(e.target.value)}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. lead with the funniest response"
            />
          </div>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate"}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {output && (
        <div>
          <label className="block text-sm font-medium mb-1">Output</label>
          <pre className="whitespace-pre-wrap bg-gray-50 border rounded p-4 text-sm font-mono">{output}</pre>
        </div>
      )}
    </div>
  );
}
