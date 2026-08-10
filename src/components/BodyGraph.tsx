import type { HDChart } from "../lib/humanDesign/chart";
import { CENTERS, CHANNELS, type Center, type CenterName } from "../lib/humanDesign/centersChannels";
import { GATE_POSITIONS, CENTER_PATHS, CENTER_LABEL_POS, VIEW_BOX } from "../lib/humanDesign/gateLayout";
import { formatDuration, type TransitDuration } from "../lib/transitDuration";

interface Props {
  chart: HDChart;
  transits?: TransitDuration[];
  now?: number; // ms timestamp, passed in so a periodic re-render updates the countdown text
}

// A simple head + shoulders + tapering-cloak silhouette, sized to sit behind
// all 9 centers (matches the reference image's convention of grounding the
// centers on a body shape instead of floating them on bare background).
const BODY_SILHOUETTE_PATH = `
  M 420,15
  C 478,15 522,58 522,138
  C 522,205 498,245 458,272
  C 610,296 720,375 738,515
  C 754,640 736,770 700,890
  C 728,995 740,1140 740,1300
  L 100,1300
  C 100,1140 112,995 140,890
  C 104,770 86,640 102,515
  C 120,375 230,296 382,272
  C 342,245 318,205 318,138
  C 318,58 362,15 420,15
  Z
`;

// Standard Human Design center colors (matching the canonical bodygraph palette
// used across most HD tools), filled when defined and outlined-only when open.
const HD_CENTER_COLORS: Record<CenterName, string> = {
  head: "#e6c65c",
  ajna: "#4f8f5b",
  throat: "#8a6a45",
  g: "#e3b53a",
  heart: "#b6402f",
  sacral: "#b6402f",
  spleen: "#5c4a3a",
  solar_plexus: "#6b4a30",
  root: "#5c4a3a",
};

// Uses the center's real outline path (see gateLayout.ts) rather than an
// approximated polygon, so the shape actually contains its own gate numbers.
function renderCenter(center: Center, isDefined: boolean) {
  const hdColor = HD_CENTER_COLORS[center.id];
  const fill = isDefined ? hdColor : "var(--center-open, transparent)";
  const stroke = isDefined ? hdColor : "var(--center-open-border, #475569)";
  const textFill = isDefined ? "var(--center-text-defined, #e0f2fe)" : "var(--center-text-open, #94a3b8)";
  const label = CENTER_LABEL_POS[center.id];

  return (
    <g key={center.id}>
      <path d={CENTER_PATHS[center.id]} fill={fill} stroke={stroke} strokeWidth={4} strokeLinejoin="round" />
      <text x={label.x} y={label.y} textAnchor={label.side === "right" ? "start" : "end"} dominantBaseline="central" fontSize={18}
        fill={textFill}>
        {center.label}
      </text>
    </g>
  );
}

// Matches the reference convention: only ACTIVE gates get a solid badge circle
// behind the number (a uniform dark circle with a white number — the
// personality/design distinction lives in the channel cord color instead, not
// the badge, matching the reference); inactive gates are plain muted text with
// no circle, so a glance at "which numbers have circles" tells you what's active.
function GateNumberBadge({
  x, y, gate, active,
}: { x: number; y: number; gate: number; active: boolean }) {
  if (!active) {
    return (
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={500}
        fill="var(--gate-inactive-text, #9ca3af)">
        {gate}
      </text>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r={13.5} fill="var(--gate-badge-bg-active, #14182b)" stroke="#ffffff" strokeOpacity={0.15} strokeWidth={1} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill="#ffffff">
        {gate}
      </text>
    </g>
  );
}

const PLANET_LABELS: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
  earth: "⊕", northnode: "☊", southnode: "☋",
};

const PLANET_NAMES: Record<string, string> = {
  sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
  jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
  earth: "Earth", northnode: "North Node", southnode: "South Node",
};

