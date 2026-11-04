# Edition 21 — Field Gateway / migration readiness

Prepared 2026-11-04. **No live-site or Netlify changes.**

## Domains
- **phi-field.com:** primary PhiOS / PhiOS Mobile / PhiOS XR gateway, separate from this repo.
- **enterthefield.org:** future Field Constellation public entrance, proposed from `gateway/index.html` only after explicit domain cutover approval.
- **GitHub Pages:** `/FieldConstellation/` still serves the Phitarium at `index.html`; candidate gateway is `/gateway/index.html`; the Six Houses are `/other-fields/index.html`.

## Current old Enter the Field observations
On Nov 4, the existing public old site still presents **Parallax** as umbrella, with nine conceptual regions and a 47-record project registry. These are historical structures, not the new 225-public-star catalog.

| Current route | Recommended future preservation |
|---|---|
| `/` | New Field Gateway after review |
| `/world/` | Keep historical region atlas or a labeled archive landing |
| `/projects/` | Preserve links and legacy project detail pages; surface new directory separately |
| `/gallery/` | Preserve images/media and source credits |
| `/archive/` | Keep old archives and direct source links |
| `/network/` | Retain legacy six-computer exhibition |
| `/human-garden/` | Audit and preserve this visitor destination |
| Other deep URLs | Full crawl/sitemap verification **pending** |

Retire Parallax as the umbrella in **new** marketing, but do not rename authentic historical repo names, delete receipts, or imply old URLs are broken. The separate `src/deployments.json` observation is dated **2026-10-21**, and therefore stale for any seven-day reachability claim. No live-health refresh was performed.

## Architecture truth boundaries
The gateway links to PhiOS, Infinite-Porch, Infinite-Commons, PhiOS-Mobile and PhiOS-XR by stable public numeric GitHub IDs. The links represent public source records, **not verified installations or deployed inter-project dependencies**. Six Houses remain creator-owned with external links awaiting approval.

## Required verification before domain cutover
- GitHub CI: `npm ci && npm run check && npm test && npm run build && npm run build:verify`; plus CI-only Playwright browser acceptance.
- Root and GitHub Pages subpath navigation, mobile viewport, keyboard focus and reduced-motion styling; full Directory opens only from explicit `?directory=1`.
- Existing Phitarium WebGL fallback and Six Houses remain usable.
- **Real Quest browser testing is not done.** Physical headset test for text, link activation, scrolling, comfort and WebXR behavior remains required; desktop Chromium cannot qualify a Quest.
- Full old-site URL crawl, apex and www HTTPS/DNS plan, redirect mapping, preservation of archive, rollback steps, and one controlled final deploy.
- No Netlify preview/build trigger, domain change or other paid hosting use is introduced by this candidate.
