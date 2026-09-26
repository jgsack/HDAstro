import type { TransitItem } from "./transits";

type Interpretation = { title: string; meaning: string; practice: string };

// Editorial interpretations, not calculated facts or predictions. Exact
// combinations take precedence over the broader planet/target vocabulary.
const SPECIFIC: Record<string, Interpretation> = {
  "jupiter:square:moon": {
    title: "How much more can your everyday life actually hold?",
    meaning: "Jupiter enlarges; the natal Moon describes familiar ways of feeling secure. In a square, enthusiasm for more can compete with the routines that keep you comfortable. An invitation, purchase, or promise may sound generous while quietly demanding more time or energy than you want to give. The useful question is whether the expansion nourishes you after the excitement wears off.",
    practice: "For one appealing commitment, write down what it adds and what you would have to give up. Include recovery time. If you cannot name the trade-off, leave the answer open.",
  },
  "jupiter:conjunction:northnode": {
    title: "An opening is worth exploring before enlarging it",
    meaning: "In astrology, Jupiter meeting the natal North Node emphasizes learning through a less familiar role or relationship. This can be read as permission to explore an opportunity, but it does not establish that an offer is destined or beneficial. The opportunity becomes meaningful through what it lets you learn and contribute.",
    practice: "Ask what a small first step would involve, who wants your contribution, and what they expect. Try to establish those details before agreeing to the full role.",
  },
  "pluto:conjunction:ascendant": {
    title: "Reconsider the role other people expect you to play",
    meaning: "Pluto near your Ascendant is a long-running identity theme, not a new crisis every morning. Its astrological emphasis is on control over how you present yourself and how much access others assume they have. One possible expression is finding an old role—helper, organizer, accommodating person—harder to keep performing without resentment.",
    practice: "Choose one recurring request you resent. Identify the actual boundary: less time, a narrower role, or permission to decline. State that boundary without inventing an excuse.",
  },
  "sun:opposition:sun": {
    title: "Review what the last six months have asked of you",
    meaning: "The Sun opposite your natal Sun falls around the midpoint between birthdays. In an astrological reading, this is a useful comparison between the direction you intended and the demands now coming from other people. A disagreement may reveal a mismatch in priorities rather than a failure on either side.",
    practice: "Look at one goal from around your last birthday. Decide which part still matters, which obligation displaced it, and one adjustment that would make room for it.",
  },
  "moon:trine:mercury": {
    title: "Put a feeling into a sentence someone can answer",
    meaning: "This brief Moon–Mercury contact links immediate feelings with your natal communication style. It is a useful symbolic prompt for a check-in, draft, or honest question. Ease in talking is different from certainty about the answer, especially when a larger commitment is involved.",
    practice: "Replace a broad statement such as ‘this is not working’ with one observation and one request: ‘When this happens, I need this changed.’ Leave room for a reply.",
  },
  "moon:trine:sun": {
    title: "Give one personal priority a little room today",
    meaning: "The Moon trine your natal Sun is a brief alignment between immediate needs and your sense of purpose. It can be used as a prompt to choose a task you care about instead of filling the whole day with responses to other people. It is a passing emphasis, not evidence that every decision made today will work out.",
    practice: "Choose one manageable task you would be glad to finish even if nobody noticed. Protect a short, defined block of time for it.",
  },
  "venus:square:ascendant": {
    title: "Notice the price of being agreeable",
    meaning: "Venus square your Ascendant puts social ease and self-presentation in tension. In ordinary terms, that may be a mismatch between what would make an interaction pleasant and what you actually prefer. It is worth checking whether a polite yes is covering a preference you have not expressed.",
    practice: "In one small choice—timing, venue, or the shape of a shared task—state your real preference before automatically accommodating the other person.",
  },
  "mars:trine:sun": {
    title: "Give your intention a finishable task",
    meaning: "Mars trine your natal Sun links initiative with personal direction. Within this interpretation, the useful outlet is direct effort on something you already want to do. The risk is turning a manageable opening into a larger undertaking simply because starting feels easier.",
    practice: "Define what ‘finished’ means for one task before beginning. Complete that version before adding another requirement.",
  },
  "northnode:conjunction:mars": {
    title: "Choose what you are willing to initiate",
    meaning: "The North Node on natal Mars brings initiative and assertion into the reading’s developmental theme. A possible expression is recognizing that waiting for someone else to name your preference has become frustrating. Naming a desire is separate from immediately committing to a course of action.",
    practice: "Write the request you have been hoping someone else would guess. Check whether you want the outcome enough to take on the work it requires.",
  },
};

