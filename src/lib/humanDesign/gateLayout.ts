// Center shape outlines AND gate positions are both extracted directly from a
// real, professionally-made Human Design bodygraph SVG template (hdkit's
// bodygraph-blank-with-gate-outlines.svg, viewBox 851.41 x 1309.4 — used here
// unscaled, in its native coordinate space).
//
// Earlier extractions of the gate positions had a real bug: each gate's badge
// is drawn as two SVG arcs between two path points, and the center was being
// computed as the plain midpoint of those two points — which is only correct
// if they're diametrically opposite. They're usually only ~90° apart on the
// circle, so that produced a consistent-looking-but-wrong center, off by
// several units in a direction that varied per gate (matching exactly what
// broke: e.g. gate 64 landed noticeably below gates 61/63 even though the
// template draws all three at the same y). Positions here use the correct
// SVG endpoint-to-center arc parameterization instead, and come out clean
// with zero containment or spacing issues against our real shapes — no
// manual nudging needed at all, unlike every previous version of this file.
import type { CenterName } from "./centersChannels";

export const GATE_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 420.77, y: 616 },
  2: { x: 420.7, y: 766.26 },
  3: { x: 420.66, y: 1060.1 },
  4: { x: 458.2, y: 228.55 },
  5: { x: 383.23, y: 942.7 },
  6: { x: 712.59, y: 976.71 },
  7: { x: 383.23, y: 650.93 },
  8: { x: 420.7, y: 540.18 },
  9: { x: 458.2, y: 1060.1 },
  10: { x: 345.46, y: 690.92 },
  11: { x: 458.2, y: 263.37 },
  12: { x: 479.09, y: 476.2 },
  13: { x: 458.2, y: 650.93 },
  14: { x: 420.7, y: 942.7 },
  15: { x: 383.23, y: 734.7 },
  16: { x: 362.37, y: 446.94 },
  17: { x: 383.23, y: 261.96 },
  18: { x: 30.37, y: 1031.5 },
  19: { x: 478.07, y: 1202.26 },
  20: { x: 362.37, y: 494.63 },
  21: { x: 604.07, y: 770.17 },
  22: { x: 781.39, y: 939.02 },
  23: { x: 420.72, y: 416.3 },
  24: { x: 420.72, y: 228.55 },
  25: { x: 492.62, y: 699.47 },
  26: { x: 554.07, y: 820.16 },
  27: { x: 363.54, y: 1024.84 },
  28: { x: 62.56, y: 1012.64 },
  29: { x: 458.2, y: 942.7 },
  30: { x: 813.64, y: 1031.49 },
  31: { x: 383.23, y: 540.18 },
  32: { x: 95.74, y: 993.76 },
  33: { x: 458.2, y: 540.18 },
  34: { x: 363.54, y: 978.7 },
  35: { x: 479.07, y: 442.16 },
  36: { x: 813.63, y: 918.34 },
  37: { x: 748.23, y: 957.25 },
  38: { x: 363.36, y: 1238.39 },
  39: { x: 478.07, y: 1238.39 },
  40: { x: 638.03, y: 820.16 },
  41: { x: 478.07, y: 1274.63 },
  42: { x: 383.23, y: 1060.1 },
  43: { x: 420.7, y: 324.7 },
  44: { x: 95.71, y: 957.23 },
  45: { x: 479.09, y: 509.84 },
  46: { x: 458.2, y: 734.7 },
  47: { x: 383.23, y: 228.55 },
  48: { x: 30.37, y: 918.35 },
  49: { x: 748.23, y: 993.75 },
  50: { x: 131.35, y: 976.7 },
  51: { x: 580.14, y: 794.1 },
  52: { x: 458.2, y: 1171.23 },
  53: { x: 383.23, y: 1171.23 },
  54: { x: 363.36, y: 1202.26 },
  55: { x: 781.42, y: 1012.5 },
  56: { x: 458.2, y: 416.3 },
  57: { x: 62.56, y: 939.01 },
  58: { x: 363.36, y: 1274.63 },
  59: { x: 476.37, y: 1024.84 },
  60: { x: 420.7, y: 1171.23 },
  61: { x: 420.73, y: 140.3 },
  62: { x: 383.23, y: 416.3 },
  63: { x: 458.2, y: 140.3 },
  64: { x: 383.23, y: 140.29 },
};

