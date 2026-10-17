import * as Astronomy from "astronomy-engine";
import { longitudeToGateLine, gateLineBoundaries, GATE_NAMES, type GateLine } from "./humanDesign/gateTable";

export type TransitBody =
  | "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn"
  | "uranus" | "neptune" | "pluto" | "earth" | "northnode" | "southnode";

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Signed angular difference a-b, normalized to (-180, 180]. */
function angDiff(a: number, b: number): number {
  return (((a - b + 180) % 360) + 360) % 360 - 180;
}

const AE_BODY: Partial<Record<TransitBody, Astronomy.Body>> = {
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

// Mean lunar node (Meeus, low-precision formula). Used for northnode/southnode —
// astrology conventionally uses the smoothly-regressing MEAN node, not the
// instantaneous true node, so a closed-form estimate is both standard and exact
// enough for a duration display (it's already an approximation at this level).
function meanNodeLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const omega = 125.0445222 - 1934.1362608 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return norm360(omega);
}

export function eclipticLongitude(body: TransitBody, date: Date): number {
  if (body === "earth") return norm360(eclipticLongitude("sun", date) + 180);
  if (body === "southnode") return norm360(eclipticLongitude("northnode", date) + 180);
  if (body === "northnode") return meanNodeLongitude(date);
  if (body === "sun") return norm360(Astronomy.SunPosition(date).elon);
  if (body === "moon") return norm360(Astronomy.EclipticGeoMoon(date).lon);

  const astroBody = AE_BODY[body];
  if (!astroBody) throw new Error(`Unknown transit body: ${body}`);
  const vec = Astronomy.GeoVector(astroBody, date, true);
  return norm360(Astronomy.Ecliptic(vec).elon);
}

interface SearchConfig { stepHours: number; maxDays: number; }

// Coarse step must stay well under a single HD line's duration for that body
// (so we never skip past a crossing), and maxDays bounds worst-case retrograde
// stalls near a station point.
const SEARCH_CONFIG: Record<Exclude<TransitBody, "northnode" | "southnode">, SearchConfig> = {
  moon:    { stepHours: 0.25, maxDays: 3 },
  sun:     { stepHours: 3,    maxDays: 5 },
  earth:   { stepHours: 3,    maxDays: 5 },
  mercury: { stepHours: 4,    maxDays: 45 },
  venus:   { stepHours: 8,    maxDays: 90 },
  mars:    { stepHours: 12,   maxDays: 120 },
  jupiter: { stepHours: 24,   maxDays: 150 },
  saturn:  { stepHours: 24,   maxDays: 250 },
  uranus:  { stepHours: 48,   maxDays: 500 },
  neptune: { stepHours: 72,   maxDays: 600 },
  pluto:   { stepHours: 72,   maxDays: 700 },
};

/**
 * Find the nearest time (in the given direction from `from`) at which `body`'s
 * ecliptic longitude equals `targetDeg`. Uses a coarse scan to bracket the
 * crossing (robust to retrograde loops near the target) then bisects.
 */
function findCrossing(
  body: TransitBody, targetDeg: number, from: Date, direction: 1 | -1,
): Date | null {
  const cfg = SEARCH_CONFIG[body as Exclude<TransitBody, "northnode" | "southnode">]
    ?? { stepHours: 24, maxDays: 400 };
  const stepMs = cfg.stepHours * 3600 * 1000 * direction;
  const maxSteps = Math.ceil((cfg.maxDays * 24) / cfg.stepHours);

  let prevTime = from.getTime();
  let prevDiff = angDiff(eclipticLongitude(body, new Date(prevTime)), targetDeg);
  if (Math.abs(prevDiff) < 1e-4) return new Date(prevTime);

  for (let i = 1; i <= maxSteps; i++) {
    const curTime = prevTime + stepMs;
    const curDiff = angDiff(eclipticLongitude(body, new Date(curTime)), targetDeg);

    if (Math.sign(curDiff) !== Math.sign(prevDiff)) {
      let lo = prevTime, loDiff = prevDiff;
      let hi = curTime;
      for (let b = 0; b < 25; b++) {
        const mid = (lo + hi) / 2;
        const midDiff = angDiff(eclipticLongitude(body, new Date(mid)), targetDeg);
        if (Math.sign(midDiff) === Math.sign(loDiff)) { lo = mid; loDiff = midDiff; } else { hi = mid; }
      }
      return new Date((lo + hi) / 2);
    }
    prevTime = curTime;
    prevDiff = curDiff;
  }
  return null;
}

