import { useState } from "react";
import { blankBirthData, type BirthData } from "../config/birthData";
import { Field, inputStyle, btnStyle } from "./Settings";

interface Props {
  onSave: (data: BirthData) => void;
}

export default function Onboarding({ onSave }: Props) {
  const [form, setForm] = useState<BirthData>(blankBirthData);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: 12, padding: 28, width: 380, maxWidth: "100%",
      }}>
        <h1 style={{ fontSize: 20, margin: "0 0 4px", color: "var(--text-heading)" }}>✦ Chart &amp; Design</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px" }}>
          Enter your birth details to generate your natal chart and Human Design bodygraph.
          This stays in your browser only — it's never sent anywhere.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Field label="Year" value={form.year} onChange={v => setForm({ ...form, year: v })} />
          <Field label="Month (1-12)" value={form.month + 1} onChange={v => setForm({ ...form, month: v - 1 })} />
          <Field label="Day" value={form.date} onChange={v => setForm({ ...form, date: v })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Field label="Hour (24h)" value={form.hour} onChange={v => setForm({ ...form, hour: v })} />
          <Field label="Minute" value={form.minute} onChange={v => setForm({ ...form, minute: v })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <Field label="Latitude" value={form.latitude} step={0.0001} onChange={v => setForm({ ...form, latitude: v })} />
          <Field label="Longitude" value={form.longitude} step={0.0001} onChange={v => setForm({ ...form, longitude: v })} />
        </div>
        <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
          Location name
          <input
            type="text" value={form.locationName}
            onChange={e => setForm({ ...form, locationName: e.target.value })}
            style={inputStyle}
          />
        </label>

        <button
          onClick={() => onSave(form)}
          disabled={!form.locationName.trim()}
          style={{ ...btnStyle(true), width: "100%", opacity: form.locationName.trim() ? 1 : 0.5 }}
        >
          Generate my chart
        </button>
      </div>
    </div>
  );
}
