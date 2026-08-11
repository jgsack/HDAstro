import type { TransitItem } from "./transits";
import type { NatalChart } from "./natalChart";
import type { HDChart } from "./humanDesign/chart";

const CACHE_KEY = "ai_daily_reading";

interface CachedReading {
  text: string;
  forDate: string; // YYYY-MM-DD, local
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCached(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedReading = JSON.parse(raw);
    return parsed.forDate === todayKey() ? parsed.text : null;
  } catch {
    return null;
  }
}

function setCached(text: string): void {
  const entry: CachedReading = { text, forDate: todayKey() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

function natalSummaryFor(chart: NatalChart): string {
  const sun = chart.planets.find(p => p.key === "sun");
  const moon = chart.planets.find(p => p.key === "moon");
  return `Sun in ${sun?.signLabel ?? "?"}, Moon in ${moon?.signLabel ?? "?"}, ${chart.ascendantSign} Rising.`;
}

function hdSummaryFor(chart: HDChart): string {
  const channels = chart.definedChannels.map(c => c.name).join(", ") || "no defined channels";
  return `${chart.type}, Profile ${chart.profile}, ${chart.authority} Authority, Strategy: ${chart.strategy}. Defined channels: ${channels}.`;
}

// One real, synthesized reading per calendar day — cached in local storage
// so repeat visits (and the periodic 15-minute refresh elsewhere in the app)
// don't re-trigger a paid API call for the same day. Throws on any failure
// (missing endpoint in local dev, network error, no server-side key
// configured yet) so the caller can fall back to the offline template.
export async function fetchAiReading(
  natalChart: NatalChart, hdChart: HDChart, items: TransitItem[],
): Promise<string> {
  const cached = getCached();
  if (cached) return cached;

  const transits = items
    .filter(i => i.type === "aspect" || i.type === "hd_gate")
    .slice(0, 25)
    .map(i => ({ type: i.type, headline: i.headline, detail: i.detail }));

  const res = await fetch("/api/daily-reading", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      natalSummary: natalSummaryFor(natalChart),
      hdSummary: hdSummaryFor(hdChart),
      transits,
    }),
  });

  if (!res.ok) throw new Error(`AI reading request failed (${res.status})`);

  const data = await res.json();
  if (!data.text) throw new Error("AI reading returned no text.");

  setCached(data.text);
  return data.text;
}
