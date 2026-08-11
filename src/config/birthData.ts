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

export const DEFAULT_BIRTH_DATA: BirthData = {
  year: 1962,
  month: 2, // March (0-indexed)
  date: 10,
  hour: 4,
  minute: 46,
  latitude: 47.6062,
  longitude: -122.3321,
  locationName: "Seattle, WA",
};

const LS_KEY = "astro_birth_data";

export function loadBirthData(): BirthData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_BIRTH_DATA, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_BIRTH_DATA;
}

export function saveBirthData(data: BirthData): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
