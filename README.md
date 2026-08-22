# Chart & Design

A privacy-conscious React application that combines a tropical natal chart,
real-time astrological transits, and a Human Design bodygraph. It ranks current
transits against the saved natal chart and produces one integrated AI synthesis
per day.

The public source repository is
[jgsack/HDAstro](https://github.com/jgsack/HDAstro). The app is configured for
OpenAI Sites; GitHub Pages is not used.

## Features

- Tropical natal chart with whole-sign houses, angles, planets, points, aspects,
  retrograde markers, and a live transit ring.
- Human Design Personality and Design activations, gates, lines, channels,
  centers, Type, Strategy, Profile, and Authority.
- Live Human Design conditioning overlay with gate/line duration estimates and
  channel-completion indicators.
- Current natal aspects with orb, applying/separating phase, and actual
  exact-time detection for the local calendar day.
- One brief daily AI interpretation that synthesizes the strongest astrology
  and Human Design signals instead of listing them separately.
- Birth settings stored only in the browser's `localStorage`.

## Requirements

- Node.js 22.13 or newer (Node 24 LTS is recommended).
- npm, included with Node.js.

## Fresh-clone setup

```powershell
git clone https://github.com/jgsack/HDAstro.git
cd HDAstro
npm ci
npm run dev
```

The development server prints the local URL, normally `http://localhost:3000`.

All required source assets and dependency versions are committed. The public
site needs no API key. A cloud-scheduled ChatGPT task prepares the daily AI
synthesis and publishes it with the site each morning.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm test` | Bundle and run the calculation regression checks. |
| `npm run lint` | Run Oxlint. |
| `npm run build` | Type-check and create the production bundle in `dist/`. |
| `npm run daily:context` | Export the ranked transit context used by the daily AI task. |
| `npm run preview` | Serve the completed production bundle locally. |

Before publishing a change, run:

```powershell
npm test
npm run lint
npm run build
```

## Project map

```text
public/                         Static icons and favicon
scripts/verify-calculations.ts Calculation regression suite
scripts/export-daily-context.ts Daily automation context exporter
data/daily-synthesis.json      Published daily integrated reading
src/App.tsx                    Application shell, tabs, and refresh clock
src/components/                Natal wheel, bodygraph, readings, and settings
src/config/birthData.ts        Default birth data and localStorage persistence
src/lib/natalChart.ts          Natal chart adapter
src/lib/transits.ts            Live aspects, exact times, ranking, and HD gates
src/lib/transitDuration.ts     Ephemeris and HD gate/line duration calculations
src/lib/humanDesign/           Gate mapping, channels, layout, and chart derivation
```

## Calculation conventions

- Natal positions and houses use `circular-natal-horoscope-js`, a tropical
  zodiac, and whole-sign houses. That library derives historical local time from
  the supplied coordinates.
- Live geocentric longitudes and transit durations use `astronomy-engine`.
- Astrology transits include Sun through Pluto plus the mean North and South
  Nodes. Chiron remains available in the natal chart but is not included in the
  live ephemeris because `astronomy-engine` does not supply it.
- Human Design transits use the standard 13 placements: Sun, Earth, Moon, both
  Nodes, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto.
- The Design moment is found at 88 degrees of solar arc before the Personality
  Sun.
- Gate 25 begins at 358.25 degrees ecliptic longitude; each gate spans 5.625
  degrees and each line spans 0.9375 degrees.
- The application refreshes all live views from one timestamp every 15 minutes.
- “Exact today” means an exact longitude crossing was found within the browser's
  local calendar day. It is not merely an orb threshold.

The regression suite covers indirect motor-to-Throat connectivity, Type and
Authority examples, the lunar-node 360/0-degree boundary, and the Human Design
transit-body set. Add a regression case whenever calculation behavior changes.

## Birth data and privacy

This is currently a single-user application. The default birth date, time,
coordinates, and location are committed in `src/config/birthData.ts`; settings
changed in the app are stored under `astro_birth_data` in the current browser.

Because the repository is public, changing the committed default to another
person's data publishes that data. Do not commit secrets, private API keys, or
other sensitive personal information.

## Interpretation layer

The cloud task runs `npm run daily:context` to calculate and rank the current
astrology and Human Design transits for the committed default birth chart. It
then prioritizes, reconciles, and synthesizes the combined pattern into
`data/daily-synthesis.json`, validates the project, commits the new reading to
GitHub, and republishes the existing Sites project. No AI credentials or model
calls are present in the public application.

If browser settings differ from the committed default birth chart, the app
does not show a potentially mismatched synthesis. The live detailed transit
lists continue to use the browser's saved settings.

## Deployment

### OpenAI Sites

The Sites project identity is stored in `.openai/hosting.json`. The supported
vinext, Cloudflare, and Sites build produces the application and its worker entry
at `dist/server/index.js`.

Publishing a new Sites version requires a successful `npm run build`; the Sites
publishing workflow packages the resulting `dist/` directory.

## Repository handoff checklist

A fresh machine needs only the Git repository and a supported Node.js version.
When handing the project to another Codex session, point it to `AGENTS.md` and
this README, then have it run the three verification commands before editing.
