import dailySynthesis from "../../data/daily-synthesis.json";
import { buildLiveSynthesis, type DailySynthesisContent } from "../lib/dailySynthesis";
import type { TransitItem } from "../lib/transits";
import { useCallback, useState } from "react";
import GenerateReading, { type GeneratedReading } from "./GenerateReading";

interface Props {
  chartFingerprint: string;
  items: TransitItem[];
  strategy: string;
  authority: string;
  asOf: Date;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailySynthesis({ chartFingerprint, items, strategy, authority, asOf }: Props) {
  const date = localDateKey(asOf);
  const cacheKey = `chart-design:ai-reading:v1:${chartFingerprint}:${date}`;
  const [generated, setGenerated] = useState<{ key: string; value: GeneratedReading } | null>(null);
  const receive = useCallback((value: GeneratedReading) => setGenerated({ key: cacheKey, value }), [cacheKey]);
  const current = generated?.key === cacheKey ? generated.value : null;
  const isToday = dailySynthesis.date === localDateKey(asOf);
  const matchesChart = dailySynthesis.chartFingerprint === chartFingerprint;
  const isReady = isToday && matchesChart;
  const synthesis: DailySynthesisContent = current?.reading ?? (isReady
    ? dailySynthesis
    : buildLiveSynthesis(items, strategy, authority));

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
        fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>
        Your personalized interpretation
      </p>

      <div style={{ position: "relative" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 12px" }}>
            {current ? `AI reading generated ${new Date(current.generatedAt).toLocaleString()}` : isReady ? `Written for ${dailySynthesis.date}` : "Rule-based interpretation of your current chart"}
          </p>
          <GenerateReading key={cacheKey} cacheKey={cacheKey} date={date} asOf={asOf} items={items} strategy={strategy} authority={authority} onReading={receive} />
          <h2 style={{ fontSize: 20, lineHeight: 1.25, margin: "0 0 10px" }}>{synthesis.headline}</h2>
          {synthesis.summary.map((paragraph, index) => (
            <p key={index} style={{
              color: "var(--text-main)", fontSize: 16, lineHeight: 1.7,
              margin: index === 0 ? "0 0 10px" : "10px 0",
            }}>
              {paragraph}
            </p>
          ))}
          {synthesis.sections?.map((section, index) => (
            <section key={index} style={{ borderTop: "1px solid var(--card-border)", marginTop: 20, paddingTop: 18 }}>
              <h3 style={{ fontSize: 18, lineHeight: 1.4, margin: "0 0 10px" }}>{section.title}</h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 10px" }}>{section.meaning}</p>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}><strong>Put it to use:</strong> {section.practice}</p>
              <details style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>
                <summary style={{ cursor: "pointer" }}>Chart basis and timing</summary>
                <p style={{ margin: "8px 0 0" }}>{section.evidence}</p>
              </details>
            </section>
          ))}
          {!isReady && !current && (
            <details style={{ marginTop: 18, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <summary style={{ cursor: "pointer" }}>About this reading</summary>
              <p>{matchesChart ? `The last written reading is dated ${dailySynthesis.date}.` : "The saved written reading is for a different birth chart."} This interpretation uses editorial rules matched to your live natal contacts and gate activations. It is not a newly authored AI synthesis. Examples are possibilities to consider, not claims about events in your life.</p>
            </details>
          )}
          <div style={{
            marginTop: 15, paddingTop: 13, borderTop: "1px solid var(--card-border)",
            display: "flex", gap: 8, alignItems: "baseline",
          }}>
            <span style={{ color: "var(--hd-accent)", fontSize: 12 }}>✦</span>
            <p style={{ margin: 0, color: "var(--text-heading)", fontSize: 16, lineHeight: 1.6 }}>
              <strong>Today’s focus:</strong> {synthesis.focus}
            </p>
          </div>
        </div>
    </section>
  );
}
