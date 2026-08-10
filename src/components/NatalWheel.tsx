import { useRef, useState } from "react";
import type { NatalChart, PlanetData } from "../lib/natalChart";

interface TransitBody extends PlanetData {}

interface Props {
  chart: NatalChart;
  transitBodies?: TransitBody[];
}

// Unicode astrological glyphs
const PLANET_GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
  chiron: "⚷", northnode: "☊", southnode: "☋", lilith: "⚸",
};

const SIGN_GLYPH: Record<string, string> = {
  aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋", leo: "♌", virgo: "♍",
  libra: "♎", scorpio: "♏", sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
};

const SIGN_ORDER = [
  "aries","taurus","gemini","cancer","leo","virgo",
  "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
];

const ASPECT_COLOR: Record<string, string> = {
  conjunction: "#f59e0b",
  opposition: "#ef4444",
  square: "#f97316",
  trine: "#3b82f6",
  sextile: "#22c55e",
};

const ASPECT_VERB: Record<string, string> = {
  conjunction: "merges with",
  opposition: "opposes",
  square: "squares",
  trine: "trines",
  sextile: "sextiles",
};

// Major aspects checked for transit-to-natal lines (kept separate from the
// natal-natal aspects the ephemeris library computes, since those only cover
// birth-chart pairs).
const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};
const ASPECT_ORB = 4.5;

const CX = 200, CY = 200; // center
const R_OUTER = 180;  // outer sign ring
const R_SIGN_IN = 155; // inner sign ring
const R_HOUSE = 150;  // house ring outer
const R_HOUSE_IN = 130; // house ring inner
const R_PLANET = 115; // natal planet glyph ring
const R_TICK = 128;   // natal planet true-degree tick (leader line start)
const R_ASPECT = 90;  // aspect lines end here (inner circle)
const R_TRANSIT_TICK = 191; // transit true-degree tick, just outside the wheel
const R_TRANSIT = 214;      // transit planet glyph ring

