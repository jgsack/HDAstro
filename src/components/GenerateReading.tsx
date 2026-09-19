import { useEffect, useRef, useState } from "react";
import type { DailySynthesisContent } from "../lib/dailySynthesis";
import type { TransitItem } from "../lib/transits";

export interface GeneratedReading {
  reading: DailySynthesisContent;
  date: string;
  generatedAt: string;
}

export default function GenerateReading({ cacheKey, date, asOf, items, strategy, authority, onReading }: {
  cacheKey: string; date: string; asOf: Date; items: TransitItem[];
  strategy: string; authority: string; onReading: (reading: GeneratedReading) => void;
}) {
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
      if (saved?.date === date && saved.reading?.headline && Array.isArray(saved.reading.summary) && Array.isArray(saved.reading.sections)) {
        onReading(saved); setReady(true);
      }
    } catch { /* Storage may be disabled. Generation still works. */ }
    return () => { controller.current?.abort(); };
  }, [cacheKey, date, onReading]);

  async function generate() {
    if (locked.current || ready) return;
    locked.current = true;
    setBusy(true); setError("");
    const request = new AbortController(); controller.current = request;
    const timeout = window.setTimeout(() => request.abort(), 60_000);
    try {
      const response = await fetch("/api/reading", {
        method: "POST", signal: request.signal,
        headers: { "Content-Type": "application/json", "X-Reading-Access-Code": accessCode },
        body: JSON.stringify({ date, asOf: asOf.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          strategy, authority, items: [...items.filter(i => i.type === "aspect").slice(0, 12), ...items.filter(i => i.type === "hd_gate").slice(0, 10)],
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "AI readings are unavailable on this host.");
      if (result?.date !== date || !result.reading?.headline || !Array.isArray(result.reading.sections)) throw new Error("The returned reading was incomplete. Please try again.");
      if (request.signal.aborted) return;
      onReading(result); setReady(true); setAccessCode("");
      try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch { /* Keep the in-memory result. */ }
    } catch (e) {
      if (controller.current === request) setError(e instanceof Error && e.name !== "AbortError" ? e.message : "The reading timed out. Please try again.");
    } finally { window.clearTimeout(timeout); locked.current = false; setBusy(false); }
  }

  return <div style={{ margin: "12px 0 20px", padding: 14, border: "1px solid var(--card-border)", borderRadius: 8 }}>
    {ready ? <p style={{ margin: 0, fontSize: 14 }}>Your AI reading for today is saved in this browser.</p> : <>
      <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: 1.6 }}>Generate a fresh interpretation for this chart. This sends calculated transit details, Strategy and Authority to OpenAI through Vercel. Your birth date and location stay in this browser. Generation uses the site owner’s paid API account.</p>
      <label style={{ display: "block", fontSize: 14 }}>Reading access code
        <input type="password" autoComplete="off" value={accessCode} onChange={e => setAccessCode(e.target.value)} disabled={busy}
          style={{ display: "block", width: "100%", boxSizing: "border-box", margin: "6px 0 10px", padding: 10, fontSize: 16 }} />
      </label>
      <button type="button" disabled={busy || !accessCode.trim()} onClick={generate} style={{ padding: "10px 14px", fontSize: 16 }}>
        {busy ? "Writing your reading…" : "Generate today’s AI reading"}
      </button>
      {busy && <p role="status" style={{ fontSize: 14 }}>This may take up to a minute. Your current reading stays visible.</p>}
      {error && <p role="alert" style={{ fontSize: 14 }}>{error}</p>}
    </>}
  </div>;
}
