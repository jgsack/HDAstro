import dailySynthesis from "../../data/daily-synthesis.json";

interface Props {
  chartFingerprint: string;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailySynthesis({ chartFingerprint }: Props) {
  const isToday = dailySynthesis.date === localDateKey(new Date());
  const matchesChart = dailySynthesis.chartFingerprint === chartFingerprint;
  const isReady = isToday && matchesChart;

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

      {!isReady && (
        <div role="status" style={{ position: "relative" }}>
          <h2 style={{ fontSize: 18, margin: "0 0 9px" }}>Today’s synthesis is being prepared</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            The detailed transit rankings below are current. The combined daily reading will appear after the morning refresh.
          </p>
        </div>
      )}

      {isReady && (
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: 20, lineHeight: 1.25, margin: "0 0 10px" }}>{dailySynthesis.headline}</h2>
          {dailySynthesis.summary.map((paragraph, index) => (
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
              <strong>Today’s focus:</strong> {dailySynthesis.focus}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
