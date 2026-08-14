# HDAstro project guidance

## Scope and authority

- This repository is the complete source for the Chart & Design web app.
- Current source code and explicit user instructions override older Git history
  or assumptions.
- Preserve the user's unrelated work and do not commit generated `dist/` or
  `node_modules/` content.

## Required checks

Run these before handing off or publishing calculation changes:

```powershell
npm test
npm run lint
npm run build
```

Add a case to `scripts/verify-calculations.ts` for every calculation bug fixed.

## Calculation invariants

- Keep all live views on the shared `transitTime` timestamp in `src/App.tsx`.
- Use `astronomy-engine` for live geocentric longitudes. Do not mix a second
  ephemeris into one live transit calculation without documenting and testing
  the reason.
- Human Design live transits use Sun, Earth, Moon, North Node, South Node,
  Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto—never Chiron.
- Type derivation must follow connectivity across the complete defined-center
  graph, not only direct channels.
- Longitude arithmetic must remain circular across 360/0 degrees.
- “Exact today” requires a real crossing during the user's local day. An orb
  such as `< 1 degree` is not equivalent.
- Keep the gate origin, sequence, spans, and bodygraph geometry documented where
  they are defined.

## Data and security

- Birth settings remain client-only and are stored in localStorage.
- Never commit API keys, tokens, passwords, connection strings, or `.env` files.
- The committed default birth data is publicly visible. Treat any replacement
  personal data as a deliberate privacy decision.
- AI interpretation is produced by the cloud-scheduled task and committed as
  `data/daily-synthesis.json`. The public app makes no model calls and contains
  no AI credential.

## Deployment

- GitHub is the durable source repository and OpenAI Sites is the production
  host.
- `.openai/hosting.json` contains the opaque Sites project identity and must be
  preserved. Do not invent or replace that ID.
- Sites uses the supported vinext and Cloudflare runtime. Its worker entry is
  `worker/index.ts`, and the production artifact must be `dist/server/index.js`.
- Expected production command: `npm run build`; output: `dist`.
- GitHub Pages is not configured.
- Publishing a new hosted version remains an explicit deployment task, not an
  implicit side effect of ordinary feature work.
- The daily automation is an explicit exception: after updating only the
  current synthesis and validating the site, it commits and republishes the
  existing public Sites project.
