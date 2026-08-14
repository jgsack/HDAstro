import type { TransitItem } from "../lib/transits";
import DailySynthesis from "./DailySynthesis";

interface Props {
  items: TransitItem[];
  chartFingerprint: string;
}

const ASPECT_COLOR: Record<string, string> = {
  conjunction: "#f59e0b",
  opposition: "#ef4444",
  trine: "#3b82f6",
  square: "#f97316",
  sextile: "#22c55e",
};

const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "☌", opposition: "☍", trine: "△", square: "□", sextile: "⚹",
};

export default function DailyTransits({ items, chartFingerprint }: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Group: astrology first (sorted by priority), then HD gates
  const astroItems = items.filter(i => i.type === "aspect").slice(0, 18);
  const hdItems = items.filter(i => i.type === "hd_gate").slice(0, 6);
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>{today}</p>

      <DailySynthesis
        chartFingerprint={chartFingerprint}
      />

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-heading)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Planetary Transits
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {astroItems.map((item, i) => {
            const accentColor = item.aspectKey ? (ASPECT_COLOR[item.aspectKey] ?? "#64748b") : "#64748b";
            const symbol = item.aspectKey ? (ASPECT_SYMBOL[item.aspectKey] ?? "•") : "•";
            return (
              <div key={item.id} style={{
                background: "var(--card-bg)",
                border: `1px solid var(--card-border)`,
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}>
                <div style={{ minWidth: 32, textAlign: "center", paddingTop: 2 }}>
                  <span style={{ fontSize: 18, color: accentColor, fontFamily: "'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif" }}>{symbol}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {item.isExactToday && (
                      <span style={{ background: accentColor, color: "#000", fontSize: 9, fontWeight: 700,
                        padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em" }}>EXACT</span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                      {item.headline}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{item.detail}</p>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", paddingTop: 2 }}>
                  #{i + 1}
                </div>
              </div>
            );
          })}
          {astroItems.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No major aspects today within orb.</p>
          )}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-heading)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Human Design — Gate Transits
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hdItems.map(item => (
            <div key={item.id} style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderLeft: "3px solid var(--hd-accent, #8b5cf6)",
              borderRadius: 8,
              padding: "10px 14px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginBottom: 3 }}>
                {item.headline}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{item.detail}</p>
            </div>
          ))}
          {hdItems.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No notable HD gate activations today.</p>
          )}
        </div>
      </section>
    </div>
  );
}
