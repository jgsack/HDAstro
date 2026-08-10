import { Origin, Horoscope } from "circular-natal-horoscope-js";
import type { BirthData } from "../../config/birthData";
import { longitudeToGateLine, GATE_NAMES } from "./gateTable";
import {
  CHANNELS, AUTHORITY_HIERARCHY,
  type CenterName, type HDType,
} from "./centersChannels";

const PLANET_KEYS_HD = [
  "sun", "earth", "moon", "northnode", "southnode",
  "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto",
];

export interface HDActivation {
  planet: string;
  gate: number;
  line: number;
  gateName: string;
  isPersonality: boolean; // true = birth moment; false = design moment (~88° earlier)
}

export interface HDChart {
  type: HDType;
  authority: string;
  profile: string; // e.g. "3/5"
  strategy: string;
  definedCenters: CenterName[];
  definedChannels: Array<{ gate1: number; gate2: number; name: string }>;
  activations: HDActivation[];
}

// Get planet ecliptic longitudes from circular-natal-horoscope-js at a given moment.
// "earth" is exactly opposite the Sun (Sun + 180°).
function getPlanetLongitudes(
  year: number, month: number, date: number,
  hour: number, minute: number,
  lat: number, lon: number,
): Record<string, number> {
  const origin = new Origin({ year, month, date, hour, minute, latitude: lat, longitude: lon });
  const horoscope = new Horoscope({
    origin, houseSystem: "placidus", zodiac: "tropical",
    aspectPoints: [], aspectWithPoints: [], aspectTypes: [],
    language: "en",
  });

  const result: Record<string, number> = {};
  const bodies = horoscope.CelestialBodies;
  const pts = horoscope.CelestialPoints;

  for (const k of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
    result[k] = bodies[k]?.ChartPosition.Ecliptic.DecimalDegrees ?? 0;
  }
  result["northnode"] = pts.northnode?.ChartPosition.Ecliptic.DecimalDegrees ?? 0;
  result["southnode"] = pts.southnode?.ChartPosition.Ecliptic.DecimalDegrees ?? 0;
  // Earth is directly opposite the Sun
  result["earth"] = (result["sun"] + 180) % 360;

  return result;
}

// Find the Design moment: the date/time when the Sun was exactly 88° of solar arc
// before the birth Sun position. Each degree of solar arc ≈ 1 day, so ~88 days back.
// We iterate with decreasing step size to find the exact moment.
function findDesignMoment(
  birthYear: number, birthMonth: number, birthDate: number,
  birthHour: number, birthMinute: number,
  birthLat: number, birthLon: number,
  birthSunLon: number,
): { year: number; month: number; date: number; hour: number; minute: number } {
  const targetSunLon = ((birthSunLon - 88) + 360) % 360;

  // Start searching ~95 days before birth to give margin
  const birthMs = Date.UTC(birthYear, birthMonth, birthDate, birthHour, birthMinute);
  const startMs = birthMs - 95 * 24 * 60 * 60 * 1000;

  // Binary search: find t in [startMs, birthMs] where sun longitude at t = targetSunLon
  let lo = startMs;
  let hi = birthMs;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const d = new Date(mid);
    const lons = getPlanetLongitudes(
      d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
      d.getUTCHours(), d.getUTCMinutes(),
      birthLat, birthLon,
    );
    const sunLon = lons["sun"];

    // Angular difference from targetSunLon to sunLon (positive = sun is ahead)
    let diff = ((sunLon - targetSunLon) + 360) % 360;
    if (diff > 180) diff -= 360;

    if (Math.abs(diff) < 0.001) break;
    if (diff > 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const result = new Date((lo + hi) / 2);
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth(),
    date: result.getUTCDate(),
    hour: result.getUTCHours(),
    minute: result.getUTCMinutes(),
  };
}

function getActivations(lons: Record<string, number>, isPersonality: boolean): HDActivation[] {
  return PLANET_KEYS_HD.map(planet => {
    const lon = lons[planet] ?? 0;
    const { gate, line } = longitudeToGateLine(lon);
    return {
      planet,
      gate,
      line,
      gateName: GATE_NAMES[gate] ?? "",
      isPersonality,
    };
  });
}

