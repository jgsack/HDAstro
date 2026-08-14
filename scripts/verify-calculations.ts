import assert from "node:assert/strict";
import { deriveChart, type HDActivation, type HDChart } from "../src/lib/humanDesign/chart";
import { computeTransitDuration, eclipticLongitude } from "../src/lib/transitDuration";
import { getTodaysTransits } from "../src/lib/transits";
import type { NatalChart } from "../src/lib/natalChart";

function activations(gates: number[]): HDActivation[] {
  return gates.map(gate => ({
    planet: "test",
    gate,
    line: 1,
    gateName: "",
    isPersonality: true,
  }));
}

// Root -> Spleen -> Throat is an indirect motor connection. The old direct-
// channel check incorrectly called this chart a Projector.
const manifestor = deriveChart(activations([54, 32, 20, 57]));
assert.equal(manifestor.type, "Manifestor");
assert.equal(manifestor.authority, "Splenic");

// Adding a defined Sacral makes the same motorized-Throat chart an MG.
const manifestingGenerator = deriveChart(activations([54, 32, 20, 57, 3, 60]));
assert.equal(manifestingGenerator.type, "Manifesting Generator");
assert.equal(manifestingGenerator.authority, "Sacral");

// The 25-51 definition is Ego-projected authority even without a Throat path.
const egoProjector = deriveChart(activations([25, 51]));
assert.equal(egoProjector.type, "Projector");
assert.equal(egoProjector.authority, "Ego/Heart");

// Locate a real mean-node date inside the line that crosses 360°/0°, then
// ensure both nodes have a positive duration containing the requested moment.
let wrapDate: Date | null = null;
for (
  let date = new Date("1900-01-01T12:00:00Z"), i = 0;
  i < 80_000;
  date = new Date(date.getTime() + 86_400_000), i += 1
) {
  if (eclipticLongitude("northnode", date) > 359.3) {
    wrapDate = date;
    break;
  }
}
assert.ok(wrapDate, "Expected to find a lunar-node date near 360°");
for (const body of ["northnode", "southnode"] as const) {
  const duration = computeTransitDuration(body, wrapDate);
  assert.ok(duration.entry && duration.entry < wrapDate);
  assert.ok(duration.exit && duration.exit > wrapDate);
  assert.ok(duration.totalMs && duration.totalMs > 0);
  assert.ok(duration.remainingMs && duration.remainingMs > 0);
}

const minimalNatalChart: NatalChart = {
  ascendantDeg: 0,
  midheavenDeg: 90,
  ascendantSign: "aries",
  planets: [{
    key: "sun",
    label: "Sun",
    eclipticDeg: 10,
    horizonDeg: 10,
    signKey: "aries",
    signLabel: "Aries",
    houseId: 1,
    isRetrograde: false,
  }],
  points: [],
  houses: [],
  aspects: [],
};

const emptyHDChart: HDChart = {
  type: "Reflector",
  authority: "Lunar",
  profile: "1/1",
  strategy: "Wait a Lunar Cycle",
  definedCenters: [],
  definedChannels: [],
  activations: [],
};

const transitItems = getTodaysTransits(minimalNatalChart, emptyHDChart);
const hdBodies = new Set(
  transitItems.filter(item => item.type === "hd_gate").map(item => item.transitPlanet),
);
const expectedHDBodies = [
  "sun", "earth", "moon", "northnode", "southnode", "mercury", "venus",
  "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
];
assert.deepEqual([...hdBodies].sort(), [...expectedHDBodies].sort());
assert.ok(!hdBodies.has("chiron"));

console.log("Calculation verification passed.");
