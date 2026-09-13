import type { BirthData } from "../config/birthData";
import type { TransitItem } from "./transits";
import { getPlanetLabel } from "./transits";
import { aspectReading, gatePractice, authorityPractice } from "./readingRules";

export interface ReadingSection {
  title: string;
  evidence: string;
  meaning: string;
  practice: string;
}

export interface DailySynthesisContent {
  headline: string;
  summary: string[];
  focus: string;
  sections?: ReadingSection[];
}

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

const GATE_THEMES: Record<number, string> = {
  1: "creative self-expression", 2: "receptive direction", 3: "bringing order to a new beginning",
  4: "forming answers", 5: "trusting consistent rhythms", 6: "emotional boundaries and intimacy",
  7: "guiding collective direction", 8: "making an individual contribution", 9: "sustained focus",
  10: "authentic behavior and self-love", 11: "ideas and imagery", 12: "cautious, well-timed expression",
  13: "listening and holding experience", 14: "resources and empowered skill", 15: "humanity and extremes",
  16: "enthusiasm developed into skill", 17: "opinions and useful patterns", 18: "correction and improvement",
  19: "sensitivity to needs", 20: "presence in the now", 21: "stewardship, control, and clean agreements",
  22: "emotional openness and grace", 23: "turning insight into clear explanation", 24: "returning to an idea until it resolves",
  25: "innocence and universal trust", 26: "influence, will, and integrity", 27: "care and nourishment",
  28: "struggle in service of purpose", 29: "wholehearted commitment", 30: "desire and emotional intensity",
  31: "influence through recognized leadership", 32: "continuity and instinct for what can endure", 33: "retreat, privacy, and reflection",
  34: "independent power", 35: "change through experience", 36: "emotional growth through unfamiliar experience",
  37: "belonging, reciprocity, and agreements", 38: "opposition in service of meaning", 39: "provocation that reveals spirit",
  40: "willpower, work, rest, and fair exchange", 41: "the pressure and imagination that begin a new experience", 42: "growth through completion",
  43: "individual insight", 44: "recognizing patterns from the past", 45: "gathering and distributing resources",
  46: "embodiment and receptive determination", 47: "making meaning from mental pressure", 48: "depth and the fear of inadequacy",
  49: "principles, belonging, and necessary change", 50: "values and responsibility", 51: "shock, courage, and initiation",
  52: "stillness that makes concentration possible", 53: "the pressure to begin", 54: "ambition and transformation",
  55: "spirit, mood, and inner abundance", 56: "stimulation and storytelling", 57: "intuitive clarity in the present",
  58: "vitality and the drive to improve", 59: "intimacy and dissolving barriers", 60: "accepting limitation as a creative container",
  61: "inner truth and mystery", 62: "details that make understanding practical", 63: "doubt that tests a pattern",
  64: "confusion before meaning takes shape",
};

function interpretAspect(item: TransitItem): ReadingSection {
  const reading = aspectReading(item);
  const slow = ["jupiter", "saturn", "uranus", "neptune", "pluto", "northnode", "southnode"].includes(item.transitPlanet);
  const scale = item.transitPlanet === "moon" ? "Brief lunar contact" : slow ? "Longer-running theme" : "Near-term emphasis";
  return { ...reading, title: `${scale}: ${reading.title}`, evidence: `${item.headline}. ${item.detail}` };
}

function interpretGate(item: TransitItem): ReadingSection {
  const theme = item.gate ? GATE_THEMES[item.gate] : undefined;
  const channel = item.detail.match(/Temporarily completing channels?: ([^.]+)/)?.[1];
  const completion = channel
    ? ` The transit supplies the other end of your ${channel} channel. In Human Design terms, this is temporary access to a channel that is not fully defined in your birth chart; it does not change your natal Type or Authority.`
    : "";
  const natal = item.detail.includes("one of your natal gates")
    ? " Because this is already part of your natal design, the transit may feel familiar but louder."
    : "";
  return {
    title: `${getPlanetLabel(item.transitPlanet)} in Gate ${item.gate}: ${theme ?? "gate activation"}`,
    evidence: item.detail,
    meaning: `Within Human Design, this gate concerns ${theme ?? "the theme named in the activation"}.${completion}${natal}`,
    practice: gatePractice(item.gate),
  };
}

/**
 * Build a deterministic reading from the same live, ranked transit list shown
 * below it. This keeps the Today tab useful when the optional cloud-authored
 * synthesis has not arrived, without presenting yesterday's reading as current.
 */
export function buildLiveSynthesis(
  items: TransitItem[], strategy: string, authority: string,
): DailySynthesisContent {
  // Keep the ranked lead, but do not count opposite ends of the same nodal
  // axis as separate evidence. Include a faster contact when available so a
  // slow transit does not become the entire daily reading for weeks.
  const seen = new Set<string>();
  const ranked = [...items].sort((a, b) => b.priority - a.priority);
  const aspects = ranked.filter(item => {
    if (item.type !== "aspect") return false;
    const key = `${item.transitPlanet.replace("southnode", "northnode")}:${(item.natalPoint ?? "").replace("southnode", "northnode")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const astrology = aspects.slice(0, 2);
  const fast = aspects.find(item => ["sun", "moon", "mercury", "venus", "mars"].includes(item.transitPlanet));
  if (fast && !astrology.includes(fast)) astrology.push(fast);
  const gates = ranked.filter(item => item.type === "hd_gate");
  const humanDesign = gates.slice(0, 1);
  const sun = gates.find(item => item.transitPlanet === "sun");
  if (sun && !humanDesign.includes(sun)) humanDesign.push(sun);
  const sections = [...astrology.map(interpretAspect), ...humanDesign.map(interpretGate)];
  return {
    headline: astrology[0] ? aspectReading(astrology[0]).title : "Your current gate activations",
    summary: [
      astrology[0] ? `The strongest ranked contact is ${getPlanetLabel(astrology[0].transitPlanet)} ${astrology[0].aspectKey} your natal ${getPlanetLabel(astrology[0].natalPoint ?? "")}. Read the examples below against what is actually happening in your day.` : "No major natal aspects are currently within the displayed orbs.",
      "Each interpretation below names its chart evidence and a practical way to explore it. An exact time marks the angular crossing, not a predicted event or a deadline to act.",
    ],
    sections,
    focus: `${strategy}. ${authorityPractice(authority)}`,
  };
}