function deriveChart(allActivations: HDActivation[]): Omit<HDChart, "activations"> {
  // Collect all activated gates
  const activeGates = new Set(allActivations.map(a => a.gate));

  // Find defined channels: both gates activated
  const definedChannels = CHANNELS.filter(
    ch => activeGates.has(ch.gate1) && activeGates.has(ch.gate2),
  ).map(ch => ({ gate1: ch.gate1, gate2: ch.gate2, name: ch.name }));

  // Find defined centers: any channel endpoint is activated on both sides
  const definedCenterSet = new Set<CenterName>();
  for (const ch of definedChannels) {
    const channelDef = CHANNELS.find(c => c.gate1 === ch.gate1 && c.gate2 === ch.gate2);
    if (channelDef) {
      definedCenterSet.add(channelDef.center1);
      definedCenterSet.add(channelDef.center2);
    }
  }
  const definedCenters = [...definedCenterSet];

  // Determine type
  const hasSacral = definedCenters.includes("sacral");
  const throatDefined = definedCenters.includes("throat");

  // Check if any motor connects to throat
  const motorToThroatChannel = definedChannels.find(dch => {
    const chDef = CHANNELS.find(c => c.gate1 === dch.gate1 && c.gate2 === dch.gate2);
    if (!chDef) return false;
    const isThroadEnd = chDef.center1 === "throat" || chDef.center2 === "throat";
    const motorEnd = chDef.center1 === "heart" || chDef.center1 === "sacral" || chDef.center1 === "solar_plexus" || chDef.center1 === "root"
      || chDef.center2 === "heart" || chDef.center2 === "sacral" || chDef.center2 === "solar_plexus" || chDef.center2 === "root";
    return isThroadEnd && motorEnd;
  });
  const hasMotorToThroat = !!motorToThroatChannel;

  let type: HDType;
  if (definedCenters.length === 0) {
    type = "Reflector";
  } else if (hasSacral && throatDefined && hasMotorToThroat) {
    type = "Manifesting Generator";
  } else if (hasSacral) {
    type = "Generator";
  } else if (hasMotorToThroat) {
    type = "Manifestor";
  } else {
    type = "Projector";
  }

  // Authority
  let authority = "Mental";
  if (type === "Reflector") {
    authority = "Lunar";
  } else {
    for (const { center, authority: auth } of AUTHORITY_HIERARCHY) {
      if (definedCenters.includes(center)) {
        authority = auth;
        break;
      }
    }
  }

  // Strategy
  const STRATEGIES: Record<HDType, string> = {
    "Generator": "To Respond",
    "Manifesting Generator": "To Respond (then inform)",
    "Projector": "Wait for the Invitation",
    "Manifestor": "Inform before acting",
    "Reflector": "Wait a Lunar Cycle",
  };

  // Profile = personality Sun line / design Sun line
  const personalitySun = allActivations.find(a => a.isPersonality && a.planet === "sun");
  const designSun = allActivations.find(a => !a.isPersonality && a.planet === "sun");
  const profile = `${personalitySun?.line ?? "?"}/${designSun?.line ?? "?"}`;

  return {
    type,
    authority,
    profile,
    strategy: STRATEGIES[type],
    definedCenters,
    definedChannels,
  };
}

export function buildHumanDesignChart(birthData: BirthData): HDChart {
  const { year, month, date, hour, minute, latitude, longitude } = birthData;

  // Personality (birth moment)
  const personalityLons = getPlanetLongitudes(year, month, date, hour, minute, latitude, longitude);
  const birthSunLon = personalityLons["sun"];

  // Design moment
  const designMoment = findDesignMoment(year, month, date, hour, minute, latitude, longitude, birthSunLon);
  const designLons = getPlanetLongitudes(
    designMoment.year, designMoment.month, designMoment.date,
    designMoment.hour, designMoment.minute,
    latitude, longitude,
  );

  const personalityActivations = getActivations(personalityLons, true);
  const designActivations = getActivations(designLons, false);
  const allActivations = [...personalityActivations, ...designActivations];

  const chartProps = deriveChart(allActivations);

  return {
    ...chartProps,
    activations: allActivations,
  };
}
