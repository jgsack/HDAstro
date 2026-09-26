import { mkdirSync, writeFileSync } from "node:fs";
import { DEFAULT_BIRTH_DATA } from "../src/config/birthData";
import { birthDataFingerprint } from "../src/lib/dailySynthesis";
import { buildHumanDesignChart } from "../src/lib/humanDesign/chart";
import { buildChart } from "../src/lib/natalChart";
import { getTodaysTransits } from "../src/lib/transits";

const now = new Date();
const natalChart = buildChart(DEFAULT_BIRTH_DATA);
const hdChart = buildHumanDesignChart(DEFAULT_BIRTH_DATA);
const transits = getTodaysTransits(natalChart, hdChart, now);
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const context = {
  date,
  generatedAt: now.toISOString(),
  chartFingerprint: birthDataFingerprint(DEFAULT_BIRTH_DATA),
  natalContext: {
    sun: natalChart.planets.find(planet => planet.key === "sun")?.signLabel,
    moon: natalChart.planets.find(planet => planet.key === "moon")?.signLabel,
    rising: natalChart.ascendantSign,
  },
  humanDesignContext: {
    type: hdChart.type,
    authority: hdChart.authority,
    profile: hdChart.profile,
    strategy: hdChart.strategy,
  },
  astrologyTransits: transits.filter(item => item.type === "aspect").slice(0, 12),
  humanDesignTransits: transits.filter(item => item.type === "hd_gate").slice(0, 8),
};

mkdirSync("node_modules/.tmp", { recursive: true });
writeFileSync("node_modules/.tmp/daily-context.json", `${JSON.stringify(context, null, 2)}\n`);
console.log("Daily context written to node_modules/.tmp/daily-context.json");