// Ring color encodes how much longer this transit has left, so a glance at
// the color answers "hours or weeks?" before you even read the number.
// These are tuned as lines/rings on the dark app background.
function timescaleColor(remainingMs: number | null): string {
  if (remainingMs === null) return "var(--transit-unknown, #94a3b8)";
  const days = remainingMs / 86400000;
  if (days < 1) return "var(--transit-hours, #f59e0b)";
  if (days < 7) return "var(--transit-days, #38bdf8)";
  if (days < 30) return "var(--transit-weeks, #34d399)";
  if (days < 180) return "var(--transit-months, #a78bfa)";
  return "var(--transit-long, #f472b6)";
}

// Same category boundaries, but a darker/deeper shade of each color — used
// wherever the text sits on the light chip pill instead of the dark background,
// since the pastel line colors above are too low-contrast to read on white.
function timescaleColorOnLight(remainingMs: number | null): string {
  if (remainingMs === null) return "#475569";
  const days = remainingMs / 86400000;
  if (days < 1) return "#b45309";
  if (days < 7) return "#0369a1";
  if (days < 30) return "#047857";
  if (days < 180) return "#6d28d9";
  return "#be185d";
}

const CENTER_LABELS: Record<CenterName, string> = Object.fromEntries(
  CENTERS.map(c => [c.id, c.label]),
) as Record<CenterName, string>;

// A short colored segment that grows outward from the transiting gate's exact
// position, along the real channel wire, toward the specific gate it's reaching
// for — length shows how far through the transit we are, direction shows what
// it's heading toward.
function reachSegment(from: { x: number; y: number }, to: { x: number; y: number }, progress: number, reachPx = 94) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const startOffset = 16;
  const tipOffset = startOffset + reachPx * Math.max(0.06, progress);
  return {
    x1: from.x + ux * startOffset, y1: from.y + uy * startOffset,
    x2: from.x + ux * tipOffset, y2: from.y + uy * tipOffset,
  };
}

// Roughly the centroid of the whole figure (near the G center) — chips radiate
// outward from here so they land clear of the graph's dense middle.
const GRAPH_CENTER = { x: 425, y: 660 };
const PILL_W = 62, PILL_H = 27;

interface Box { x1: number; y1: number; x2: number; y2: number }
function boxesOverlap(a: Box, b: Box): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}
function pillBox(cx: number, cy: number): Box {
  return { x1: cx - PILL_W / 2, y1: cy - PILL_H / 2, x2: cx + PILL_W / 2, y2: cy + PILL_H / 2 };
}

// All 64 gate badges as fixed obstacles chips must clear.
const GATE_BADGE_BOXES: Box[] = Object.values(GATE_POSITIONS).map(p => ({
  x1: p.x - 13.5, y1: p.y - 13.5, x2: p.x + 13.5, y2: p.y + 13.5,
}));

// Approximate bounding box per center (from its own gates' real positions, with
// padding for the shape's extent beyond them) so chips route around the colored
// shapes too, not just the gate badges sitting on top of them.
const CENTER_BOUNDING_BOXES: Box[] = (() => {
  const gatesByCenter = new Map<CenterName, number[]>();
  for (const ch of CHANNELS) {
    gatesByCenter.set(ch.center1, [...(gatesByCenter.get(ch.center1) ?? []), ch.gate1]);
    gatesByCenter.set(ch.center2, [...(gatesByCenter.get(ch.center2) ?? []), ch.gate2]);
  }
  // Generous padding: shape vertices (esp. triangle/diamond points) extend
  // further than any gate sitting inside them, so the box must overshoot.
  const pad = 95;
  return [...gatesByCenter.values()].map(gates => {
    const pts = gates.map(g => GATE_POSITIONS[g]);
    return {
      x1: Math.min(...pts.map(p => p.x)) - pad, y1: Math.min(...pts.map(p => p.y)) - pad,
      x2: Math.max(...pts.map(p => p.x)) + pad, y2: Math.max(...pts.map(p => p.y)) + pad,
    };
  });
})();

