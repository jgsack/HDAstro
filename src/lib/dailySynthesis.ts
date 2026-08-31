import type { BirthData } from "../config/birthData";
import type { TransitItem } from "./transits";

export interface DailySynthesisContent {
  headline: string;
  summary: string[];
  focus: string;
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

const TRANSIT_THEMES: Record<string, string> = {
  sun: "visibility, vitality, and conscious purpose",
  moon: "feeling, instinct, and immediate needs",
  mercury: "language, perception, and decisions",
  venus: "values, relationship, and receptivity",
  mars: "action, desire, and the use of force",
  jupiter: "growth, confidence, and proportion",
  saturn: "responsibility, limits, and durable structure",
  uranus: "freedom, disruption, and a more authentic pattern",
  neptune: "imagination, sensitivity, and uncertain boundaries",
  pluto: "power, truth, and deep transformation",
  northnode: "the direction that asks for development",
  southnode: "the familiar pattern ready for perspective",
};

const NATAL_THEMES: Record<string, string> = {
  sun: "identity and life direction",
  moon: "emotional security and embodied needs",
  mercury: "thinking and communication",
  venus: "values and relationships",
  mars: "initiative and self-assertion",
  jupiter: "faith, meaning, and growth",
  saturn: "boundaries and responsibility",
  uranus: "independence and the need for change",
  neptune: "imagination, ideals, and discernment",
  pluto: "power, vulnerability, and regeneration",
  chiron: "the tender place where experience becomes wisdom",
  northnode: "growth and future direction",
  southnode: "habit and accumulated experience",
  ascendant: "identity, presence, and how life meets you",
  midheaven: "public direction, vocation, and visible contribution",
};

const ASPECT_DYNAMICS: Record<string, string> = {
  conjunction: "concentrates both themes into one immediate experience",
  opposition: "asks you to hold two competing truths without collapsing into either one",
  square: "creates productive friction that requires a conscious adjustment",
  trine: "offers a supportive current that becomes useful when you participate in it",
  sextile: "opens an opportunity that still needs a deliberate response",
};

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

function interpretAspect(item: TransitItem): string {
  const transit = TRANSIT_THEMES[item.transitPlanet] ?? "a changing life emphasis";
  const natal = NATAL_THEMES[item.natalPoint ?? ""] ?? "a personal natal theme";
  const dynamic = ASPECT_DYNAMICS[item.aspectKey ?? ""] ?? "brings the two themes into conversation";
  const exactTime = item.detail.match(/exact (.+)$/)?.[1];
  const timing = item.isExactToday
    ? `This is a present-tense turning point${exactTime ? `, exact at ${exactTime}` : ""}; notice what becomes undeniable without treating urgency as certainty.`
    : item.phase === "applying"
      ? "The influence is still building, so allow the meaning to develop before deciding what it requires."
      : item.phase === "separating"
        ? "The peak has passed; integration matters more now than generating another reaction."
        : "This slow influence rewards patience and sustained attention rather than a quick conclusion.";
  return `${transit[0].toUpperCase()}${transit.slice(1)} now meets ${natal}; this ${dynamic}. ${timing}`;
}

function interpretGate(item: TransitItem): string {
  const theme = item.gate ? GATE_THEMES[item.gate] : undefined;
  const channel = item.detail.match(/Temporarily completing channels?: ([^.]+)/)?.[1];
  const completion = channel
    ? ` By temporarily completing ${channel}, it can make that theme feel unusually available or urgent; availability is not the same as a lasting commitment.`
    : "";
  const natal = item.detail.includes("one of your natal gates")
    ? " Because this is already part of your natal design, the transit may feel familiar but louder."
    : "";
  const planetTheme = TRANSIT_THEMES[item.transitPlanet] ?? "the current transit";
  return `Gate ${item.gate} emphasizes ${theme ?? "working consciously with its central theme"}, colored by ${planetTheme}.${completion}${natal}`;
}

/**
 * Build a deterministic reading from the same live, ranked transit list shown
 * below it. This keeps the Today tab useful when the optional cloud-authored
 * synthesis has not arrived, without presenting yesterday's reading as current.
 */
export function buildLiveSynthesis(
  items: TransitItem[], strategy: string, authority: string,
): DailySynthesisContent {
  const astrology = items.filter(item => item.type === "aspect").slice(0, 2);
  const humanDesign = items.filter(item => item.type === "hd_gate").slice(0, 2);
  const lead = astrology[0];

  const headline = lead?.isExactToday
    ? "Let today’s turning point become information, not a command"
    : lead?.phase === "applying"
      ? "Stay with what is developing before you decide"
      : "Integrate what the day has revealed before reaching again";

  const astrologySummary = astrology.length > 0
    ? astrology.map(interpretAspect).join(" ")
    : "No major natal aspects are currently within the app’s displayed orbs.";

  const humanDesignSummary = humanDesign.length > 0
    ? `${humanDesign.map(interpretGate).join(" ")} ` +
      `Use your ${authority} Authority and your strategy—${strategy}—to decide what deserves your energy.`
    : `No notable gate activations are currently ranked. Use your ${authority} Authority and your strategy—${strategy}—as the day’s anchor.`;

  return {
    headline,
    summary: [astrologySummary, humanDesignSummary],
    focus: `${strategy}; use the transits as weather, then let ${authority} clarity determine your response.`,
  };
}
