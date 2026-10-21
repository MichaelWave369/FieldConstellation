# Atlas ↔ Constellation bridge

The library and map complement each other. This milestone changes FieldConstellation only.

## Observed interface

The public FieldAtlas repository declares `https://michaelwave369.github.io/FieldAtlas/` as its homepage. It returned HTTP 200 HTML during this audit. Its public source at `b07cfde3ecb2429611bea1598d3f332490e5523c` supports `?chapter=RepoName`; FutureArchive already uses that interface with an explicit chapter allowlist.

The deployed shared `pages-discovered.json` observed at `2026-10-21T21:30:35.029Z` contains 124 verified/published chapters matching the public GitHub IDs in this map. Browser-local additions, deletions, renames, bookmarks and visitor passports were not read or transferred.

Constellation has a global Atlas doorway and a project-specific chapter link for those IDs. Other projects open the entrance. A returning visitor can still have customized that chapter away; the map does not override the Atlas’s local choices.

## Identity contract

| Meaning | Existing / proposed form |
| --- | --- |
| Stable cross-app project identity | `github:<numeric repository id>` |
| Constellation query | `?repo=github:1428952721` |
| Public slug/display | `MichaelWave369/FieldConstellation` |
| Current Atlas shared-manifest ID | `gh-<numeric repository id>` |
| Current Atlas public query | `?chapter=RepoName` |

Constellation resolves queries against its loaded public inventory only. It never fetches an unknown ID. Repository renames retain the numeric identity; a transferred/out-of-scope/private project does not resolve unless it is present in the validated public dataset.

## Separate proposal for Atlas maintainers

A future, separately authorized Atlas PR could accept a `project=github:<id>` alias, resolve it only through its public catalog, preserve its existing chapter URLs, and expose a “View in Constellation” link using that canonical ID. It should retain browser-local shelf choices and route unknown IDs to its normal entrance without private lookups or redirects.

That proposal is not implemented here. No shared storage, runtime coupling, credentials, iframe embedding or cross-app authority is introduced.