const CHIP_OBSTACLES: Box[] = [...GATE_BADGE_BOXES, ...CENTER_BOUNDING_BOXES];

// Places each transit's chip along the ray from the graph's center through its
// gate, pushing outward (and trying a few angular nudges) until it clears every
// gate badge and every previously-placed chip — a real collision-avoidance pass
// instead of a fixed offset that happens to land on top of something.
function layoutChips(transits: TransitDuration[]): Map<string, { x: number; y: number }> {
  const placed: Box[] = [];
  const positions = new Map<string, { x: number; y: number }>();

  for (const t of transits) {
    const gatePos = GATE_POSITIONS[t.gate];
    const dx0 = gatePos.x - GRAPH_CENTER.x, dy0 = gatePos.y - GRAPH_CENTER.y;
    const baseAngle = Math.atan2(dy0, dx0);
    let best: { x: number; y: number } | null = null;

    outer:
    for (const distance of [62, 78, 94, 112, 132, 154, 180, 210]) {
      for (const angleOffset of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]) {
        const angle = baseAngle + angleOffset;
        const cand = { x: gatePos.x + Math.cos(angle) * distance, y: gatePos.y + Math.sin(angle) * distance };
        const box = pillBox(cand.x, cand.y);
        const collides = CHIP_OBSTACLES.some(b => boxesOverlap(box, b)) || placed.some(b => boxesOverlap(box, b));
        if (!collides) { best = cand; break outer; }
      }
    }
    // Fall back to the simple outward point if nothing ever cleared — still better than nothing.
    const finalPos = best ?? { x: gatePos.x + (dx0 / (Math.hypot(dx0, dy0) || 1)) * 62, y: gatePos.y + (dy0 / (Math.hypot(dx0, dy0) || 1)) * 62 };
    positions.set(t.body, finalPos);
    placed.push(pillBox(finalPos.x, finalPos.y));
  }
  return positions;
}

// A glyph+duration "chip" for each currently-transiting body, connected to its
// exact gate with a thin leader line. Uses the same planet glyph and timescale
// color shown in the list below, so a row there can be matched to a spot here
// at a glance — no gate numbers to read or match up.
function TransitChip({ transit, pos }: { transit: TransitDuration; pos: { x: number; y: number } }) {
  const gatePos = GATE_POSITIONS[transit.gate];
  const { x, y } = pos;
  const color = timescaleColor(transit.remainingMs);
  const glyph = PLANET_LABELS[transit.body] ?? "?";
  const durationLabel = transit.remainingMs !== null ? formatDuration(transit.remainingMs) : "?";
  const pillWidth = PILL_W, pillHeight = PILL_H;

  return (
    <g>
      <line x1={gatePos.x} y1={gatePos.y} x2={x} y2={y} stroke={color} strokeWidth={2} opacity={0.75} />
      <rect x={x - pillWidth / 2} y={y - pillHeight / 2} width={pillWidth} height={pillHeight} rx={13.5}
        fill="var(--gate-badge-bg, #f8fafc)" stroke={color} strokeWidth={3} />
      <text x={x - pillWidth / 2 + 17} y={y} textAnchor="middle" dominantBaseline="central" fontSize={18}
        fontFamily="'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif"
        fill="var(--transit-chip-text, #1a1a2e)">
        {glyph}
      </text>
      <text x={x + 10} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}
        fill={timescaleColorOnLight(transit.remainingMs)}>
        {durationLabel}
      </text>
      <title>{PLANET_NAMES[transit.body] ?? transit.body} — Gate {transit.gate}.{transit.line} — {durationLabel} left</title>
    </g>
  );
}

