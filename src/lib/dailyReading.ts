import type { TransitItem } from "./transits";
import { getPlanetLabel } from "./transits";

const PLANET_THEME: Record<string, string> = {
  sun: "identity and vitality",
  moon: "emotions and instincts",
  mercury: "communication and thinking",
  venus: "love, values, and pleasure",
  mars: "drive, assertion, and desire",
  jupiter: "growth, luck, and expansion",
  saturn: "structure, responsibility, and limits",
  uranus: "sudden change and insight",
  neptune: "dreams, intuition, and dissolution",
  pluto: "transformation and power",
  chiron: "old wounds and healing",
  northnode: "your growth edge",
  southnode: "familiar patterns and release",
  lilith: "raw instinct and untamed truth",
  ascendant: "your outward self and first impressions",
  midheaven: "your public path and ambitions",
};

const ASPECT_FLAVOR: Record<string, string> = {
  conjunction: "merges with",
  opposition: "faces off against",
  square: "grinds against",
  trine: "flows easily with",
  sextile: "opens a quiet door with",
};

const ASPECT_TIP: Record<string, string> = {
  conjunction: "A good day to focus and initiate — these energies are combining into one strong signal.",
  opposition: "Look for balance between two competing needs today rather than picking a side.",
  square: "Expect some friction; it's productive if it pushes you to act instead of avoiding it.",
  trine: "Energy moves with little resistance today — a good day to lean into what already works.",
  sextile: "A modest, easy opportunity — worth taking if you notice it.",
};

const ASPECT_MOOD: Record<string, string> = {
  conjunction: "convergence and focus",
  opposition: "balance and tension",
  square: "friction and growth",
  trine: "ease and flow",
  sextile: "quiet opportunity",
};

const ASPECT_COLOR: Record<string, string> = {
  conjunction: "#f59e0b",
  opposition: "#ef4444",
  square: "#f97316",
  trine: "#3b82f6",
  sextile: "#22c55e",
};

function theme(key: string): string {
  return PLANET_THEME[key] ?? key;
}

export interface ReadingHighlight {
  key: string;
  color: string;
  text: string;
  tip: string;
}

export interface DailyReading {
  headline: string;
  overview: string;
  highlights: ReadingHighlight[];
  hdParagraph?: string;
}

export function buildDailyReading(items: TransitItem[]): DailyReading {
  const astro = items.filter(i => i.type === "aspect" && i.aspectKey && i.natalPoint);
  const hd = items.filter(i => i.type === "hd_gate");
  const top = astro.slice(0, 4);
  const lead = top[0];

  const headline = lead
    ? `A day of ${ASPECT_MOOD[lead.aspectKey!] ?? "shifting energy"}`
    : "A quiet day, astrologically";

  const exactCount = astro.filter(a => a.isExactToday).length;
  const overview = lead
    ? `Transiting ${getPlanetLabel(lead.transitPlanet)} is the loudest voice today, ${ASPECT_FLAVOR[lead.aspectKey!] ?? lead.aspectKey} your natal ${getPlanetLabel(lead.natalPoint!)}${lead.isExactToday ? " — exact today, so its effect is at its peak" : ""}.` +
      (exactCount > 1 ? ` ${exactCount} aspects are exact today, making this a notably active one.` : "")
    : "No major transits are active against your chart today — a good day to rest and consolidate.";

  const highlights: ReadingHighlight[] = top.map(item => ({
    key: item.id,
    color: ASPECT_COLOR[item.aspectKey!] ?? "#64748b",
    text: `Transiting ${getPlanetLabel(item.transitPlanet)} (${theme(item.transitPlanet)}) ${ASPECT_FLAVOR[item.aspectKey!] ?? item.aspectKey} your natal ${getPlanetLabel(item.natalPoint!)} (${theme(item.natalPoint!)}).`,
    tip: ASPECT_TIP[item.aspectKey!] ?? "",
  }));

  const hdTop = hd[0];
  const hdParagraph = hdTop ? hdTop.detail.charAt(0).toUpperCase() + hdTop.detail.slice(1) : undefined;

  return { headline, overview, highlights, hdParagraph };
}
