# Edition 28 · FieldConstellation as the Enter the Field gateway

Prepared 2026-11-05. **Staging code only. No Netlify, DNS, domain, Pages settings, releases, merges or manual workflow runs.**

## Intended destinations

- `enterthefield.org`: review/staging target for the new Field Gateway. A DNS mapping is **not claimed or changed** by this PR.
- `enterthefield.com`: intended final root homepage after acceptance and explicit approval. The existing public site must be crawled and its deep URL families preserved before cutover.
- GitHub Pages `/FieldConstellation/gateway/index.html`: browser-reviewable entrance without replacing the existing `/FieldConstellation/index.html` Phitarium.
- `phi-field.com`: stays the separate PhiOS destination.

## What now works in the proposed code

1. Gateway loads the validated **public-only** bundled `repos.json` and displays its actual count, age and ten PhiOS role totals.
2. Browser prefers a newer validated local public snapshot and checks the anonymous GitHub owner API automatically when the displayed snapshot is at least 24 hours stale and the browser's last attempt is at least 24 hours ago. All GitHub pages are fetched before committing a refresh. Manual Refresh is available.
3. Failure, malformed data or rate limiting **retains the last complete snapshot**, clearly marked as such. No private access, API tokens, GitHub Actions cron, build hooks, telemetry, Netlify API, or repository writes are required.
4. Visitors can search, filter, sort, and open all cataloged public repositories by immutable GitHub identity.
5. **PhiOS Systems** adds a seventh 3D/Canvas layout with ten architectural groups, separate from the original eight thematic Solar Systems/Quest houses. Stable GitHub numeric IDs determine positions; the grouping does not invent integration edges.
6. Classification uses reviewed/curated exact names, optional explicit owner topics (`phios-core-os`, `phios-ai-home`, `phios-app`, `phios-local-service`, `phios-creative-pipeline`, `phios-world-portal`, `phios-bridge`, `phios-research-library`, `phios-experiment`, `phios-archive`), and conservative description suggestions. Unclassified or ambiguously described new repos go to **EXPERIMENT / review queue**. Every entry is **cataloged**, never assumed installed.
7. A purely local `dist-domain/` preview can produce a root Field Gateway plus `/phitarium/` and legacy Other Fields. This is an isolated preview, not a deployment config.

## Reproducible checks

Run from a clean checkout with Node 22+:

```bash
npm ci
npm run check
npm test
npm run build
npm run build:verify
npm run acceptance:browser
npm run build:domain
npm run domain:verify
npm run preview
```

The ordinary `npm run preview` serves `dist/` (GitHub Pages layout). Serve `dist-domain/` separately through a static local server to inspect the future domain-root packaging.

## Required release gates (NOT yet signed off)

- [ ] Green CI for this PR, with unit tests and desktop/mobile browser + Canvas fallback checks, no inferred passes.
- [ ] Navigate staged gateway, every role filter, categories with zero projects, search, sort, counts, refresh failures, deep project links, Six Houses, and current historical links.
- [ ] Real Quest 3 headset/browser acceptance, including controller focus, scroll and WebGL fallback, if XR access is advertised.
- [ ] Independently verify actual public-repo count using complete owner pagination and compare with both current and stale client snapshots.
- [ ] Inspect `enterthefield.org` DNS/TLS/current site and `enterthefield.com` DNS/TLS/current site; perform a complete old-site URL crawl and redirect plan (including `/world/`, `/projects/`, `/gallery/`, `/archive/`, `/network/`, `/human-garden/`).
- [ ] Confirm a reversible apex/www HTTPS cutover, asset base path, redirects, cache policy, and rollback. Preserve original content rather than deleting legacy pages.
- [ ] Confirm Netlify repository connection and build-credit consequences before any scheduled snapshot workflow or domain deployment. Do not assume daily builds are free.
- [ ] Explicit owner approval for any merge, deployment, DNS changes, or public release.

## Architecture boundary

The categorization is a visualization and editorial discovery aid, **not** a machine-verified dependency graph. Source-reviewed relationship links remain confined to the dated, commit-pinned evidence ledger. Infinite Interconnects remains a proposed simulator; no working peer bridge is implied. PhiOS, Infinite Porch and Infinite Commons are architectural centers, not guaranteed installed clients or production integration.

The gateway's auto-refresh is **per browser**, not a universal server-side data feed. If the eventual apex site requires one authoritative count instantly shared across visitors, add a separately reviewed Pages-hosted snapshot publishing process. Do not schedule default-branch commits that could incidentally bill Netlify before reviewing the trigger behavior.
