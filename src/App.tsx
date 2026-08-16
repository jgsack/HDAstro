import { useEffect, useMemo, useState } from "react";
import { loadBirthData, saveBirthData, type BirthData } from "./config/birthData";
import { buildChart } from "./lib/natalChart";
import { buildHumanDesignChart } from "./lib/humanDesign/chart";
import { getTodaysTransits } from "./lib/transits";
import { computeTransitDuration, type TransitBody } from "./lib/transitDuration";
import { birthDataFingerprint } from "./lib/dailySynthesis";
import NatalWheel from "./components/NatalWheel";
import BodyGraph from "./components/BodyGraph";
import DailyTransits from "./components/DailyTransits";
import Settings from "./components/Settings";

type Tab = "today" | "natal" | "hd";

const TRANSIT_BODIES: TransitBody[] = [
  "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
  "uranus", "neptune", "pluto", "earth", "northnode", "southnode",
];

export default function App() {
  const [birthData, setBirthData] = useState<BirthData>(loadBirthData);
  const [tab, setTab] = useState<Tab>("today");
  const [showSettings, setShowSettings] = useState(false);

  const natalChart = useMemo(() => buildChart(birthData), [birthData]);
  const hdChart = useMemo(() => buildHumanDesignChart(birthData), [birthData]);

  // Everything that depends on "now" (as opposed to just the natal chart)
  // rides this same tick, so it all goes stale and refreshes together while
  // the tab stays open, instead of only some pieces updating. Planets don't
  // move fast enough for this to need sub-minute polling — 15 minutes is
  // plenty to keep orbs/gate lines accurate to the displayed precision.
  const [transitTime, setTransitTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTransitTime(new Date()), 15 * 60_000);
    return () => clearInterval(id);
  }, []);

  const transits = useMemo(
    () => getTodaysTransits(natalChart, hdChart, transitTime),
    [natalChart, hdChart, transitTime],
  );
  const transitDurations = useMemo(
    () => TRANSIT_BODIES.map(b => computeTransitDuration(b, transitTime)),
    [transitTime],
  );

  // Today's sky, expressed as a "chart" the same way the natal one is (planet
  // ecliptic longitudes are geocentric, so location doesn't matter here — only
  // the current date/time). Reused for the transit ring on the natal wheel.
  const transitSky = useMemo(() => {
    const now = transitTime;
    return buildChart({
      year: now.getFullYear(), month: now.getMonth(), date: now.getDate(),
      hour: now.getHours(), minute: now.getMinutes(),
      latitude: 0, longitude: 0, locationName: "",
    });
  }, [transitTime]);

  const handleSave = (data: BirthData) => {
    saveBirthData(data);
    setBirthData(data);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        borderBottom: "1px solid var(--card-border)",
        padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontSize: 18, margin: 0 }}>✦ Chart &amp; Design</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {birthData.locationName} · {birthData.month + 1}/{birthData.date}/{birthData.year}, {String(birthData.hour).padStart(2,"0")}:{String(birthData.minute).padStart(2,"0")}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: "transparent", border: "1px solid var(--card-border)",
            color: "var(--text-muted)", borderRadius: 6, padding: "6px 12px",
            cursor: "pointer", fontSize: 12,
          }}
        >
          ⚙ Settings
        </button>
      </header>

      <nav style={{
        display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid var(--card-border)",
      }}>
        {([
          { id: "today", label: "Today" },
          { id: "natal", label: "Natal Chart" },
          { id: "hd", label: "Human Design" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "12px 16px", fontSize: 13, fontWeight: 600,
              color: tab === t.id ? "var(--text-heading)" : "var(--text-muted)",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, padding: "28px 20px" }}>
        {tab === "today" && (
          <DailyTransits
            items={transits}
            chartFingerprint={birthDataFingerprint(birthData)}
            transitDurations={transitDurations}
          />
        )}

        {tab === "natal" && (
          <div>
            <NatalWheel chart={natalChart} transitBodies={[...transitSky.planets, ...transitSky.points]} />
            <NatalSummary chart={natalChart} />
          </div>
        )}

        {tab === "hd" && (
          <div>
            <HDSummary chart={hdChart} />
            <BodyGraph chart={hdChart} transits={transitDurations} />
          </div>
        )}
      </main>

      {showSettings && (
        <Settings
          birthData={birthData}
          onSave={handleSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function NatalSummary({ chart }: { chart: ReturnType<typeof buildChart> }) {
  const sun = chart.planets.find(p => p.key === "sun");
  const moon = chart.planets.find(p => p.key === "moon");
  return (
    <div style={{ maxWidth: 480, margin: "20px auto 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
      <p>
        <strong style={{ color: "var(--text-main)" }}>Sun</strong> {sun?.signLabel} ·{" "}
        <strong style={{ color: "var(--text-main)" }}>Moon</strong> {moon?.signLabel} ·{" "}
        <strong style={{ color: "var(--text-main)" }}>Rising</strong> {chart.ascendantSign}
      </p>
    </div>
  );
}

function HDSummary({ chart }: { chart: ReturnType<typeof buildHumanDesignChart> }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto 8px", textAlign: "center" }}>
      <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>{chart.type}</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
        Profile {chart.profile} · {chart.authority} Authority
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        Strategy: {chart.strategy}
      </p>
    </div>
  );
}