// Dim, short, dashed: this gate is active but its channel partner isn't, so
// nothing is completing today — it's just "reaching" without landing on anything.
function TransitReachLine({
  from, to, fromLabel, toLabel, transit,
}: { from: { x: number; y: number }; to: { x: number; y: number }; fromLabel: string; toLabel: string; transit: TransitDuration }) {
  const color = timescaleColor(transit.remainingMs);
  const progress = transit.progress ?? 0;
  const { x1, y1, x2, y2 } = reachSegment(from, to, progress);
  const remainingLabel = transit.remainingMs !== null ? formatDuration(transit.remainingMs) : "?";
  return (
    <g opacity={0.5}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 6" />
      <circle cx={x2} cy={y2} r={5.5} fill={color} />
      <title>
        {PLANET_NAMES[transit.body] ?? transit.body} in Gate {transit.gate}.{transit.line} — {remainingLabel} left.
        Reaching from {fromLabel} toward {toLabel}, but not completing a channel (the other gate isn't active).
      </title>
    </g>
  );
}

export default function BodyGraph({ chart, transits = [] }: Props) {
  const { definedCenters, definedChannels, activations } = chart;

  const transitByGate = new Map<number, TransitDuration[]>();
  for (const t of transits) {
    const list = transitByGate.get(t.gate) ?? [];
    list.push(t);
    transitByGate.set(t.gate, list);
  }

  // Map gate → activations (personality = black, design = red)
  const gateActivations = new Map<number, { personality: string | null; design: string | null }>();
  for (const act of activations) {
    const existing = gateActivations.get(act.gate) ?? { personality: null, design: null };
    if (act.isPersonality) {
      existing.personality = PLANET_LABELS[act.planet] ?? act.planet;
    } else {
      existing.design = PLANET_LABELS[act.planet] ?? act.planet;
    }
    gateActivations.set(act.gate, existing);
  }

  // A gate counts as "active today" if it's activated natally (personality or
  // design) OR a planet is transiting through it right now — either can complete
  // a channel with a transiting gate on the other end.
  const activeGateSet = new Set<number>([...gateActivations.keys(), ...transitByGate.keys()]);
  const chipPositions = layoutChips(transits);

  // Centers that are "live" today: natally defined, or made live by a transit
  // completing one of their channels (matches how MyBodyGraph's Transit Chart
  // colors centers — natal + today's transits combined, not natal alone).
  const liveCenters = new Set<CenterName>(definedCenters);
  for (const ch of CHANNELS) {
    const g1Live = (transitByGate.get(ch.gate1)?.length ?? 0) > 0 && activeGateSet.has(ch.gate2);
    const g2Live = (transitByGate.get(ch.gate2)?.length ?? 0) > 0 && activeGateSet.has(ch.gate1);
    if (g1Live || g2Live) {
      liveCenters.add(ch.center1);
      liveCenters.add(ch.center2);
    }
  }

  function soonestTransit(list: TransitDuration[]): TransitDuration {
    return [...list].sort((a, b) => (a.remainingMs ?? Infinity) - (b.remainingMs ?? Infinity))[0];
  }

  // A gate "completes" something today if any of its channel(s) has an active partner.
  function completedChannelNames(gate: number): string[] {
    return CHANNELS.filter(ch => {
      const partner = ch.gate1 === gate ? ch.gate2 : ch.gate2 === gate ? ch.gate1 : null;
      return partner !== null && activeGateSet.has(partner);
    }).map(ch => ch.name);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={VIEW_BOX} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }}
        aria-label="Human Design bodygraph">

        {/* Body silhouette, behind everything, grounding the centers as a figure
            instead of leaving them floating on bare background. */}
        <path d={BODY_SILHOUETTE_PATH} fill="var(--bodygraph-silhouette, #151d33)" opacity={0.65} />

        {/* Channel lines, drawn precisely between each channel's two real gate positions */}
        {CHANNELS.map((ch, i) => {
          const p1 = GATE_POSITIONS[ch.gate1];
          const p2 = GATE_POSITIONS[ch.gate2];
          const isDefined = !!definedChannels.find(dc => dc.gate1 === ch.gate1 && dc.gate2 === ch.gate2);

          const g1Transits = transitByGate.get(ch.gate1) ?? [];
          const g2Transits = transitByGate.get(ch.gate2) ?? [];

          // A transit "completes" this channel today if the gate it's hitting has
          // an active partner on the other end (natal or also-transiting).
          const g1Completes = g1Transits.length > 0 && activeGateSet.has(ch.gate2);
          const g2Completes = g2Transits.length > 0 && activeGateSet.has(ch.gate1);
          const isLiveToday = g1Completes || g2Completes;
          const leadTransit = isLiveToday
            ? soonestTransit([...(g1Completes ? g1Transits : []), ...(g2Completes ? g2Transits : [])])
            : null;

          // Defined channels render as a thick "cord" (a colored base stroke plus a
          // thinner light highlight down the middle, giving a rope/tube look), colored
          // by whichever activation type completes it. Undefined channels are nearly
          // invisible — the reference shows only real connections, not all 36 potential
          // ones, which is what was producing the "spaghetti" look before.
          const g1Act = gateActivations.get(ch.gate1);
          const g2Act = gateActivations.get(ch.gate2);
          const isPersonalityCord = (g1Act?.personality != null) || (g2Act?.personality != null);
          const cordColor = isPersonalityCord ? "var(--cord-personality, #ece4d3)" : "var(--cord-design, #c0392b)";

          return (
            <g key={i}>
              {/* Main channel wire, connecting the exact gate positions */}
              {isDefined ? (
                <>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={cordColor} strokeWidth={11} strokeLinecap="round" />
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
                </>
              ) : (
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--channel-open, #2c3860)" strokeWidth={2} opacity={0.18} />
              )}

              {/* Live transit indicators: a full glowing line when the transit actually
                  completes this channel today, otherwise a short dim "reaching" nub
                  growing from the transiting gate toward its specific partner. */}
              {isLiveToday && leadTransit ? (
                <g>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={timescaleColor(leadTransit.remainingMs)} strokeWidth={8}
                    strokeDasharray="16 10" opacity={0.95} strokeLinecap="round" />
                  <title>
                    {[...(g1Completes ? g1Transits : []), ...(g2Completes ? g2Transits : [])]
                      .map(t => `${PLANET_NAMES[t.body] ?? t.body} (Gate ${t.gate}.${t.line}, ${t.remainingMs !== null ? formatDuration(t.remainingMs) : "?"} left)`)
                      .join(" + ")} completing the {CENTER_LABELS[ch.center1]}–{CENTER_LABELS[ch.center2]} channel today
                  </title>
                </g>
              ) : (
                <>
                  {g1Transits.map(t => (
                    <TransitReachLine key={t.body} from={p1} to={p2}
                      fromLabel={CENTER_LABELS[ch.center1]} toLabel={CENTER_LABELS[ch.center2]}
                      transit={t} />
                  ))}
                  {g2Transits.map(t => (
                    <TransitReachLine key={t.body} from={p2} to={p1}
                      fromLabel={CENTER_LABELS[ch.center2]} toLabel={CENTER_LABELS[ch.center1]}
                      transit={t} />
                  ))}
                </>
              )}
            </g>
          );
        })}

        {/* Centers */}
        {CENTERS.map(center => renderCenter(center, liveCenters.has(center.id)))}

        {/* Gate numbers, each at its real canonical position (rendered once per gate) */}
        {Object.entries(GATE_POSITIONS).map(([gateStr, pos]) => {
          const gate = Number(gateStr);
          return (
            <GateNumberBadge key={gate} x={pos.x} y={pos.y} gate={gate}
              active={activeGateSet.has(gate)} />
          );
        })}

        {/* Glyph + duration chips for today's transits, on top of everything else */}
        {transits.map(t => {
          const p = chipPositions.get(t.body);
          if (!p) {
            console.error("MISSING CHIP POSITION for", t.body, "gate", t.gate, "chipPositions keys:", [...chipPositions.keys()], "transits bodies:", transits.map(x => x.body));
            return null;
          }
          return <TransitChip key={t.body} transit={t} pos={p} />;
        })}
      </svg>

      {transits.length > 0 && (
        <div style={{
          display: "flex", justifyContent: "center", gap: 18, marginTop: 10,
          fontSize: 10.5, color: "var(--text-muted)", flexWrap: "wrap",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="20" height="6"><line x1="1" y1="3" x2="19" y2="3" stroke="var(--transit-days, #38bdf8)" strokeWidth="3" strokeDasharray="5 3" /></svg>
            completing a channel today
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.6 }}>
            <svg width="20" height="6"><line x1="1" y1="3" x2="12" y2="3" stroke="var(--transit-days, #38bdf8)" strokeWidth="2" strokeDasharray="1.5 2" /></svg>
            active gate, nothing completed
          </span>
        </div>
      )}

      {/* Live transits, soonest-to-change first */}
      {transits.length > 0 && (
        <div style={{ marginTop: 18, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          <h3 style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase",
            color: "var(--text-muted)", textAlign: "left", marginBottom: 8 }}>
            Live Gate Transits
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...transits]
              .sort((a, b) => (a.remainingMs ?? Infinity) - (b.remainingMs ?? Infinity))
              .map(t => {
                const completes = completedChannelNames(t.gate);
                return (
                <div key={t.body} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, color: "var(--text-main)",
                  padding: "5px 8px", borderRadius: 6, background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                }}>
                  <span style={{ width: 14, textAlign: "center", fontFamily: "'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif" }}>{PLANET_LABELS[t.body] ?? t.body}</span>
                  <span style={{ flex: 1, textAlign: "left", color: "var(--text-muted)" }}>
                    {PLANET_NAMES[t.body] ?? t.body} — Gate {t.gate}.{t.line}
                    {completes.length > 0 && (
                      <span style={{ color: "var(--transit-days, #38bdf8)", fontWeight: 600 }}> · completes {completes.join(", ")}</span>
                    )}
                  </span>
                  <span style={{
                    fontWeight: 600, fontSize: 11,
                    color: timescaleColor(t.remainingMs),
                  }}>
                    {t.remainingMs !== null ? `${formatDuration(t.remainingMs)} left` : "unknown"}
                  </span>
                </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Gate activation table */}
      <div style={{ marginTop: 12, fontSize: 12, overflowX: "auto" }}>
        <table style={{ margin: "0 auto", borderCollapse: "collapse", textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ padding: "2px 8px", color: "var(--text-muted)" }}>Planet</th>
              <th style={{ padding: "2px 8px", color: "var(--personality-gate, #e2e8f0)" }}>Personality ◆</th>
              <th style={{ padding: "2px 8px", color: "var(--design-gate, #ef4444)" }}>Design ◇</th>
            </tr>
          </thead>
          <tbody>
            {["sun","earth","moon","northnode","southnode","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"].map(planet => {
              const pAct = activations.find(a => a.planet === planet && a.isPersonality);
              const dAct = activations.find(a => a.planet === planet && !a.isPersonality);
              return (
                <tr key={planet}>
                  <td style={{ padding: "2px 8px", color: "var(--text-muted)" }}>
                    {PLANET_LABELS[planet] ?? planet}
                  </td>
                  <td style={{ padding: "2px 8px", color: "var(--personality-gate, #e2e8f0)" }}>
                    {pAct ? `${pAct.gate}.${pAct.line}` : "—"}
                  </td>
                  <td style={{ padding: "2px 8px", color: "var(--design-gate, #ef4444)" }}>
                    {dAct ? `${dAct.gate}.${dAct.line}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
