// The 9 Human Design centers and 36 channels (gate pairs that connect them).
// Center positions are fixed for bodygraph SVG rendering.

export type CenterName =
  | "head" | "ajna" | "throat" | "g" | "heart"
  | "sacral" | "spleen" | "solar_plexus" | "root";

export interface Center {
  id: CenterName;
  label: string;
  // Normalized SVG coordinates in a 200x280 viewBox (% of width/height)
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "diamond" | "triangle" | "square" | "circle";
}

export const CENTERS: Center[] = [
  { id: "head",        label: "Head",        x: 100, y: 12,  width: 34, height: 34, shape: "triangle" },
  { id: "ajna",        label: "Ajna",        x: 100, y: 58,  width: 34, height: 34, shape: "triangle" },
  { id: "throat",      label: "Throat",      x: 100, y: 105, width: 34, height: 22, shape: "square" },
  { id: "g",           label: "G",           x: 100, y: 148, width: 30, height: 30, shape: "diamond" },
  { id: "heart",       label: "Heart",       x: 145, y: 148, width: 26, height: 26, shape: "diamond" },
  { id: "sacral",      label: "Sacral",      x: 100, y: 198, width: 34, height: 22, shape: "square" },
  { id: "spleen",      label: "Spleen",      x: 53,  y: 164, width: 28, height: 28, shape: "triangle" },
  { id: "solar_plexus",label: "Solar Plexus",x: 153, y: 198, width: 28, height: 28, shape: "triangle" },
  { id: "root",        label: "Root",        x: 100, y: 248, width: 34, height: 22, shape: "square" },
];

export interface Channel {
  gate1: number;
  gate2: number;
  center1: CenterName;
  center2: CenterName;
  name: string;
}

// Verified against the standard 36-channel Human Design table. Note the four
// "hub" gates (10, 20, 34, 57) form all six pairwise channels between them
// (Awakening, Exploration, Perfected Form, Charisma, The Brain Wave, Power) —
// this is correct, not a duplicate; every other gate belongs to exactly one channel.
export const CHANNELS: Channel[] = [
  { gate1: 10, gate2: 20, center1: "g", center2: "throat", name: "Awakening" },
  { gate1: 10, gate2: 34, center1: "g", center2: "sacral", name: "Exploration" },
  { gate1: 10, gate2: 57, center1: "g", center2: "spleen", name: "Perfected Form" },
  { gate1: 20, gate2: 34, center1: "throat", center2: "sacral", name: "Charisma" },
  { gate1: 20, gate2: 57, center1: "throat", center2: "spleen", name: "The Brain Wave" },
  { gate1: 34, gate2: 57, center1: "sacral", center2: "spleen", name: "Power" },
  { gate1: 25, gate2: 51, center1: "g", center2: "heart", name: "Initiation" },
  { gate1: 61, gate2: 24, center1: "head", center2: "ajna", name: "Awareness" },
  { gate1: 43, gate2: 23, center1: "ajna", center2: "throat", name: "Structuring" },
  { gate1: 28, gate2: 38, center1: "spleen", center2: "root", name: "Struggle" },
  { gate1: 3,  gate2: 60, center1: "sacral", center2: "root", name: "Mutation" },
  { gate1: 14, gate2: 2,  center1: "sacral", center2: "g", name: "The Beat" },
  { gate1: 1,  gate2: 8,  center1: "g", center2: "throat", name: "Inspiration" },
  { gate1: 55, gate2: 39, center1: "solar_plexus", center2: "root", name: "Emoting" },
  { gate1: 12, gate2: 22, center1: "throat", center2: "solar_plexus", name: "Openness" },
  { gate1: 59, gate2: 6,  center1: "sacral", center2: "solar_plexus", name: "Mating" },
  { gate1: 50, gate2: 27, center1: "spleen", center2: "sacral", name: "Preservation" },
  { gate1: 54, gate2: 32, center1: "root", center2: "spleen", name: "Transformation" },
  { gate1: 44, gate2: 26, center1: "spleen", center2: "heart", name: "Surrender" },
  { gate1: 19, gate2: 49, center1: "root", center2: "solar_plexus", name: "Synthesis" },
  { gate1: 40, gate2: 37, center1: "heart", center2: "solar_plexus", name: "Community" },
  { gate1: 45, gate2: 21, center1: "throat", center2: "heart", name: "Money Line" },
  { gate1: 63, gate2: 4,  center1: "head", center2: "ajna", name: "Logic" },
  { gate1: 17, gate2: 62, center1: "ajna", center2: "throat", name: "Acceptance" },
  { gate1: 16, gate2: 48, center1: "throat", center2: "spleen", name: "The Wavelength" },
  { gate1: 18, gate2: 58, center1: "spleen", center2: "root", name: "Judgment" },
  { gate1: 9,  gate2: 52, center1: "sacral", center2: "root", name: "Concentration" },
  { gate1: 15, gate2: 5,  center1: "g", center2: "sacral", name: "Rhythm" },
  { gate1: 7,  gate2: 31, center1: "g", center2: "throat", name: "The Alpha" },
  { gate1: 64, gate2: 47, center1: "head", center2: "ajna", name: "Abstraction" },
  { gate1: 11, gate2: 56, center1: "ajna", center2: "throat", name: "Curiosity" },
  { gate1: 53, gate2: 42, center1: "root", center2: "sacral", name: "Maturation" },
  { gate1: 29, gate2: 46, center1: "sacral", center2: "g", name: "Discovery" },
  { gate1: 13, gate2: 33, center1: "g", center2: "throat", name: "The Prodigal" },
  { gate1: 41, gate2: 30, center1: "root", center2: "solar_plexus", name: "Recognition" },
  { gate1: 35, gate2: 36, center1: "throat", center2: "solar_plexus", name: "Transitoriness" },
];

// Type determination logic
// Sacral-defined generators can be MG (if throat connected via channel 34-20)
// or Generator. Projectors have no motor-to-throat. Manifestors have motor-throat.
// Reflectors have no defined centers.

export type HDType = "Generator" | "Manifesting Generator" | "Projector" | "Manifestor" | "Reflector";

// Motor centers: Heart, Sacral, Solar Plexus, Root
export const MOTOR_CENTERS: CenterName[] = ["heart", "sacral", "solar_plexus", "root"];

// Authority hierarchy (first defined center in this list = authority)
export const AUTHORITY_HIERARCHY: Array<{ center: CenterName; authority: string }> = [
  { center: "solar_plexus", authority: "Emotional" },
  { center: "sacral",       authority: "Sacral" },
  { center: "spleen",       authority: "Splenic" },
  { center: "heart",        authority: "Ego/Heart" },
  { center: "g",            authority: "Self/G-Center" },
  { center: "head",         authority: "Mental" },
  { center: "ajna",         authority: "Mental" },
  // Reflectors: Lunar authority
];
