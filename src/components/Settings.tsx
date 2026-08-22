import { useState, type CSSProperties } from "react";
import type { BirthData } from "../config/birthData";

interface Props {
  birthData: BirthData;
  onSave: (data: BirthData) => void;
  onClose: () => void;
}

export default function Settings({ birthData, onSave, onClose }: Props) {
  const [form, setForm] = useState<BirthData>(birthData);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: 12, padding: 24, width: 360, maxWidth: "90vw",
      }}>
        <h3 style={{ marginTop: 0, color: "var(--text-heading)" }}>Birth Data</h3>
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
        <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
          Location name
          <input
            type="text" value={form.locationName}
            onChange={e => setForm({ ...form, locationName: e.target.value })}
            style={inputStyle}
          />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnStyle(false)}>Cancel</button>
          <button onClick={() => { onSave(form); onClose(); }} style={btnStyle(true)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>
      {label}
      <input
        type="number" value={value} step={step ?? 1}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6,
  border: "1px solid var(--card-border)", background: "var(--input-bg, #0f172a)",
  color: "var(--text-main)", fontSize: 13, boxSizing: "border-box",
};

function btnStyle(primary: boolean): CSSProperties {
  return {
    padding: "8px 16px", borderRadius: 6, border: primary ? "none" : "1px solid var(--card-border)",
    background: primary ? "var(--accent, #3b82f6)" : "transparent",
    color: primary ? "#fff" : "var(--text-main)", cursor: "pointer", fontSize: 13,
  };
}