export interface TransitDuration {
  body: TransitBody;
  gate: number;
  line: number;
  gateName: string;
  longitude: number;
  entry: Date | null;
  exit: Date | null;
  totalMs: number | null;
  remainingMs: number | null;
  elapsedMs: number | null;
  /** 0-1 fraction of the way through this line, or null if unknown. */
  progress: number | null;
}

function nodeLinearCrossings(lineStart: number, lineEnd: number, currentDeg: number, now: Date) {
  // Mean node motion is smooth and (for our purposes) constant-rate, so we can
  // solve entry/exit algebraically instead of searching.
  const dayMs = 86400000;
  const rate = angDiff(meanNodeLongitude(new Date(now.getTime() + dayMs)), meanNodeLongitude(now)); // deg/day, signed
  if (Math.abs(rate) < 1e-9) return { entry: null, exit: null };

  if (rate > 0) {
    // Use circular distances so Gate 25's lines remain correct when their
    // boundaries straddle 360°/0°.
    const daysSinceEntry = norm360(currentDeg - lineStart) / rate;
    const daysUntilExit = norm360(lineEnd - currentDeg) / rate;
    return {
      entry: new Date(now.getTime() - daysSinceEntry * dayMs),
      exit: new Date(now.getTime() + daysUntilExit * dayMs),
    };
  } else {
    const rateAbs = -rate;
    const daysSinceEntry = norm360(lineEnd - currentDeg) / rateAbs;
    const daysUntilExit = norm360(currentDeg - lineStart) / rateAbs;
    return {
      entry: new Date(now.getTime() - daysSinceEntry * dayMs),
      exit: new Date(now.getTime() + daysUntilExit * dayMs),
    };
  }
}

export function computeTransitDuration(body: TransitBody, now: Date = new Date()): TransitDuration {
  const longitude = eclipticLongitude(body, now);
  const { gate, line }: GateLine = longitudeToGateLine(longitude);
  const { lineStart, lineEnd } = gateLineBoundaries(gate, line);

  let entry: Date | null;
  let exit: Date | null;

  if (body === "northnode" || body === "southnode") {
    // South node mirrors the north node's motion exactly (same rate, opposite point),
    // so solving against its own current line bounds works directly for both.
    const direct = nodeLinearCrossings(lineStart, lineEnd, longitude, now);
    entry = direct.entry;
    exit = direct.exit;
  } else {
    const backStart = findCrossing(body, lineStart, now, -1);
    const backEnd = findCrossing(body, lineEnd, now, -1);
    const fwdStart = findCrossing(body, lineStart, now, 1);
    const fwdEnd = findCrossing(body, lineEnd, now, 1);

    // Entry = the more recent of the two backward crossings; exit = the sooner of the two forward crossings.
    entry = [backStart, backEnd].filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    exit = [fwdStart, fwdEnd].filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  }

  const totalMs = entry && exit ? exit.getTime() - entry.getTime() : null;
  const remainingMs = exit ? exit.getTime() - now.getTime() : null;
  const elapsedMs = entry ? now.getTime() - entry.getTime() : null;
  const progress = totalMs && elapsedMs !== null ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : null;

  return {
    body, gate, line, gateName: GATE_NAMES[gate] ?? "",
    longitude, entry, exit, totalMs, remainingMs, elapsedMs, progress,
  };
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const minutes = abs / 60000;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 30.44;
  const years = days / 365.25;

  if (years >= 1) return `${years.toFixed(1)}y`;
  if (months >= 1) return `${months.toFixed(1)}mo`;
  if (weeks >= 1) return `${weeks.toFixed(1)}w`;
  if (days >= 1) return `${days.toFixed(1)}d`;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${Math.round(minutes)}m`;
}
