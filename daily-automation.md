# Daily authored reading and publication

## Superseded: GitHub Actions now owns daily generation

The older cloud task must NOT execute the legacy steps below. Do not generate,
commit, or publish independently; this prevents competing writers and obsolete
Sites publishes. `.github/workflows/daily-reading.yml` uses DEEPSEEK_API_KEY
from GitHub Actions secrets and checks out `agent/repository-handoff`.
Hourly wakeups at minute 17 check the Pacific date. After 3 a.m., generation
is due only if today's reading is absent. Failed runs can retry on the next
wakeup; GitHub scheduling may be delayed. Manual dispatch forces regeneration.
Validation, calculation tests, lint, and the Vercel build precede committing
only data/daily-synthesis.json. Check Vercel deployment status separately;
a successful GitHub commit alone is not proof of a successful deployment.

This generates the committed default chart's reading. Private browser charts
are not sent to this workflow. The separate on-demand Vercel endpoint still
requires its own credentials and access code; GitHub secrets do not transfer
to Vercel automatically.

## Legacy procedure (historical reference only; do not execute)

Scope: only Chart & Design, repository `jgsack/HDAstro`, branch
`agent/repository-handoff`. Preserve the Sites identity in `.openai/hosting.json`.
Do not run or modify unrelated websites or schedules.

1. Fetch the latest source. Fast-forward a clean checkout; preserve unrelated
   edits and stop before an unsafe merge or overwrite. Read AGENTS.md and the
   README interpretation policy. Use the installed dependencies when available.
2. Run `node scripts/daily-workflow.mjs context`. Read the generated
   `node_modules/.tmp/daily-context.json`. The runner sets America/Los_Angeles
   for both daily calculations and the date, including when the host uses UTC.
   It invokes installed tools directly to avoid broken global npm wrappers.
3. Author today's `data/daily-synthesis.json` from that context, using the
   current fingerprint and generatedAt. Write an original combined reading,
   not output from buildLiveSynthesis or a paraphrase of yesterday. Follow the
   README format: two summary paragraphs and three to five sections, each with
   title, evidence, meaning, practice. Give concrete examples as possibilities;
   name actual natal contacts and gates, distinguish slow themes from short
   contacts, and do not double-count the two ends of the same nodal axis.
   Use Pacific labels for authored times. Keep all private settings client-only.
4. Run `node scripts/daily-workflow.mjs check` and then
   `node scripts/daily-workflow.mjs build`. These run freshness/schema checks,
   calculation verification, lint, and the production build. Word thresholds
   enforce completeness, not editorial quality: also read the prose critically.
5. Follow the installed Sites hosting skill. Commit only the current synthesis
   during an ordinary daily run, push GitHub, and publish the exact source to
   the existing public Sites project. Never persist or print source credentials.
   If Sites has already published today's source, do not duplicate publication.
6. Success requires a terminal `succeeded` deployment for the same source—not
   merely a new JSON file, a GitHub push, or completion of another task. If a
   version exists with a failed or pending deployment, resume that version when
   its source still matches; do not regenerate the reading unnecessarily.
7. Report the date, headline, and publication outcome. If blocked, identify the
   failed stage accurately, preserve the live version, and keep the schedule
   active for the next run. Never relabel the rule-based fallback as fresh AI.

An already-current written reading can be retained during a scheduling repair.
Verify its contents and completed publication rather than changing its date or
generating an unnecessary second version merely to claim a test ran.
