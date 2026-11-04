# Edition 22 — Solar Systems / Cosmic Taxonomy

Design input: an astronomical classification idea for visually organizing 220+ GitHub repositories, adapted to the real eight thematic Field Constellation groups. This is an optional **sixth layout**, not a new repository or new data pipeline.

## Data-to-visual mapping

| Data | Rendering metaphor | Important limit |
| --- | --- | --- |
| Existing `GROUPS` and curated `categoryFor` | Eight central category suns | An editorial association, not a verified dependency |
| Public `repos.json` record | One planet per unique public GitHub ID | Public repo existence, not a live application |
| Last `updated` / push date | Clamped logarithmic orbital distance, recent pushes closer | Not a health or abandonment score; old metadata may be stale |
| `size` | Planet scale, using existing `prepareRepos` radius | GitHub size in KB, not lines of code or importance |
| `stars`, `forks`, recency | Brightness/glow | Public social signals, not software quality |
| `archived` | Dimmer planet; inspector displays Archive status | Historical state, not an error or security label |
| Stable repository ID | Planet angle and selection deep link | Never invent/overwrite ID, avoid private records |
| Decorator rings | Three orbital-distance guide circles | Not source evidence / relationship edges |

The fixed sun centers come from the original eight curated Field Constellation group centers. The layout is deterministic for a given inventory and time. Planet positions follow a golden-angle distribution around each sun; the optional orbit phase rotates them at an inverse-radius rate. This metaphor does **not** simulate gravitational N-body physics.

## UX and performance boundaries

- Sixth `Solar Systems` layout button, existing 5 remain available.
- `Move planets` is **opt-in** (default off on entry), disabled for `prefers-reduced-motion`.
- Motion pauses when the tab is hidden, and positions render using existing instancing and Canvas fallback; no Web Workers, network requests, remote assets or external dependency added.
- Guide rings are decorative and only visible for categories with matching displayed repositories; main link toggle can hide them. Existing relationship mode is separate and explicitly source-graded.
- Solar mode uses world/category colors by default, while the existing alternative color lenses remain visitor choices.
- The existing project Directory is the reliable keyboard/screen-reader navigation path. Mobile controls are horizontally scrollable instead of clipping the sixth layout button.

## Acceptance
- `npm ci && npm run check && npm test && npm run build && npm run build:verify`
- CI-only Playwright: `npm run acceptance:browser` with Chromium dependencies installed.
- Unit verification: all six modes produce finite unique coordinates for 600+ projects; same input/time yields identical solar positions; recent push has a smaller radius than an older push in the same group; animation preserves radius; solar-only pseudo edges do not assert dependency.
- Browser: desktop Solar button/metric legend, motion default off/on, mobile Solar, Canvas fallback and existing Phitarium/Dome/Quest/Passport/Six Houses.
- Physical Quest 3 browser acceptance is **pending**. Desktop/mobile Chromium can verify functionality but not device comfort or actual controller interaction.
- No Netlify, domain, DNS, CI scheduler, build hook or public-site migration is touched by this branch.

## Next potential work

Only after real device performance observations: optional focus on one category, track orbits with selected planet labels, tune solar relative sizes, or build a lightweight 2D selector for low-end devices. Do not add fake status moons from open-issue counts or inference about project completion.
