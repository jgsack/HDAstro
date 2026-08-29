import type { BirthData } from "../config/birthData";
import type { TransitItem } from "./transits";

export interface DailySynthesisContent {
  headline: string;
  summary: string[];
  focus: string;
}

export function birthDataFingerprint(data: BirthData): string {
  const value = [
    data.year, data.month, data.date, data.hour, data.minute,
    data.latitude.toFixed(4), data.longitude.toFixed(4),
  ].join("|");
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Build a deterministic reading from the same live, ranked transit list shown
 * below it. This keeps the Today tab useful when the optional cloud-authored
 * synthesis has not arrived, without presenting yesterday's reading as current.
 */
export function buildLiveSynthesis(
  items: TransitItem[], strategy: string, authority: string,
): DailySynthesisContent {
  const astrology = items.filter(item => item.type === "aspect").slice(0, 2);
  const humanDesign = items.filter(item => item.type === "hd_gate").slice(0, 2);
  const lead = astrology[0];

  const headline = lead?.isExactToday
    ? "Let today’s exact transit set the pace"
    : lead?.phase === "applying"
      ? "Give today’s strongest influence room to develop"
      : "Meet today’s strongest pattern with steady attention";

  const astrologySummary = astrology.length > 0
    ? astrology.map(item => `${sentence(item.headline)} ${sentence(item.detail)}`).join(" ")
    : "No major natal aspects are currently within the app’s displayed orbs.";

  const humanDesignSummary = humanDesign.length > 0
    ? `${humanDesign.map(item => `${sentence(item.headline)} ${sentence(item.detail)}`).join(" ")} ` +
      `Use your ${authority} Authority and your strategy—${strategy}—to decide what deserves your energy.`
    : `No notable gate activations are currently ranked. Use your ${authority} Authority and your strategy—${strategy}—as the day’s anchor.`;

  return {
    headline,
    summary: [astrologySummary, humanDesignSummary],
    focus: `${strategy}; let ${authority} clarity settle before acting on the strongest signal.`,
  };
}
