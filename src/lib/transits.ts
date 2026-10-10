import type { NatalChart } from "./natalChart";
import type { HDChart } from "./humanDesign/chart";
import { longitudeToGateLine, GATE_NAMES } from "./humanDesign/gateTable";
import { CHANNELS } from "./humanDesign/centersChannels";
import { eclipticLongitude, type TransitBody } from "./transitDuration";

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
  phase?: "applying" | "separating" | "stationary";
}

export const PLANET_DISPLAY: Record<string, string> = {
  sun: "Sun", earth: "Earth", moon: "Moon", mercury: "Mercury", venus: "Venus",
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

function signedAngularDiff(a: number, b: number): number {
  return (((a - b + 180) % 360) + 360) % 360 - 180;
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

const ASTRO_TRANSIT_BODIES: TransitBody[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "northnode", "southnode",
];

const HD_TRANSIT_BODIES: TransitBody[] = [
  "sun", "earth", "moon", "northnode", "southnode", "mercury", "venus",
  "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
];

function getCurrentPlanets(keys: TransitBody[], now: Date) {
  return keys.map(key => ({ key, ecliptic: eclipticLongitude(key, now) }));
}

function aspectOrb(transitDeg: number, natalDeg: number, angle: number): number {
  return Math.abs(angularDiff(transitDeg, natalDeg) - angle);
}

interface EphemerisPoint {
  time: number;
  longitude: number;
}

function aspectPhase(currentDeg: number, laterDeg: number, natalDeg: number, angle: number): TransitItem["phase"] {
  const currentOrb = aspectOrb(currentDeg, natalDeg, angle);
  const laterOrb = aspectOrb(laterDeg, natalDeg, angle);
  if (laterOrb < currentOrb - 0.001) return "applying";
  if (laterOrb > currentOrb + 0.001) return "separating";
  return "stationary";
}

function buildDailyEphemeris(keys: TransitBody[], now: Date): Map<TransitBody, EphemerisPoint[]> {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const result = new Map<TransitBody, EphemerisPoint[]>();
  for (const body of keys) {
    const points: EphemerisPoint[] = [];
    for (let time = start.getTime(); time <= end.getTime(); time += 60 * 60_000) {
      points.push({ time, longitude: eclipticLongitude(body, new Date(time)) });
    }
    result.set(body, points);
  }
  return result;
}

/** Find whether this body crosses either exact aspect longitude during the user's local day. */
function exactAspectTimeToday(
  body: TransitBody, natalDeg: number, angle: number, samples: EphemerisPoint[],
): Date | null {
  if (samples.length < 2) return null;
  const targets = angle === 0 || angle === 180
    ? [((natalDeg + angle) % 360 + 360) % 360]
    : [natalDeg + angle, natalDeg - angle].map(d => ((d % 360) + 360) % 360);

  for (const target of targets) {
    let previousTime = samples[0].time;
    let previousDiff = signedAngularDiff(samples[0].longitude, target);
    if (Math.abs(previousDiff) < 1e-7) return new Date(previousTime);

    for (const sample of samples.slice(1)) {
      const { time } = sample;
      const currentDiff = signedAngularDiff(sample.longitude, target);
      // Ignore the artificial sign flip at the point opposite the target.
      if (Math.sign(previousDiff) !== Math.sign(currentDiff) && Math.abs(currentDiff - previousDiff) < 180) {
        let lo = previousTime;
        let hi = time;
        let loDiff = previousDiff;
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          const midDiff = signedAngularDiff(eclipticLongitude(body, new Date(mid)), target);
          if (Math.sign(midDiff) === Math.sign(loDiff)) {
            lo = mid;
            loDiff = midDiff;
          } else {
            hi = mid;
          }
        }
        return new Date((lo + hi) / 2);
      }
      previousTime = time;
      previousDiff = currentDiff;
    }
  }
  return null;
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

export function getTodaysTransits(
  natalChart: NatalChart, hdChart: HDChart, now: Date = new Date(),
): TransitItem[] {
  const items: TransitItem[] = [];
  const currentPlanets = getCurrentPlanets(ASTRO_TRANSIT_BODIES, now);
  const currentHDPlanets = getCurrentPlanets(HD_TRANSIT_BODIES, now);
  const oneHourLater = new Date(now.getTime() + 60 * 60_000);
  const laterLongitudes = new Map(
    ASTRO_TRANSIT_BODIES.map(body => [body, eclipticLongitude(body, oneHourLater)]),
  );
  const dailyEphemeris = buildDailyEphemeris(ASTRO_TRANSIT_BODIES, now);
  const natalPoints = getNatalPoints(natalChart);

  // --- Astrology aspects ---
  for (const transit of currentPlanets) {
    for (const natal of natalPoints) {
      for (const [aspectKey, angle] of Object.entries(ASPECT_ANGLES)) {
        const maxOrb = ASPECT_ORB[aspectKey] ?? 6;
        const diff = angularDiff(transit.ecliptic, natal.ecliptic);
        const orb = Math.abs(diff - angle);
        if (orb > maxOrb) continue;

        const exactTime = exactAspectTimeToday(
          transit.key, natal.ecliptic, angle, dailyEphemeris.get(transit.key) ?? [],
        );
        const isExactToday = exactTime !== null;
        const phase = aspectPhase(
          transit.ecliptic, laterLongitudes.get(transit.key) ?? transit.ecliptic,
          natal.ecliptic, angle,
        );

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
        const exactNote = exactTime
          ? ` — exact ${exactTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : "";

        items.push({
          id: `${transit.key}-${aspectKey}-natal-${natal.key}`,
          type: "aspect",
          priority,
          headline: `Transiting ${tLabel} ${desc} your natal ${nLabel}`,
          detail: `${tLabel} at ${degInSign(transit.ecliptic).toFixed(1)}° ${sign}. Orb: ${orb.toFixed(2)}° · ${phase}${exactNote}`,
          transitPlanet: transit.key,
          natalPoint: natal.key,
          aspectKey,
          orb,
          isExactToday,
          phase,
        });
      }
    }
  }

  // --- Human Design gate activations ---
  const natalGates = new Set(hdChart.activations.map(a => a.gate));

  for (const transit of currentHDPlanets) {
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
