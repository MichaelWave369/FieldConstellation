# Φ Ecosystem Health R1: evidence, not a green-light factory

## Purpose
FieldConstellation provides a **public, read-only** triage board with distinct lanes for recent sampled PR CI outcomes, dated public HTML reachability observations, independently source-reviewed links, and publication/version parity. There is **no fleet-wide status certification**. Private repository inventories and RepoNerve SQLite data never enter the build.

## Data sources and boundaries
- `src/repos.json` or a fully validated browser-refresh snapshot: **public projects only**, potentially stale. GitHub metadata changes are not build checks.
- `src/deployments.json`: bounded, dated anonymous HTTPS HTML checks. An HTML document is not a working application. A 7-day freshness limit comes from `destinationStatus` and does not apply to production verification.
- `src/relationships.json`: commit-pinned source-reviewed links. 'Verified in source' means compatible code was inspected, not that deployed systems communicated successfully.
- `src/health-observations.json`: a **manually reviewed public sample** of specific GitHub PR workflow run results, keyed to immutable IDs and exact head SHA, and a dated comparison of production and GitHub Pages. Run samples are not a claim about current default branch or all other projects.
- Optional button: user-initiated anonymous GET for the latest public GitHub Actions workflow on **one** selected public repository. No credentials, bulk scheduled scans, private URLs or automatic polling. Failure or rate limit means unknown.
- Optional PhiRepoNerve public-ID handoff remains browser-memory-only and **cannot upgrade** this dashboard's CI or deployment claims.

## Observed publication discrepancy (Nov 8, 2026 Pacific)
Connected Netlify project `melodic-griffin-984e57` showed a ready production deploy for `https://www.enterthefield.org/` created `2026-11-05T19:02:08.744Z`.
FieldConstellation PR #33 was merged at `2026-11-09T02:11:25Z` UTC. Read-only page inspection showed that `https://michaelwave369.github.io/FieldConstellation/gateway/index.html` already contained the new Φ Systems Hierarchy, whereas `https://www.enterthefield.org/` did not. This is a **dated publication gap**, not a claim that the site is offline. R1 flags it for review while the observation is recent, then demotes it to **recheck** after seven days rather than saying a permanent outage exists.

Likely next investigation: confirm Netlify's Git repository linkage/branch, publish directory, custom-domain assignment and whether the domain is using a previously uploaded drop deployment. Do not change DNS, Netlify project settings, or production builds automatically. The latest ready deployment alone does not prove live code parity.

## Evidence status rules
- A cited successful PR CI run certifies **that run on that head SHA only**; no global green fleet badge.
- A failed workflow on a reviewed PR identifies a **run requiring investigation**, not a broken public app.
- A recent HTML check gives **HTML seen** or **unavailable at check time**; stale results are recheck tasks, never proof of current uptime or downtime.
- Missing CI evidence remains **unknown**; public repository count is not the number of verified builds.
- An editorial link remains a **relationship**, not an integration test. The reviewed sample never invents edges.
- A previously observed production difference expires to **recheck** rather than asserting current mismatch indefinitely.

## Validation
Run `npm run check`, `npm test`, `npm run build`, `npm run build:verify`, `npm run build:domain`, `npm run domain:verify`, and `npm run acceptance:browser` after dependencies are installed. Tests cover privacy, CI evidence scope, stale destination demotion, manual public-only CI lookups, publication observation expiry, existing Phitarium routes, mobile display, and private-safe data boundaries.

## Operator next rung
Add a separate reviewed **public-only** CI snapshot collector, with GitHub Actions rate budgets, immutable repo identity, reviewed source links, bounded fetches and failure recovery. Explicitly verify production parity after any deployment. Keep operational/private fleet triage in PhiRepoNerve or an authenticated operator workspace rather than putting private summaries on the public site.
