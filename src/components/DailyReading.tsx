import type { DailyReading } from "../lib/dailyReading";

interface Props {
  reading: DailyReading;
}

export default function DailyReadingCard({ reading }: Props) {
  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--card-border)",
      borderRadius: 12, padding: "20px 22px", marginBottom: 28,
    }}>
      <h2 style={{ fontSize: 18, margin: "0 0 8px", color: "var(--text-heading)" }}>{reading.headline}</h2>
      <p style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, margin: "0 0 16px" }}>
        {reading.overview}
      </p>

      {reading.highlights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reading.highlights.map(h => (
            <div key={h.key} style={{ borderLeft: `3px solid ${h.color}`, paddingLeft: 12 }}>
              <p style={{ fontSize: 13, color: "var(--text-main)", margin: 0, lineHeight: 1.5 }}>{h.text}</p>
              {h.tip && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0", fontStyle: "italic" }}>
                  {h.tip}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {reading.hdParagraph && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--card-border)" }}>
          <h3 style={{
            fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
            letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 6px",
          }}>
            Human Design
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-main)", lineHeight: 1.6, margin: 0 }}>
            {reading.hdParagraph}
          </p>
        </div>
      )}
    </div>
  );
}
