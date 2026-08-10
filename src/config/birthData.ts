export interface BirthData {
  year: number;
  month: number; // 0-indexed (0 = January)
  date: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  locationName: string;
}

// Neutral starting point for the onboarding form — not a real chart, just
// sane field values before the visitor enters their own birth details.
export function blankBirthData(): BirthData {
  const now = new Date();
  return {
    year: now.getFullYear(), month: 0, date: 1, hour: 12, minute: 0,
    latitude: 0, longitude: 0, locationName: "",
  };
}

const LS_KEY = "astro_birth_data";

// Each visitor's birth data lives only in their own browser's local storage —
// nothing is shared across visitors and nothing ships baked into the build,
// which matters once this is deployed as a public site.
export function loadBirthData(): BirthData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveBirthData(data: BirthData): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