function toXY(angleDeg: number, r: number, cx = CX, cy = CY) {
  // 0° horizon is at the left (9-o'clock), going counter-clockwise
  const rad = ((-angleDeg + 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function signStartHorizonDeg(signKey: string, ascendantDeg: number): number {
  const signIndex = SIGN_ORDER.indexOf(signKey);
  const signEcliptic = signIndex * 30;
  // Convert ecliptic to horizon: horizon = ecliptic - ascendant (both ecliptic)
  return ((signEcliptic - ascendantDeg) + 360) % 360;
}

// When two or more bodies land close enough together that their glyphs would
// overlap, spread their DISPLAY angle apart (evenly, minimally) while leaving
// the body's true `horizonDeg` untouched — the true position still gets a tick
// mark and a short leader line to the shifted glyph, so nothing is lost, it's
// just legible. Treated as a line (not circular) plus one wraparound check,
// which converges cleanly for the handful of bodies on a chart.
function resolveDisplayAngles<T extends { horizonDeg: number }>(bodies: T[], minSepDeg: number): (T & { displayDeg: number })[] {
  if (bodies.length === 0) return [];
  const sorted = [...bodies].sort((a, b) => a.horizonDeg - b.horizonDeg);
  const n = sorted.length;
  const display = sorted.map(b => b.horizonDeg);
  for (let iter = 0; iter < 300; iter++) {
    let moved = false;
    for (let i = 0; i < n - 1; i++) {
      const diff = display[i + 1] - display[i];
      if (diff < minSepDeg) {
        const shift = (minSepDeg - diff) / 2;
        display[i] -= shift;
        display[i + 1] += shift;
        moved = true;
      }
    }
    const wrapDiff = (display[0] + 360) - display[n - 1];
    if (wrapDiff < minSepDeg) {
      const shift = (minSepDeg - wrapDiff) / 2;
      display[0] += shift;
      display[n - 1] -= shift;
      moved = true;
    }
    if (!moved) break;
  }
  return sorted.map((b, i) => ({ ...b, displayDeg: ((display[i] % 360) + 360) % 360 }));
}

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(((a - b) + 540) % 360 - 180);
  return diff;
}

// Unique hover id for a body: distinguishes a natal point from a transiting
// body that happens to share the same key (e.g. natal Sun vs. transiting Sun).
function hoverId(source: "natal" | "transit", key: string): string {
  return `${source}:${key}`;
}

function degreeInSignLabel(body: PlanetData): string {
  const inSign = ((body.eclipticDeg % 30) + 30) % 30;
  const deg = Math.floor(inSign);
  const min = Math.round((inSign - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}' ${body.signLabel}`;
}

export default function NatalWheel({ chart, transitBodies = [] }: Props) {
  const { ascendantDeg, planets, points, houses, aspects } = chart;

  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; detail: string } | null>(null);

  // Tooltip position is anchored to the hovered element's own on-screen
  // position, captured once on enter — NOT tracked on every mousemove. A
  // mouse-following tooltip forces a full re-render on every pixel of motion,
  // which (combined with tightly-packed glyphs) read as the wheel "jittering"
  // as hover state flickered between neighboring bodies.
  function showTooltip(e: React.MouseEvent, source: "natal" | "transit", body: PlanetData) {
    setHovered(hoverId(source, body.key));
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as SVGGraphicsElement).getBoundingClientRect();
    const title = `${body.label}${body.isRetrograde ? " ℞" : ""}`;
    const detail = source === "transit"
      ? `${degreeInSignLabel(body)} · Transit`
      : `${degreeInSignLabel(body)} · House ${body.houseId}`;
    setTooltip({
      x: containerRect ? targetRect.left + targetRect.width / 2 - containerRect.left : 0,
      y: containerRect ? targetRect.top - containerRect.top : 0,
      title, detail,
    });
  }
  function hideTooltip() {
    setHovered(null);
    setTooltip(null);
  }

  // Dim any line not touching the hovered body; leave everything at normal
  // opacity when nothing is hovered.
  function lineEmphasis(related: boolean, baseOpacity: number, baseWidth: number) {
    if (!hovered) return { opacity: baseOpacity, width: baseWidth };
    return related
      ? { opacity: Math.min(1, baseOpacity + 0.3), width: baseWidth + 0.4 }
      : { opacity: 0.04, width: baseWidth };
  }

  // Build sign sectors (each sign = 30° of ecliptic mapped to horizon)
  const signSectors = SIGN_ORDER.map((signKey) => {
    const startHorizon = signStartHorizonDeg(signKey, ascendantDeg);
    return { signKey, startHorizon };
  });

  // House cusp lines
  const houseCusps = houses.map(h => ({
    id: h.id,
    horizonDeg: h.startHorizon,
  }));

  // Collect all planets + points for rendering
  const allBodies = [...planets, ...points];
  const natalDisplay = resolveDisplayAngles(allBodies, 8);

  // Transit bodies arrive with a `horizonDeg` computed relative to whatever
  // ascendant their own "chart" happened to get (irrelevant here — a transit
  // "chart" built for lat/long 0 has no meaningful houses). Re-derive it from
  // the absolute `eclipticDeg` against the NATAL ascendant instead, so it
  // lands in the same reference frame as everything else on this wheel.
  const transitOnNatalFrame = transitBodies.map(b => ({
    ...b, horizonDeg: ((b.eclipticDeg - ascendantDeg) + 360) % 360,
  }));
  const transitDisplay = resolveDisplayAngles(transitOnNatalFrame, 8);

  // Transit → natal aspects: not something the ephemeris library computes (it
  // only pairs up birth-chart bodies with each other), so found directly here.
  const transitAspects = transitDisplay.flatMap(t => {
    const hits: { transit: typeof t; natal: PlanetData; aspectKey: string; orb: number }[] = [];
    for (const n of allBodies) {
      for (const [aspectKey, angle] of Object.entries(ASPECT_ANGLES)) {
        const sep = angularSeparation(t.horizonDeg, n.horizonDeg);
        const orb = Math.abs(sep - angle);
        if (orb <= ASPECT_ORB) {
          hits.push({ transit: t, natal: n, aspectKey, orb });
        }
      }
    }
    return hits;
  });

  // Aspect list for whichever body is currently hovered — natal-natal aspects
  // plus transit-to-natal aspects touching it, shown as a detail panel below
  // the wheel (same headline/detail shape as the "Today" transit cards).
  const relationships: { key: string; color: string; headline: string; detail: string }[] = [];
  if (hovered) {
    for (const asp of aspects) {
      const matchesP1 = hovered === hoverId("natal", asp.point1Key);
      const matchesP2 = hovered === hoverId("natal", asp.point2Key);
      if (!matchesP1 && !matchesP2) continue;
      relationships.push({
        key: `n-${asp.point1Key}-${asp.point2Key}-${asp.aspectKey}`,
        color: ASPECT_COLOR[asp.aspectKey] ?? "#64748b",
        headline: `${asp.point1Label} ${ASPECT_VERB[asp.aspectKey] ?? asp.aspectLabel} ${asp.point2Label}`,
        detail: `Natal aspect · orb ${asp.orb.toFixed(2)}°`,
      });
    }
    for (const hit of transitAspects) {
      const matchesTransit = hovered === hoverId("transit", hit.transit.key);
      const matchesNatal = hovered === hoverId("natal", hit.natal.key);
      if (!matchesTransit && !matchesNatal) continue;
      relationships.push({
        key: `t-${hit.transit.key}-${hit.natal.key}-${hit.aspectKey}`,
        color: ASPECT_COLOR[hit.aspectKey] ?? "#64748b",
        headline: `Transiting ${hit.transit.label} ${ASPECT_VERB[hit.aspectKey] ?? hit.aspectKey} natal ${hit.natal.label}`,
        detail: `${degreeInSignLabel(hit.transit)} · orb ${hit.orb.toFixed(2)}°`,
      });
    }
  }

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
    <div ref={containerRef} style={{ position: "relative", width: 560, maxWidth: "100%", flexShrink: 0 }}>
    <svg
      viewBox="-40 -40 480 480"
      style={{ width: "100%", display: "block" }}
      aria-label="Natal astrology wheel"
    >
      {/* Outer circle */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="var(--wheel-bg, #0f172a)" stroke="var(--wheel-border, #334155)" strokeWidth={1.5} />

      {/* Sign sectors */}
      {signSectors.map(({ signKey, startHorizon }) => {
        const s1 = toXY(startHorizon, R_OUTER);
        const s2 = toXY(startHorizon, R_SIGN_IN);
        // Spoke line at each sign cusp
        return (
          <g key={signKey}>
            <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y}
              stroke="var(--wheel-border, #334155)" strokeWidth={0.8} />
          </g>
        );
      })}

      {/* Sign glyphs in the sign ring */}
      {signSectors.map(({ signKey, startHorizon }, i) => {
        const nextStart = signSectors[(i + 1) % 12].startHorizon;
        // Midpoint of the sign sector (handle wrap-around)
        let span = ((nextStart - startHorizon) + 360) % 360;
        const midHorizon = (startHorizon + span / 2) % 360;
        const R_GLYPH = (R_OUTER + R_SIGN_IN) / 2;
        const pos = toXY(midHorizon, R_GLYPH);
        const alternating = i % 2 === 0 ? "var(--sign-fg1, #94a3b8)" : "var(--sign-fg2, #64748b)";
        return (
          <text key={signKey} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
            fontSize={13} fill={alternating} fontFamily="'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif">
            {SIGN_GLYPH[signKey] ?? signKey.slice(0, 3)}
          </text>
        );
      })}

      {/* Sign ring inner border */}
      <circle cx={CX} cy={CY} r={R_SIGN_IN} fill="none" stroke="var(--wheel-border, #334155)" strokeWidth={1} />

      {/* House ring */}
      <circle cx={CX} cy={CY} r={R_HOUSE_IN} fill="var(--house-bg, #1e293b)" stroke="var(--wheel-border, #334155)" strokeWidth={1} />

      {/* House cusp lines and numbers */}
      {houseCusps.map(({ id, horizonDeg }) => {
        const outer = toXY(horizonDeg, R_HOUSE);
        const inner = toXY(horizonDeg, R_HOUSE_IN);
        const isAngular = [1, 4, 7, 10].includes(id);
        const nextId = id === 12 ? 1 : id + 1;
        const nextCusp = houseCusps.find(h => h.id === nextId);
        const nextDeg = nextCusp?.horizonDeg ?? 0;
        let span = ((nextDeg - horizonDeg) + 360) % 360;
        const midHorizon = (horizonDeg + span / 2) % 360;
        const numPos = toXY(midHorizon, (R_HOUSE + R_HOUSE_IN) / 2);
        return (
          <g key={id}>
            <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke={isAngular ? "var(--angular-color, #60a5fa)" : "var(--wheel-border, #475569)"}
              strokeWidth={isAngular ? 1.5 : 0.8} />
            <text x={numPos.x} y={numPos.y} textAnchor="middle" dominantBaseline="central"
              fontSize={9} fill="var(--house-num, #94a3b8)">
              {id}
            </text>
          </g>
        );
      })}

      {/* Natal aspect lines in center */}
      {aspects.map((asp, i) => {
        const p1 = allBodies.find(b => b.key === asp.point1Key);
        const p2 = allBodies.find(b => b.key === asp.point2Key);
        if (!p1 || !p2) return null;
        const a1 = toXY(p1.horizonDeg, R_ASPECT);
        const a2 = toXY(p2.horizonDeg, R_ASPECT);
        const color = ASPECT_COLOR[asp.aspectKey] ?? "#64748b";
        const isMajor = asp.aspectLevel === "major";
        const related = hovered === hoverId("natal", p1.key) || hovered === hoverId("natal", p2.key);
        const em = lineEmphasis(related, 0.7, isMajor ? 0.9 : 0.5);
        return (
          <line key={`asp-${i}`} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
            stroke={color} strokeWidth={em.width} strokeOpacity={em.opacity} />
        );
      })}

      {/* Inner circle fill */}
      <circle cx={CX} cy={CY} r={R_ASPECT} fill="var(--wheel-inner, #0f172a)" stroke="var(--wheel-border, #334155)" strokeWidth={1} />

      {/* Ascendant / Descendant axis */}
      <line x1={toXY(0, R_HOUSE_IN).x} y1={toXY(0, R_HOUSE_IN).y}
            x2={toXY(180, R_HOUSE_IN).x} y2={toXY(180, R_HOUSE_IN).y}
        stroke="var(--angular-color, #60a5fa)" strokeWidth={1.2} />
      {/* MC / IC axis */}
      {(() => {
        const mcHorizon = ((chart.midheavenDeg - chart.ascendantDeg) + 360) % 360;
        return (
          <line x1={toXY(mcHorizon, R_HOUSE_IN).x} y1={toXY(mcHorizon, R_HOUSE_IN).y}
                x2={toXY((mcHorizon + 180) % 360, R_HOUSE_IN).x} y2={toXY((mcHorizon + 180) % 360, R_HOUSE_IN).y}
            stroke="var(--angular-color, #60a5fa)" strokeWidth={1.2} />
        );
      })()}

      {/* Natal planet leader lines + tick marks, for any glyph nudged apart from its true degree */}
      {natalDisplay.map(body => {
        if (Math.abs(body.displayDeg - body.horizonDeg) < 0.3) return null;
        const tick = toXY(body.horizonDeg, R_TICK);
        const glyphPos = toXY(body.displayDeg, R_PLANET + 8);
        return (
          <line key={`tick-${body.key}`} x1={tick.x} y1={tick.y} x2={glyphPos.x} y2={glyphPos.y}
            stroke="var(--text-muted, #64748b)" strokeWidth={0.5} opacity={0.6} />
        );
      })}

      {/* Natal planets, spread apart where they'd otherwise overlap */}
      {natalDisplay.map(body => {
        const glyph = PLANET_GLYPH[body.key] ?? body.label.slice(0, 2);
        const pos = toXY(body.displayDeg, R_PLANET);
        const isRetro = body.isRetrograde;
        const isHovered = hovered === hoverId("natal", body.key);
        return (
          <g key={body.key}
            onMouseEnter={e => showTooltip(e, "natal", body)}
            onMouseLeave={hideTooltip}
            style={{ cursor: "pointer" }}>
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r={7} fill="var(--planet-fg, #e2e8f0)" opacity={0.15} />
            )}
            {/* Hit-circle radius is capped below half the minimum glyph spacing
                (8° at R_PLANET ≈ 16px) so neighboring bodies' hit areas never
                overlap — overlap was the source of hover flicker between them. */}
            <circle cx={pos.x} cy={pos.y} r={7} fill="transparent" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" pointerEvents="none"
              fontSize={14} fill={isRetro ? "var(--retro-color, #f87171)" : "var(--planet-fg, #e2e8f0)"}
              fontFamily="'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif">
              {glyph}
            </text>
            {isRetro && (
              <text x={pos.x + 9} y={pos.y - 6} fontSize={7} fill="var(--retro-color, #f87171)" pointerEvents="none">R</text>
            )}
          </g>
        );
      })}

      {/* AC / DC / MC / IC labels */}
      {[
        { label: "AC", horizonDeg: 0 },
        { label: "DC", horizonDeg: 180 },
        { label: "MC", horizonDeg: ((chart.midheavenDeg - chart.ascendantDeg + 360) % 360) },
        { label: "IC", horizonDeg: ((chart.midheavenDeg - chart.ascendantDeg + 360 + 180) % 360) },
      ].map(({ label, horizonDeg }) => {
        const pos = toXY(horizonDeg, R_OUTER - 10);
        return (
          <text key={label} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
            fontSize={9} fontWeight="bold" fill="var(--angular-label, #93c5fd)">
            {label}
          </text>
        );
      })}

      {/* Transit → natal aspect lines. Both endpoints project onto the same
          inner circle the natal-natal aspects use, instead of spanning all the
          way out to the transit ring — keeps the lines confined to the center
          (matching the reference chart) rather than a long-spoked starburst. */}
      {transitAspects.map((hit, i) => {
        const a1 = toXY(hit.transit.horizonDeg, R_ASPECT);
        const a2 = toXY(hit.natal.horizonDeg, R_ASPECT);
        const color = ASPECT_COLOR[hit.aspectKey] ?? "#64748b";
        const related = hovered === hoverId("transit", hit.transit.key) || hovered === hoverId("natal", hit.natal.key);
        const em = lineEmphasis(related, 0.55, 0.7);
        return (
          <line key={`tasp-${i}`} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
            stroke={color} strokeWidth={em.width} strokeOpacity={em.opacity} strokeDasharray="2.5 2" />
        );
      })}

      {/* Transit ring: true-degree ticks just outside the wheel */}
      {transitDisplay.map(body => {
        const tickOuter = toXY(body.horizonDeg, R_TRANSIT_TICK);
        const tickInner = toXY(body.horizonDeg, R_OUTER + 2);
        return (
          <line key={`ttick-${body.key}`} x1={tickInner.x} y1={tickInner.y} x2={tickOuter.x} y2={tickOuter.y}
            stroke="var(--text-muted, #64748b)" strokeWidth={0.6} opacity={0.7} />
        );
      })}

      {/* Transit leader lines, where a glyph was nudged apart from its true degree */}
      {transitDisplay.map(body => {
        if (Math.abs(body.displayDeg - body.horizonDeg) < 0.3) return null;
        const tick = toXY(body.horizonDeg, R_TRANSIT_TICK);
        const glyphPos = toXY(body.displayDeg, R_TRANSIT - 9);
        return (
          <line key={`tlead-${body.key}`} x1={tick.x} y1={tick.y} x2={glyphPos.x} y2={glyphPos.y}
            stroke="var(--text-muted, #64748b)" strokeWidth={0.5} opacity={0.6} />
        );
      })}

      {/* Transit planet glyphs */}
      {transitDisplay.map(body => {
        const glyph = PLANET_GLYPH[body.key] ?? body.label.slice(0, 2);
        const pos = toXY(body.displayDeg, R_TRANSIT);
        const isRetro = body.isRetrograde;
        const isHovered = hovered === hoverId("transit", body.key);
        return (
          <g key={`t-${body.key}`}
            onMouseEnter={e => showTooltip(e, "transit", body)}
            onMouseLeave={hideTooltip}
            style={{ cursor: "pointer" }}>
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r={12} fill="var(--transit-ring-color, #38bdf8)" opacity={0.2} />
            )}
            <circle cx={pos.x} cy={pos.y} r={9} fill="var(--wheel-bg, #0f172a)" stroke="var(--transit-ring-color, #38bdf8)" strokeWidth={1} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" pointerEvents="none"
              fontSize={11} fill={isRetro ? "var(--retro-color, #f87171)" : "var(--transit-ring-color, #38bdf8)"}
              fontFamily="'Segoe UI Symbol', 'Segoe UI Historic', 'Noto Sans Symbols', 'Noto Sans Symbols 2', serif">
              {glyph}
            </text>
            {isRetro && (
              <text x={pos.x + 8} y={pos.y - 7} fontSize={6} fill="var(--retro-color, #f87171)" pointerEvents="none">R</text>
            )}
          </g>
        );
      })}
    </svg>
    {tooltip && (
      <div style={{
        position: "absolute", left: tooltip.x, top: tooltip.y,
        transform: "translate(-50%, calc(-100% - 10px))",
        background: "var(--card-bg, #1e293b)", border: "1px solid var(--card-border, #334155)",
        borderRadius: 6, padding: "6px 10px", fontSize: 12, lineHeight: 1.5,
        color: "var(--text-main, #e2e8f0)", pointerEvents: "none", whiteSpace: "nowrap",
        zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}>
        <div style={{ fontWeight: 600 }}>{tooltip.title}</div>
        <div style={{ color: "var(--text-muted, #94a3b8)" }}>{tooltip.detail}</div>
      </div>
    )}
    </div>
    <div style={{ width: 280, maxWidth: "100%", flexShrink: 0, position: "sticky", top: 20 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 10px" }}>
        Aspects
      </h3>
      {hovered ? (
        relationships.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relationships.map(r => (
              <div key={r.key} style={{
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                borderLeft: `3px solid ${r.color}`, borderRadius: 8, padding: "8px 12px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>{r.headline}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.detail}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No aspects within orb for this point.</p>
        )
      ) : (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Hover a planet to see its aspects.</p>
      )}
    </div>
    </div>
  );
}
