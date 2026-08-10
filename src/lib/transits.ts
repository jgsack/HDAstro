import { Origin, Horoscope } from "circular-natal-horoscope-js";
import type { NatalChart, PlanetData } from "./natalChart";
import type { HDChart } from "./humanDesign/chart";
import { longitudeToGateLine, GATE_NAMES } from "./humanDesign/gateTable";
import { CHANNELS } from "./humanDesign/centersChannels";

export interface TransitItem {
  id: string;
  type: "aspect" | "hd_gate";
  priority: number;
  headline: string;
  detail: string;
  transitPlanet: string;
  natalPoint?: string;
  aspectKey?: string;
  orb?: number;
  gate?: number;
  isExactToday?: boolean;
}

export const PLANET_DISPLAY: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
  mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
  neptune: "Neptune", pluto: "Pluto", chiron: "Chiron",
  northnode: "North Node", southnode: "South Node", lilith: "Lilith",
  ascendant: "Ascendant", midheaven: "Midheaven",
};

const PLANET_WEIGHT: Record<string, number> = {
  sun: 5, moon: 4, mercury: 3, venus: 3, mars: 3,
  jupiter: 4, saturn: 5, uranus: 5, neptune: 5, pluto: 6,
  chiron: 3, northnode: 3, southnode: 2, lilith: 2,
  ascendant: 5, midheaven: 4,
};

const TARGET_WEIGHT: Record<string, number> = {
  sun: 6, moon: 6, ascendant: 6, midheaven: 5,
  mercury: 4, venus: 4, mars: 4,
  jupiter: 3, saturn: 3, uranus: 2, neptune: 2, pluto: 2,
  chiron: 2, northnode: 3, southnode: 2, lilith: 2,
};

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, opposition: 180, trine: 120,
  square: 90, sextile: 60,
};

const ASPECT_ORB: Record<string, number> = {
  conjunction: 8, opposition: 8, trine: 8, square: 7, sextile: 6,
};

const ASPECT_TENSION: Record<string, number> = {
  conjunction: 1.2, opposition: 1.2, square: 1.1, trine: 1.0, sextile: 0.9,
};

const ASPECT_DESCRIPTIONS: Record<string, string> = {
  conjunction: "merges with",
  opposition: "opposes",
  trine: "trines",
  square: "squares",
  sextile: "sextiles",
};

