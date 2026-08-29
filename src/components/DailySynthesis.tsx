import dailySynthesis from "../../data/daily-synthesis.json";
import { buildLiveSynthesis } from "../lib/dailySynthesis";
import type { TransitItem } from "../lib/transits";

interface Props {
  chartFingerprint: string;
  items: TransitItem[];
  strategy: string;
  authority: string;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailySynthesis({ chartFingerprint, items, strategy, authority }: Props) {
  const isToday = dailySynthesis.date === localDateKey(new Date());
  const matchesChart = dailySynthesis.chartFingerprint === chartFingerprint;
  const isReady = isToday && matchesChart;
  const synthesis = isReady
    ? dailySynthesis
    : buildLiveSynthesis(items, strategy, authority);

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(145deg, color-mix(in srgb, var(--accent) 14%, var(--card-bg)), var(--card-bg) 58%)",
      border: "1px solid color-mix(in srgb, var(--accent) 45%, var(--card-border))",
      borderRadius: 14,
      padding: "22px 24px",
      marginBottom: 30,
    }}>
      <div aria-hidden="true" style={{
        position: "absolute", width: 130, height: 130, borderRadius: "50%",
        right: -50, top: -70, background: "color-mix(in srgb, var(--hd-accent) 18%, transparent)",
        filter: "blur(4px)",
      }} />
      <p style={{
        position: "relative", margin: "0 0 7px", color: "var(--text-muted)",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        Integrated Daily Synthesis
      </p>

      <div style={{ position: "relative" }}>
          {!isReady && (
            <p style={{ color: "var(--text-muted)", fontSize: 10, margin: "0 0 8px" }}>
              Live calculated reading
            </p>
          )}
          <h2 style={{ fontSize: 20, lineHeight: 1.25, margin: "0 0 10px" }}>{synthesis.headline}</h2>
          {synthesis.summary.map((paragraph, index) => (
            <p key={index} style={{
              color: "var(--text-main)", fontSize: 13, lineHeight: 1.7,
              margin: index === 0 ? "0 0 10px" : "10px 0",
            }}>
              {paragraph}
            </p>
          ))}
          <div style={{
            marginTop: 15, paddingTop: 13, borderTop: "1px solid var(--card-border)",
            display: "flex", gap: 8, alignItems: "baseline",
          }}>
            <span style={{ color: "var(--hd-accent)", fontSize: 12 }}>✦</span>
            <p style={{ margin: 0, color: "var(--text-heading)", fontSize: 12, lineHeight: 1.55 }}>
              <strong>Today’s focus:</strong> {synthesis.focus}
            </p>
          </div>
        </div>
    </section>
  );
}
