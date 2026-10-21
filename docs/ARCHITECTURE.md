# Living Architecture · Edition 03

## Incremental structure

| Module/data | Responsibility |
| --- | --- |
| `app.js` | Existing scene, camera, UI, inspector, search and five layout controls; optional Relationships layer |
| `model.js` | Existing categories, layouts, association edges, colors, filtering and public metadata normalization |
| `canvas-renderer.js` | Perspective fallback using the same camera, positions, visible set, relationship colors and focus neighborhood |
| `inventory.js` | Complete public snapshot/cache validation and fully paginated public fetch; no state commit before success |
| `relationships.js` | Public endpoint/evidence validation, resolution, adjacency and explicitly optional thematic links |
| `project-links.js` | `github:<numeric-id>` identities, public-only query resolution and bounded Atlas chapter links |
| `destinations.js` | Public HTTPS candidate policy, bounded probe and dated/stale destination presentation |
| `repos.json` | Checked-in, complete, public-only metadata observation |
| `relationships.json` | Reviewed claim ledger with typed edges, direction, source status, scope, dates and pinned citations |
| `deployments.json` | Independently dated HTTPS/HTML observations; no uptime or full-feature certification |
| `atlas.json` | Checked Atlas entrance and reviewed public chapter IDs; separate manifest observation date |

No runtime dependency was added. Three.js 0.180.0 and the original licenses/fonts remain intact.

## Data boundaries

Boot validates the checked-in public snapshot. A newer, valid, complete public cache may replace it. A valid saved public cache can also recover a failed snapshot request. Optional relationship, destination or Atlas data failing to load does not prevent the basic map/directory from booting. Missing relationship evidence disables that layer; missing destination evidence never creates an Explore action.

The GitHub refresh reads every public page, validates ownership/private flags and canonical repo identity, rejects duplicate IDs/names, then returns the full normalized list. The UI commits state/cache only after success. CLI refresh writes a temporary file and renames it atomically. Rate limits, malformed data, incomplete pagination and empty responses preserve the existing dataset.

The browser cache key is versioned for Edition 03. Old broader/less strictly validated caches are not silently reused. The public app never authenticates to GitHub or requests a private endpoint. Metadata is an observation of what was public at its recorded time, not a promise of current visibility forever.

## Evidence semantics

**Verified in source** means the cited public code/manifest was inspected. It can establish a URL reference, matching bridge contract, or shared library declaration. It does not establish that both deployed apps are connected today. The initial React relation explicitly spans different major versions.

**Documented contract** means public documentation explicitly states a relation, with its original qualification/candidate boundaries retained. It is not promoted to a reproduced operational result.

**Thematic association** is editorial. When enabled, neighboring public projects in the same curated world are joined in browse order. This is never evidence of dependency. These transient edges are kept out of the sourced JSON ledger.

Every ledger endpoint resolves against the current public snapshot. Evidence must use an HTTPS GitHub URL, public repository name, full 40-character revision and line anchor. Source-verified records require a code/manifest citation; shared libraries require both endpoint manifests. Unknown/removed endpoints do not become phantom nodes. Renaming an evidence repository may require reviewing its citation even though project query identity remains stable.

The map keeps the five existing positions. Relationship edges replace layout association edges only while the layer is enabled. Selection computes direct neighbors using sets, dims other nodes, prioritizes neighbor labels and can fit the neighborhood. Colors plus explicit text labels identify evidence status in both renderers. Direction is stated in the inspector. Disabling links avoids line drawing. This milestone does not add a force engine or transitive dependency inference.

## Destinations and provenance

A public HTTPS homepage is a candidate; a Pages convention is the fallback for a true Pages flag. Code-host links, credentials, local/private IP literals and local hosts are ineligible. The verifier follows at most five eligible redirects, uses six workers, bounds each request to twelve seconds and inspects at most 8 KiB for an HTML document marker. 2xx + HTML qualifies as a dated reachable observation. HTTP 401/403/429 and network failures are inconclusive. A non-HTML response or other failure is unavailable at that check, not permanently dead.

Explore is withheld after seven days or if the candidate URL changed. The unverified declared link can still be opened with its explicit label. Browser metadata refresh does not falsify probe dates. No request runs destination-app actions or assumes iframe access.

GitHub metadata fields are labeled as snapshot facts. Pinned relationship citations are directly reachable from scope cards. The Atlas manifest has its own date, and destination checks have individual timestamps.

## Deployment and recovery

Static output uses relative assets and modules under `/FieldConstellation/`. The build audit verifies HTML assets, local imports, font URLs, license notices, public data and relationship integrity. PRs run the same validation/build without production deployment; only merged main can publish Pages.

Existing loading, retry, empty search, accessible directory and context-loss recovery remain. Reduced motion retains instant camera/layout changes and disables automatic orbit by default. Hardware WebGL remains a separate device check; the Canvas path is the available browser fallback.