const TARGETS: Record<string, { area: string; question: string }> = {
  sun: { area: "your personal priorities and the role you want to occupy", question: "Which part of this serves a goal you chose, and which part is someone else’s expectation?" },
  moon: { area: "your routines, comfort, and emotional needs", question: "What would this do to your available time and the routines that help you recover?" },
  mercury: { area: "a conversation, decision, or piece of work that needs explaining", question: "What do you know, what are you assuming, and what question would separate them?" },
  venus: { area: "reciprocity, preferences, and what you choose to give", question: "Are you offering something willingly, or hoping the other person will infer what you need in return?" },
  mars: { area: "how you start, pursue, or defend something you want", question: "What outcome are you trying to achieve, and does your current approach actually help?" },
  jupiter: { area: "a plan you hope to expand or an idea you believe in", question: "What evidence supports the size of the promise you are making?" },
  saturn: { area: "obligations, limits, and the standards you hold yourself to", question: "Which requirement is necessary, and which are you imposing without checking?" },
  uranus: { area: "your need for independence or a change in routine", question: "What small change would give you more choice without abandoning something useful?" },
  neptune: { area: "an ideal, creative possibility, or situation you cannot yet verify", question: "What can you test directly before filling the gaps with hope or suspicion?" },
  pluto: { area: "a situation involving control, trust, or unequal responsibility", question: "Who can make the decision, and who has to live with the consequences?" },
  chiron: { area: "an interaction that touches an old sensitivity", question: "What happened in this interaction, separately from what it reminds you of?" },
  ascendant: { area: "the role you take in interactions and the first response others expect", question: "Does the role you are being offered fit the way you actually want to participate?" },
  midheaven: { area: "public responsibilities, work, or a contribution others see", question: "What is the expected result, and do you have the authority and capacity to deliver it?" },
  northnode: { area: "an unfamiliar role or direction you are considering", question: "What could you learn from a limited trial before taking on the whole commitment?" },
  southnode: { area: "a familiar response you may be repeating automatically", question: "Is this response still useful, or is familiarity doing the deciding?" },
};

const APPROACHES: Record<string, { verb: string; risk: string }> = {
  sun: { verb: "bring attention to", risk: "confusing being noticed with making progress" },
  moon: { verb: "register your immediate response to", risk: "treating a passing mood as a settled preference" },
  mercury: { verb: "put words and questions to", risk: "mistaking a persuasive explanation for a verified fact" },
  venus: { verb: "negotiate what feels fair or appealing in", risk: "agreeing for the sake of a pleasant interaction" },
  mars: { verb: "take direct action on", risk: "pushing for a response faster than the situation allows" },
  jupiter: { verb: "expand your involvement in", risk: "promising more than your ordinary week can accommodate" },
  saturn: { verb: "set limits and define responsibilities in", risk: "taking responsibility without the authority to change anything" },
  uranus: { verb: "try a different approach to", risk: "discarding the useful parts along with the frustrating ones" },
  neptune: { verb: "explore what you imagine or hope for in", risk: "leaving an assumption untested because the story is appealing" },
  pluto: { verb: "examine who holds control in", risk: "turning a disagreement over one choice into a struggle over the whole relationship" },
  northnode: { verb: "experiment with a new response to", risk: "assuming unfamiliarity proves that a choice is right" },
  southnode: { verb: "review your habitual response to", risk: "repeating an old solution without checking the current need" },
};

