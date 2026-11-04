# Edition 20 — Public catalog auto-check and sorting

## Scope
- Browser-only: when a visitor opens FieldConstellation, auto-check the public repository inventory **at most once in 24 hours per browser**, provided the displayed snapshot is at least 24h old.
- A local preference turns auto-check off. Default: on, per the owner request. The visitor can still manually refresh.
- Auto-check is direct anonymous public GitHub REST, paginating through all available public owner repositories. Private records must never enter the static site or its browser cache.
- A failed/rate-limited check leaves the displayed complete inventory unchanged. Record attempt time to avoid hammering GitHub after failures.
- Auto-check never executes a GitHub Action, writes a repository, updates Netlify, triggers a build, changes a domain, or upgrades dated Atlas and deployment health evidence.
- The date next to the public inventory identifies the local displayed snapshot, not the dates of the separate Atlas or destination-health records.

## Sort
- Compact **Sort** button in the repository index: A–Z → Updated → Newest → Stars; user preference saved in browser.
- Same mode applied to the full Directory selector and next/previous index navigation.
- The 3D constellation spatial layout and repository numeric IDs remain stable.
- Stable alphabetic ties; numeric GitHub-star comparison rather than lexical sorting. Sorting is a display preference, not installation status or an architectural dependency claim.

## Tradeoffs and deployment boundaries
This is **visitor-local auto discovery**, not a permanently refreshed checked-in `repos.json`. Visitors initially see the latest bundled or locally cached validated snapshot and later see an updated public count if a permitted GitHub check succeeds. Visitors without GitHub access can still use the static snapshot.

A future scheduled GitHub Pages snapshot refresh might be useful, but **must not be enabled until verifying that it cannot automatically trigger Netlify builds and consume monthly credits**. The current PR adds no scheduler.

## Acceptance
1. `npm ci && npm run check && npm test && npm run build && npm run build:verify`.
2. Browser acceptance with Playwright confirms Sort cycles and Directory stays synchronized.
3. Unit cases cover 24h TTL, opt-out, rate-limiting failure preservation, stable sorting, star counts, and nonmutating data.
4. Confirm current 225-public-star catalog and all Six Houses stay reachable.
5. Test narrow mobile sidebar and keyboard focus; verify no Netlify deployment or domain alteration.
