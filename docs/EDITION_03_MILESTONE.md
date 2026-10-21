# Edition 03 milestone and requirements receipt

**Controlling authority:** Mikey’s “Field Constellation 03: The Living Architecture” request, 21 October 2026. The conversation request is authoritative; no separate source-file hash was supplied. Its explicit bounded-milestone direction authorizes prioritizing working data accuracy, relationship exploration and reliable deployment.

**Untouched baseline:** git commit `d3be07cea3da86353e047d595ca2470e1221a957` (tree `c1534e264c757e712286172385a3f3c7e61af182`).

**Candidate:** Edition 03 / package 3.0.0 on `feat/edition-03-living-architecture`.

**Authority order:** current human request → this faithful requirements register and recorded scope → existing implementation conventions. Final merge/release remains human-owned. No mocks or stubbed production integrations are included.

| ID | Requirement / boundary | Implementation | Verification |
| --- | --- | --- | --- |
| FC03-01 | Audit before app changes; reconcile 212/177 and verify Pages paths | `EDITION_03_AUDIT.md`, baseline command and HTTP observations | Baseline check/test/build and twelve HTTP 200 resources |
| FC03-02 | Only public records; accurate current counts and safe complete refresh | `inventory.js`, `repos.json`, CLI refresh, displayed snapshot dates | Scope, duplicates, ownership, pagination, failure and cache tests |
| FC03-03 | Optional meaningful relations, source vs documented vs thematic, direct-neighbor focus | `relationships.js/json`, existing scene and Canvas integration | Evidence/public-endpoint/direction/adjacency tests; browser smoke objective |
| FC03-04 | Useful discovery inspector, related projects, topics, docs, archive state, random world | Existing inspector expanded in `app.js` | Source review and browser smoke objective; destination tests |
| FC03-05 | Working destination facts distinct from Pages flags | `destinations.js`, `deployments.json`, bounded check script | HTTP observations plus stale/redirect/error/unsafe-URL tests |
| FC03-06 | Atlas doorway and stable identity scheme; no Atlas writes | `atlas.json`, `project-links.js`, separate proposal | Public homepage/manifest inspection and ID/chapter tests |
| FC03-07 | Preserve five layouts, themes, fallback, controls and reduced motion | Existing model/render/camera paths extended | Original seven tests plus candidate visual/recovery objectives |
| FC03-08 | Tested reviewable PR, docs/license preservation, production unchanged | Existing workflow + build audit, README/changelog/architecture | Local commands, PR CI, main ref comparison and live resource check |

## Scope and deviations

The coherent stopping point is a reviewable PR containing eight sourced relations across nine public projects, a public data/destination pipeline, the discovery panel and a lightweight Atlas bridge. This deliberately does not claim an exhaustive architecture graph, transitive/import scanning, a reproduced inter-app runtime qualification, a continuous uptime monitor, or new Atlas functionality. Those are deferred breadth, within the human request’s focused-milestone authority.

Local implementation choice: Relationships is a layer across the five existing layouts, rather than a separate force-directed layout. It preserves the visual/camera model and avoids a new dependency. Evidence status uses line colors plus explicit text labels/scopes; colors alone do not carry the claim boundary.

No material dependency, licensing, repository scope or release-authority change is introduced. The private alternate Site is not republished or modified. Rollback is the normal PR/revert path; main remains at the baseline until a human merges.

## Proving-ground handoff

The candidate, untouched baseline, requirements register, source ledger, metadata observations and `VALIDATION.md` form the handoff bundle. Requested verification is non-destructive checks, failure-path tests, Pages asset auditing and candidate browser smoke checks. Known limitations and exact results belong in `VALIDATION.md`.

Implementation and verification are performed in this session; no separate independent reviewer or release approval is claimed. Candidate prepared for human PR review. Final release authority remains human-owned.
