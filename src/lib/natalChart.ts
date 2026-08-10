import { Origin, Horoscope } from "circular-natal-horoscope-js";
import type { BirthData } from "../config/birthData";

export interface PlanetData {
  key: string;
  label: string;
  eclipticDeg: number; // 0-360 absolute ecliptic longitude
  horizonDeg: number;  // 0-360 angle from Ascendant (for wheel rendering)
  signKey: string;
  signLabel: string;
  houseId: number;
  isRetrograde: boolean;
}

export interface HouseData {
  id: number;
  startEcliptic: number;
  endEcliptic: number;
  startHorizon: number;
}

export interface AspectData {
  point1Key: string;
  point1Label: string;
  point2Key: string;
  point2Label: string;
  aspectKey: string;
  aspectLabel: string;
  aspectLevel: string;
  orb: number;
}

export interface NatalChart {
  ascendantDeg: number;
  midheavenDeg: number;
  ascendantSign: string;
  planets: PlanetData[];
  points: PlanetData[];
  houses: HouseData[];
  aspects: AspectData[];
}

// The library's own ChartPosition.Horizon.DecimalDegrees runs in the opposite
// rotational direction from ecliptic longitude, which conflicts with the sign-ring
// angle computed in NatalWheel.tsx. We compute our own "wheel angle" consistently:
// degrees forward (in zodiac order) from the Ascendant, used for every ring alike.
function wheelAngle(eclipticDeg: number, ascendantDeg: number): number {
  return ((eclipticDeg - ascendantDeg) + 360) % 360;
}

function extractPlanetData(bodyOrPoint: any, ascendantDeg: number): PlanetData {
  return {
    key: bodyOrPoint.key,
    label: bodyOrPoint.label,
    eclipticDeg: bodyOrPoint.ChartPosition.Ecliptic.DecimalDegrees,
    horizonDeg: wheelAngle(bodyOrPoint.ChartPosition.Ecliptic.DecimalDegrees, ascendantDeg),
    signKey: bodyOrPoint.Sign?.key ?? "",
    signLabel: bodyOrPoint.Sign?.label ?? "",
    houseId: bodyOrPoint.House?.id ?? 0,
    isRetrograde: bodyOrPoint.isRetrograde ?? false,
  };
}

export function buildChart(data: BirthData): NatalChart {
  const origin = new Origin({
    year: data.year,
    month: data.month,
    date: data.date,
    hour: data.hour,
    minute: data.minute,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "whole-sign",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    language: "en",
  });

  const bodies = horoscope.CelestialBodies;
  const pts = horoscope.CelestialPoints;
  const ascendantDeg: number = horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;

  const PLANET_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron"];
  const POINT_KEYS = ["northnode", "southnode", "lilith"];

  const planets = PLANET_KEYS.map(k => extractPlanetData(bodies[k], ascendantDeg)).filter(Boolean);
  const points = POINT_KEYS.map(k => extractPlanetData(pts[k], ascendantDeg)).filter(Boolean);

  const houses: HouseData[] = horoscope.Houses.map((h: any) => ({
    id: h.id,
    startEcliptic: h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees,
    endEcliptic: h.ChartPosition.EndPosition.Ecliptic.DecimalDegrees,
    startHorizon: wheelAngle(h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees, ascendantDeg),
  }));

  const aspects: AspectData[] = (horoscope.Aspects.all as any[]).map(a => ({
    point1Key: a.point1Key,
    point1Label: a.point1Label,
    point2Key: a.point2Key,
    point2Label: a.point2Label,
    aspectKey: a.aspectKey,
    aspectLabel: a.label,
    aspectLevel: a.aspectLevel,
    orb: a.orb,
  }));

  return {
    ascendantDeg: horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
    midheavenDeg: horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
    ascendantSign: horoscope.Ascendant.Sign?.key ?? "",
    planets,
    points,
    houses,
    aspects,
  };
}