// The real fill-shape path for each center (first path in each <g id="CenterName">
// group of the source SVG), used verbatim so the colored shape actually matches
// where the gates really sit — no approximation needed.
export const CENTER_PATHS: Record<CenterName, string> = {
  head: "M340.59,156.62a5.48,5.48,0,0,1-4.68-8.32L414,17.86a5.49,5.49,0,0,1,7.54-1.9,5.64,5.64,0,0,1,1.86,1.84l81.12,131.34a5.5,5.5,0,0,1-4.68,8.39Z",
  ajna: "M420.37,355.14a5.44,5.44,0,0,1-4.73-2.69L335.92,218.14a5.49,5.49,0,0,1,1.89-7.53,5.57,5.57,0,0,1,2.84-.78l159.5.82a5.51,5.51,0,0,1,4.7,8.32L425.12,352.49A5.48,5.48,0,0,1,420.37,355.14Z",
  throat: "M349.37,558.45a6,6,0,0,1-6-6l.68-148a6,6,0,0,1,6-6L491.4,399a6,6,0,0,1,6,6l-.67,148a6,6,0,0,1-6,6Z",
  g: "M420,795.51a6.4,6.4,0,0,1-4.58-1.9l-95.86-96.68a6.48,6.48,0,0,1,0-9.13l96.69-95.92a6.46,6.46,0,0,1,9.12,0l95.9,96.72a6.48,6.48,0,0,1,0,9.12l-96.69,95.93A6.48,6.48,0,0,1,420,795.51Z",
  heart: "M527.17,838.36a6.76,6.76,0,0,1-4.73-11.54l78.29-78.14a6.66,6.66,0,0,1,4.76-2,6.75,6.75,0,0,1,5.5,2.83l56.48,79A6.76,6.76,0,0,1,662,839.19Z",
  sacral: "M348.86,1078.19a5.5,5.5,0,0,1-5.48-5.52L344,930.26a5.5,5.5,0,0,1,5.5-5.48l142.43.56a5.5,5.5,0,0,1,5.48,5.52l-.57,142.41a5.54,5.54,0,0,1-5.5,5.48Z",
  spleen: "M15.53,1063.92a5.53,5.53,0,0,1-5.5-5.45l-1.78-167a5.31,5.31,0,0,1,1.57-3.91,5.52,5.52,0,0,1,3.94-1.66,5.39,5.39,0,0,1,2.79.78l145.71,86.2a5.49,5.49,0,0,1,1.94,7.52h0a5.48,5.48,0,0,1-2,2l-144,80.85A5.61,5.61,0,0,1,15.53,1063.92Z",
  solar_plexus: "M831.56,1063.92a5.48,5.48,0,0,1-2.68-.71L685,982.36a5.5,5.5,0,0,1-2.11-7.49h0a5.48,5.48,0,0,1,2-2l145.71-86.2a5.18,5.18,0,0,1,2.79-.78,5.51,5.51,0,0,1,5.51,5.51v.06l-1.78,167A5.53,5.53,0,0,1,831.56,1063.92Z",
  root: "M348.86,1295.7a5.43,5.43,0,0,1-3.88-1.62,5.49,5.49,0,0,1-1.6-3.9l.57-135.56a5.5,5.5,0,0,1,5.5-5.48l142.43.57a5.5,5.5,0,0,1,5.48,5.52l-.57,135.56a5.54,5.54,0,0,1-5.5,5.48Z",
};

// Hand-placed label anchors just outside each shape's real bounding area.
export const CENTER_LABEL_POS: Record<CenterName, { x: number; y: number; side: "left" | "right" }> = {
  head: { x: 512, y: 90, side: "right" },
  ajna: { x: 512, y: 280, side: "right" },
  throat: { x: 505, y: 478, side: "right" },
  g: { x: 530, y: 694, side: "right" },
  heart: { x: 675, y: 793, side: "right" },
  sacral: { x: 502, y: 1001, side: "right" },
  spleen: { x: 0, y: 975, side: "left" },
  solar_plexus: { x: 845, y: 975, side: "right" },
  root: { x: 502, y: 1222, side: "right" },
};

// Matches the source SVG's own viewBox, widened on both sides so the "Spleen"
// and "Solar Plexus" side labels have room and don't get clipped.
export const VIEW_BOX = "-60 0 1040 1310";
