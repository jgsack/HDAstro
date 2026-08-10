// The 64 Human Design gates mapped onto the zodiac wheel.
// Gate 25 begins at 28°15' Pisces = 358.25° ecliptic.
// Each gate spans exactly 5°37'30" = 5.625°.
// Each gate has 6 lines, each 0.9375° wide.
// Order is the Ra Uru Hu Rave Mandala sequence starting at that origin point.

export const GATE_SEQUENCE: number[] = [
  25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20,
  16, 35, 45, 12, 15, 52,
  39, 53, 62, 56, 31, 33,
  7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57,
  32, 50, 28, 44, 1, 43,
  14, 34, 9, 5, 26, 11,
  10, 58, 38, 54, 61, 60,
  41, 19, 13, 49, 30, 55,
  37, 63, 22, 36,
];

// Starting ecliptic degree of gate 25 (28°15' Pisces)
const GATE_ORIGIN_DEG = 358.25;
export const GATE_SPAN = 5.625;
export const LINE_SPAN = 0.9375;

/** Normalize a degree to [0, 360) */
function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export interface GateLine {
  gate: number;
  line: number; // 1-6
}

/** Given an ecliptic longitude (0-360), return the Human Design gate and line. */
export function longitudeToGateLine(longitude: number): GateLine {
  const deg = norm(longitude);
  // Offset from the gate wheel origin
  const offset = norm(deg - GATE_ORIGIN_DEG);
  const gateIndex = Math.floor(offset / GATE_SPAN);
  const posInGate = offset - gateIndex * GATE_SPAN;
  const line = Math.floor(posInGate / LINE_SPAN) + 1;
  return {
    gate: GATE_SEQUENCE[gateIndex % 64],
    line: Math.min(line, 6),
  };
}

/** Given a gate + line, return the absolute ecliptic degree boundaries [lineStart, lineEnd). */
export function gateLineBoundaries(gate: number, line: number): { lineStart: number; lineEnd: number } {
  const gateIndex = GATE_SEQUENCE.indexOf(gate);
  const gateStart = norm(GATE_ORIGIN_DEG + gateIndex * GATE_SPAN);
  const lineStart = norm(gateStart + (line - 1) * LINE_SPAN);
  const lineEnd = norm(lineStart + LINE_SPAN);
  return { lineStart, lineEnd };
}

/** Given a gate, return its absolute ecliptic degree boundaries [gateStart, gateEnd). */
export function gateBoundaries(gate: number): { gateStart: number; gateEnd: number } {
  const gateIndex = GATE_SEQUENCE.indexOf(gate);
  const gateStart = norm(GATE_ORIGIN_DEG + gateIndex * GATE_SPAN);
  return { gateStart, gateEnd: norm(gateStart + GATE_SPAN) };
}

// Gate names from the I Ching hexagrams
export const GATE_NAMES: Record<number, string> = {
  1: "The Creative",
  2: "The Receptive",
  3: "Difficulty at the Beginning",
  4: "Youthful Folly",
  5: "Waiting",
  6: "Conflict",
  7: "The Army",
  8: "Holding Together",
  9: "Taming Power of the Small",
  10: "Treading",
  11: "Peace",
  12: "Standstill",
  13: "Fellowship of Man",
  14: "Possession in Great Measure",
  15: "Modesty",
  16: "Enthusiasm",
  17: "Following",
  18: "Work on What Has Been Spoilt",
  19: "Approach",
  20: "Contemplation",
  21: "Biting Through",
  22: "Grace",
  23: "Splitting Apart",
  24: "Returning",
  25: "Innocence",
  26: "Taming Power of the Great",
  27: "Nourishment",
  28: "Preponderance of the Great",
  29: "The Abysmal",
  30: "Clinging Fire",
  31: "Influence",
  32: "Duration",
  33: "Retreat",
  34: "Power of the Great",
  35: "Progress",
  36: "Darkening of the Light",
  37: "The Family",
  38: "Opposition",
  39: "Obstruction",
  40: "Deliverance",
  41: "Decrease",
  42: "Increase",
  43: "Breakthrough",
  44: "Coming to Meet",
  45: "Gathering Together",
  46: "Pushing Upward",
  47: "Oppression",
  48: "The Well",
  49: "Revolution",
  50: "The Cauldron",
  51: "The Arousing",
  52: "Keeping Still",
  53: "Development",
  54: "The Marrying Maiden",
  55: "Abundance",
  56: "The Wanderer",
  57: "The Gentle",
  58: "The Joyous",
  59: "Dispersion",
  60: "Limitation",
  61: "Inner Truth",
  62: "Preponderance of the Small",
  63: "After Completion",
  64: "Before Completion",
};
