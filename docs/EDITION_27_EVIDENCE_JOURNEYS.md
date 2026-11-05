# Edition 27 · Evidence Journeys

Prepared 2026-11-04 (Pacific). Repository: MichaelWave369/FieldConstellation.

## Visitor experience

1. Open **Planet Connections Explorer** from desktop Relationships, the mobile sidebar **Source connections · Evidence**, or a public planet's expanded Dossier.
2. Expand **Trace an evidence journey**. Start and destination dropdowns include only the public projects that appear as endpoints in the separately source-validated reviewed ledger.
3. Choose two distinct projects and select **Trace reviewed path**. The algorithm performs deterministic breadth-first search (BFS) for the shortest visitor walk, limited to six hops.
4. Each hop has its own original **verified in source / documented contract** grade, original source-record direction, independently recorded review date, summary, scope, and commit-pinned line-level GitHub evidence. Navigate with **Previous link** / **Next link**. **Inspect visited planet** closes the dialog and selects the visited public project through the normal Phitarium inspector.
5. The existing **Source grade** selector also restricts routes. The separate Project and Evidence search filters continue to filter the connection-card list, not the journey graph. If a grade is changed while a route is visible, the route is invalidated and must be traced again.
6. A disconnected or grade-filtered pair displays **no reviewed source path is recorded**, explicitly not a finding of incompatibility, nonexistence of a real connection or lack of a live integration.

## Provenance boundaries

- Only relations returned by existing `resolveRelationships()` and `connectionExplorerIndex()` are eligible. Those existing functions validate public-only endpoints and require commit-pinned, line-specific GitHub evidence. A thematic/category neighbor is never an eligible edge.
- Graph navigation treats a recorded directed link as traversable in both directions **for visitor exploration only**. A reverse traversal is prominently labeled. Source citations, direction, grades and scope never change. Following two reviewed links does **not** establish a new A→C integration.
- A shortest path is determined only within the **current reviewed ledger**, not the entire ecosystem. At time of design this ledger included eight relationships and a review timestamp of 2026-10-21. Newer repos may have no reviewed edges yet.
- Grade preference uses source-verified records first when equally short routes exist. It is not a reliability or health score.
- A missing path is a bounded coverage statement, never proof that two projects are technically incompatible or unrelated.
- All rendered repo names and evidence strings are escaped. Source links retain the validated GitHub HTTPS URLs and `rel="noopener noreferrer"`. No code executes external source content.
- No new API, credential, service, dependency, deployment, Netlify build, domain change, scheduler, analytics or persistent session data.

## Validation and release

- Verify `npm ci && npm run check && npm test && npm run build && npm run build:verify`.
- Verify `npm run acceptance:browser` in GitHub CI, using isolated browser contexts for evidence navigation so user discoveries cannot change later Quest/Passport fixture counts.
- Unit tests require SiliconLouvre → Domistika → Auralith369 → paracut → WaveForgeStudio as four independently cited steps, reverse traversal preservation, grade-filtered no-route, PhiCade disconnected from WaveForgeStudio in this ledger, and deterministic behavior with 650 additional repositories.
- Browser tests exercise accessible native selectors, trace, steps, pinned evidence, reverse walk, no-route, grade-filtered no-route, explicit planet inspection, 390px mobile modal and non-WebGL2 Canvas fallback.
- **Physical Quest 3 browser verification is still pending.** CI Chromium is not a hardware acceptance test.
- GitHub-only PR until explicit review and merge; no Netlify or `enterthefield.org` cutover.