export function aspectReading(item: TransitItem): Interpretation {
  const exact = SPECIFIC[`${item.transitPlanet}:${item.aspectKey}:${item.natalPoint}`];
  if (exact) return exact;
  const target = TARGETS[item.natalPoint ?? ""];
  const approach = APPROACHES[item.transitPlanet];
  if (!target || !approach) return {
    title: item.headline,
    meaning: "This contact is calculated, but this combination does not yet have an editorial interpretation.",
    practice: "Use the displayed contact as a reference; no personal event is inferred from it.",
  };
  const friction = item.aspectKey === "square" || item.aspectKey === "opposition";
  return {
    title: `${friction ? "A competing demand around" : "An opening around"} ${target.area}`,
    meaning: `This contact can be read as an invitation to ${approach.verb} ${target.area}. ${friction ? "The square or opposition suggests competing demands: making room for one preference can cost something elsewhere." : item.aspectKey === "conjunction" ? "The conjunction brings these concerns together, so one choice may carry more than one motive." : "The trine or sextile suggests a possible point of cooperation, useful when you take a specific step."} Watch for ${approach.risk}.`,
    practice: target.question,
  };
}

const GATE_PRACTICE: Record<number, string> = {
  7: "If you are asked to lead, clarify who wants your direction and what decisions they are actually giving you. An invitation to advise is not automatically permission to take over.",
  21: "For a shared task, distinguish who controls the time or resources from who is accountable for the result. If you are responsible but cannot make the necessary decisions, ask to revise the arrangement.",
  22: "Before a sensitive conversation, check whether you are available to listen or merely trying to get it over with. A specific later time is more useful than forcing graciousness now.",
  25: "Try meeting one interaction without deciding in advance what it says about you. You can stay open and still set a boundary around what you will do.",
  29: "Before saying yes, name what completing the commitment would require. Enthusiasm for starting does not answer whether you want the whole process.",
  30: "Separate the experience you want from the outcome you expect it to deliver. Which part would still interest you if it did not turn out as imagined?",
  33: "Leave a little space between an experience and the account you give of it. Write private notes first, then choose what actually needs to be shared.",
  37: "Make one implicit agreement explicit: what each person contributes, what they receive, and what happens if the arrangement stops working.",
  40: "Put the stopping point into the agreement before accepting more work. A promise with no endpoint also has no clear place for rest.",
  41: "Write the first step of the experience you are imagining, then its actual time requirement. Keep wanting an experience separate from committing to begin it today.",
  47: "If you are trying to make sense of a past event, list what happened separately from the explanation you are giving it. Leave the explanation unfinished when the facts do not yet support it.",
  51: "Notice whether you want to try something because it matters to you or because it would prove you can. Reduce the first step until it no longer needs an audience.",
  64: "Capture the fragments of the idea without forcing them into a conclusion. Return later and check which connections are supported by what you actually know.",
};

export function gatePractice(gate?: number): string {
  return GATE_PRACTICE[gate ?? 0] ?? "Find one current situation that actually involves this gate’s theme. Describe the choice in ordinary words, and check it against your natal Authority before treating the transit as a reason to act.";
}

export function authorityPractice(authority: string): string {
  if (authority === "Emotional") return "For a consequential invitation, request the details and time to respond. Revisit it in a different mood; check whether your answer remains consistent.";
  if (authority === "Sacral") return "Reduce the choice to a concrete yes-or-no option and notice your immediate bodily response, rather than reasoning from what you should want.";
  if (authority === "Splenic") return "Notice the quiet, immediate instinct about this specific choice. Distinguish that first response from the explanations that follow.";
  if (authority === "Lunar") return "For major decisions, observe the choice over a lunar cycle and in more than one setting before settling on an answer.";
  return `Use your ${authority} Authority with the concrete choice in front of you; a transit is not an instruction to accept a commitment.`;
}