function angularDiff(a: number, b: number): number {
  let diff = Math.abs(((a - b) + 360) % 360);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function getPlanetLabel(key: string): string {
  return PLANET_DISPLAY[key] ?? key;
}

function getSignAtDeg(deg: number): string {
  const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo",
                  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  return signs[Math.floor(((deg % 360) + 360) % 360 / 30)];
}

function degInSign(deg: number): number {
  return ((deg % 360) + 360) % 360 % 30;
}

function getCurrentPlanets(): Array<{ key: string; ecliptic: number }> {
  const now = new Date();
  const origin = new Origin({
    year: now.getUTCFullYear(), month: now.getUTCMonth(), date: now.getUTCDate(),
    hour: now.getUTCHours(), minute: now.getUTCMinutes(),
    latitude: 0, longitude: 0,
  });
  const horoscope = new Horoscope({
    origin, houseSystem: "placidus", zodiac: "tropical",
    aspectPoints: [], aspectWithPoints: [], aspectTypes: [], language: "en",
  });

  const bodies = horoscope.CelestialBodies;
  const pts = horoscope.CelestialPoints;
  const result: Array<{ key: string; ecliptic: number }> = [];

  for (const k of ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","chiron"]) {
    result.push({ key: k, ecliptic: bodies[k]?.ChartPosition.Ecliptic.DecimalDegrees ?? 0 });
  }
  result.push({ key: "northnode", ecliptic: pts.northnode?.ChartPosition.Ecliptic.DecimalDegrees ?? 0 });

  return result;
}

function getNatalPoints(chart: NatalChart): Array<{ key: string; ecliptic: number }> {
  const pts: Array<{ key: string; ecliptic: number }> = [];
  for (const p of [...chart.planets, ...chart.points]) {
    pts.push({ key: p.key, ecliptic: p.eclipticDeg });
  }
  pts.push({ key: "ascendant", ecliptic: chart.ascendantDeg });
  pts.push({ key: "midheaven", ecliptic: chart.midheavenDeg });
  return pts;
}

export function getTodaysTransits(natalChart: NatalChart, hdChart: HDChart): TransitItem[] {
  const items: TransitItem[] = [];
  const currentPlanets = getCurrentPlanets();
  const natalPoints = getNatalPoints(natalChart);
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  // --- Astrology aspects ---
  for (const transit of currentPlanets) {
    for (const natal of natalPoints) {
      for (const [aspectKey, angle] of Object.entries(ASPECT_ANGLES)) {
        const maxOrb = ASPECT_ORB[aspectKey] ?? 6;
        const diff = angularDiff(transit.ecliptic, natal.ecliptic);
        const orb = Math.abs(diff - angle);
        if (orb > maxOrb) continue;

        // Check if exact today (orb < 1°)
        const isExactToday = orb < 1.0;

        const orbScore = (maxOrb - orb) / maxOrb; // 0-1
        const priority =
          orbScore * 30 +
          (PLANET_WEIGHT[transit.key] ?? 3) * 3 +
          (TARGET_WEIGHT[natal.key] ?? 2) * 3 +
          (ASPECT_TENSION[aspectKey] ?? 1.0) * 4 +
          (isExactToday ? 15 : 0);

        const tLabel = getPlanetLabel(transit.key);
        const nLabel = getPlanetLabel(natal.key);
        const desc = ASPECT_DESCRIPTIONS[aspectKey] ?? aspectKey;
        const sign = getSignAtDeg(transit.ecliptic);
        const retroNote = ""; // transiting retrograde not tracked here (would need isRetrograde from chart)

        items.push({
          id: `${transit.key}-${aspectKey}-natal-${natal.key}`,
          type: "aspect",
          priority,
          headline: `Transiting ${tLabel} ${desc} your natal ${nLabel}`,
          detail: `${tLabel} at ${degInSign(transit.ecliptic).toFixed(1)}° ${sign}${retroNote}. Orb: ${orb.toFixed(2)}°${isExactToday ? " — exact today" : ""}`,
          transitPlanet: transit.key,
          natalPoint: natal.key,
          aspectKey,
          orb,
          isExactToday,
        });
      }
    }
  }

  // --- Human Design gate activations ---
  const natalGates = new Set(hdChart.activations.map(a => a.gate));

  for (const transit of currentPlanets) {
    const { gate, line } = longitudeToGateLine(transit.ecliptic);
    const gateName = GATE_NAMES[gate] ?? `Gate ${gate}`;
    const sign = getSignAtDeg(transit.ecliptic);
    const tLabel = getPlanetLabel(transit.key);

    // Check if this gate completes a channel that isn't already defined
    const completedChannels = CHANNELS.filter(ch => {
      const otherGate = ch.gate1 === gate ? ch.gate2 : ch.gate2 === gate ? ch.gate1 : null;
      if (!otherGate) return false;
      return natalGates.has(otherGate) && !hdChart.definedChannels.find(dc => dc.gate1 === ch.gate1 && dc.gate2 === ch.gate2);
    });

    const hdBonus = completedChannels.length > 0 ? 12 : 0;
    const planetWt = PLANET_WEIGHT[transit.key] ?? 3;
    const natalHit = natalGates.has(gate) ? 6 : 0;
    const priority = planetWt * 2 + hdBonus + natalHit + (gate === hdChart.activations.find(a => a.planet === "sun" && a.isPersonality)?.gate ? 8 : 0);

    let detail = `${tLabel} activating Gate ${gate} line ${line} (${gateName}) at ${degInSign(transit.ecliptic).toFixed(1)}° ${sign}`;
    if (completedChannels.length > 0) {
      detail += `. Temporarily completing channel${completedChannels.length > 1 ? "s" : ""}: ${completedChannels.map(c => c.name).join(", ")}`;
    }
    if (natalGates.has(gate)) {
      detail += ". This is one of your natal gates.";
    }

    items.push({
      id: `hd-${transit.key}-gate${gate}`,
      type: "hd_gate",
      priority,
      headline: `${tLabel} activates Gate ${gate} — ${gateName}`,
      detail,
      transitPlanet: transit.key,
      gate,
      isExactToday: false,
    });
  }

  // Deduplicate (keep highest priority per id) and sort
  const seen = new Map<string, TransitItem>();
  for (const item of items) {
    const existing = seen.get(item.id);
    if (!existing || item.priority > existing.priority) seen.set(item.id, item);
  }

  return [...seen.values()].sort((a, b) => b.priority - a.priority);
}
