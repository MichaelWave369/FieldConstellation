# Edition 03 audit · 21 October 2026

## Baseline

Inspected `main` at `d3be07cea3da86353e047d595ca2470e1221a957`, the existing package/lockfile, workflow, seven tests, application/model/Canvas renderer, bundled data, styles, README, integration notes and validation notes. No repository AGENTS.md was present. The work continues the existing app rather than replacing it.

The static build copies `src/` and the pinned Three.js modules into `dist/`; the Pages workflow deploys only merged `main`. Existing layouts are constellation, sphere, helix, language orbits and spiral. Lenses, two themes, public refresh/cache, inspector, random discovery, directory, filters, keyboard/touch controls and the perspective-correct Canvas fallback already exist.

Baseline `npm run check`, seven tests and `npm run build` passed. GitHub’s baseline build/deploy run `39680831373` completed successfully. The production HTML, app/model/Canvas modules, snapshot, stylesheet, icon, font CSS/font and three rendering modules all returned HTTP 200 at their `/FieldConstellation/` paths. The audit checked twelve resources in total. Field Atlas’s public entrance also returned 200 HTML.

## Count reconciliation

| Observed dataset | Capture | Public | Private | Total |
| --- | --- | ---: | ---: | ---: |
| Earlier owner-only hosted build’s captured snapshot | 2026-10-21 20:55 UTC | 176 | 36 | 212 |
| Edition 02 public repository snapshot | 2026-10-21 21:36 UTC | 177 | 0 | 177 |
| Edition 03 refreshed anonymous public listing | 2026-10-21 21:58 UTC | 177 | 0 | 177 |

The extra public record is FieldConstellation itself. The earlier snapshot and later public export cover different scopes and times. The private artifact was inspected locally for aggregate counts only; no private records, names, IDs or URLs were copied into this repository. This table does not claim a current total for the account’s private repositories or a current live count for the alternate owner-only deployment.

The fresh public listing required two pages and contained no private records. Compared with the bundled public IDs, there were no additions or removals. Ten records changed: last push/update dates (10), issues/PR counts (8), size (5), description (1), language (1) and license (1). The refreshed snapshot retains the historical Grok reconciliation counters as historical integration provenance.

## Limitations found and addressed

- Edition 02’s “live sites” statistic counted declared URLs and inferred Pages destinations. Edition 03 counts dated HTML observations instead and preserves the Pages flag separately.
- Layout edges represented thematic, chronological or language associations. The new optional layer uses a separate sourced ledger; those artistic edges are not silently upgraded.
- Refresh and cache validation were duplicated and weaker than the snapshot’s public-only intent. The new shared boundary rejects invalid scope, malformed/duplicate identities and incomplete pagination before replacing data.
- Inspector details lacked source-backed related projects and destination explanations. They now have typed relations, scopes, evidence, topics, documentation and live-check status.
- Atlas chapter links already exist in its public source and Future Archive integration. The bridge reuses that interface and public manifest; no Atlas modification is necessary for this milestone.

## Relationship review scope

Nine public endpoints were reviewed through pinned public files: Domistika, Auralith369, SiliconLouvre, FieldAtlas, FutureArchive, PhiCade, parallax-pixelforge, paracut and WaveForgeStudio. Eight ledger records retain five code/manifest/navigation facts and three documented contracts. Evidence references are in the application JSON and inspector; candidate profiles stay labeled candidate in their scope notes.

No verified direct inter-repository import/dependency graph is claimed. Source inspection confirms code or declarations at pinned revisions; runtime qualification, continuous maintenance and matching deployed versions are separate questions.

## Production and review boundary

The Edition 03 work is on a feature branch for a PR. The existing main/Pages workflow is retained with one additional static build audit. Neither `main`, the alternate owner-only Site, nor FieldAtlas is modified by the feature branch. Final production release remains the repository owner’s decision.
