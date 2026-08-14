import type { BirthData } from "../config/birthData";

export function birthDataFingerprint(data: BirthData): string {
  const value = [
    data.year, data.month, data.date, data.hour, data.minute,
    data.latitude.toFixed(4), data.longitude.toFixed(4),
  ].join("|");
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
