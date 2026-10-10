import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The ephemeris finds crossings in the process's local day. A cloud machine's
// UTC default must not turn the Pacific daily reading into a different day.
process.env.TZ = "America/Los_Angeles";
const mode = process.argv[2];

function runNode(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root, env: { ...process.env, TZ: "America/Los_Angeles" }, stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Daily workflow command failed (${result.status}): ${file}`);
}

function bin(name, args) {
  const manifestPath = resolve(root, "node_modules", name, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const relative = typeof manifest.bin === "string" ? manifest.bin : manifest.bin[name];
  if (!relative) throw new Error(`No installed executable for ${name}; restore dependencies before running.`);
  runNode(resolve(dirname(manifestPath), relative), args);
}

function exportContext() {
  bin("vite", ["build", "--config", "vite.daily.config.ts", "--ssr", "scripts/export-daily-context.ts", "--outDir", "node_modules/.tmp/daily-context"]);
  runNode(resolve(root, "node_modules/.tmp/daily-context/export-daily-context.js"));
}

function validateReading() {
  const context = JSON.parse(readFileSync(resolve(root, "node_modules/.tmp/daily-context.json"), "utf8"));
  const reading = JSON.parse(readFileSync(resolve(root, "data/daily-synthesis.json"), "utf8"));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
  const words = value => typeof value === "string" ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  requireValue(context.date === today && reading.date === today, "Context and authored reading must both be for today's Pacific date.");
  requireValue(reading.chartFingerprint === context.chartFingerprint, "Reading belongs to a different natal chart.");
  const age = Date.now() - Date.parse(reading.generatedAt);
  requireValue(Number.isFinite(age) && age >= -300_000 && age < 86_400_000, "Reading timestamp is missing, invalid, or stale.");
  requireValue(words(reading.headline) >= 4, "Reading needs a descriptive headline.");
  requireValue(Array.isArray(reading.summary) && reading.summary.length === 2 && reading.summary.every(p => words(p) >= 25), "Write two substantive synthesis paragraphs.");
  requireValue(Array.isArray(reading.sections) && reading.sections.length >= 3 && reading.sections.length <= 5, "Write three to five specific interpretation sections.");
  for (const section of reading.sections) {
    requireValue(words(section.title) >= 3 && words(section.evidence) >= 8, "Every section needs a title and named chart evidence.");
    requireValue(words(section.meaning) >= 40 && words(section.practice) >= 15, "Every section needs an interpretation and a concrete question or practice.");
  }
  requireValue(words(reading.focus) >= 12, "The daily focus needs a concrete action or question.");
  console.log(`Fresh authored reading verified for ${today}; fingerprint ${context.chartFingerprint}.`);
}

if (mode === "context") exportContext();
else if (mode === "check") {
  exportContext();
  validateReading();
  bin("vite", ["build", "--config", "vite.test.config.ts", "--ssr", "scripts/verify-calculations.ts", "--outDir", "node_modules/.tmp/calculation-tests"]);
  runNode(resolve(root, "node_modules/.tmp/calculation-tests/verify-calculations.js"));
  bin("oxlint", []);
} else if (mode === "build") {
  validateReading();
  bin("vinext", ["build"]);
} else throw new Error("Usage: node scripts/daily-workflow.mjs context|check|build");
