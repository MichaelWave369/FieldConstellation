# Field Constellation 12 · New Worlds

An interactive observatory for [MichaelWave369’s public GitHub ecosystem](https://github.com/MichaelWave369?tab=repositories), continuing Edition 02 and the user-supplied Grok Field Lattice.

[Open the production map](https://michaelwave369.github.io/FieldConstellation/) · [Build and deployment status](https://github.com/MichaelWave369/FieldConstellation/actions) · [Read the Field Atlas](https://michaelwave369.github.io/FieldAtlas/)

![Edition 03 relationship view](docs/images/edition03.jpg)

## Edition 12 · New Worlds and refreshed public coverage (October 29, 2026)

The bundled **public-only GitHub listing now includes 199 unique owner repositories**, collected by a complete anonymous three-page REST read on October 29, rather than the previous 177-repo observation. All 22 newly discovered public repositories receive stars, including BTM, SparkTheSubstrate, EchoesOfTheNine, TweedleVerse, LENZ, FieldStoryForge, BackyardProductionCompany, GenEWrist, PhiOS-XR, PhiARK, PhiPress and other new research or creative experiments. The listing is a dated snapshot, not a private-account inventory. Older Edition 01–11 counts below describe their historical observations.

Two **new guided trails** add an editorial introduction to the game worlds and a Studio Circuit for storytelling and creative infrastructure. They remain repository tours rather than claims of interoperability, active installations or deployed demos. New games and studios have reviewed thematic groups in all five existing star layouts; the relationship ledger remains untouched.

The **Atlas published-site lens** was separately refreshed from its live, public deployment manifest generated **2026-10-29T19:41:28.240Z**, showing **148 independently verified HTML destinations** from **199 publicly listed repositories**. Each record was matched against the public numeric GitHub repository ID *and* case-insensitive repository name before being admitted. The reviewed chapter crosswalk now contains **131** IDs, retaining its earlier 124 and adding seven source-reviewed public projects from the Atlas's New Horizons update. These are different evidence classes.

**Known limits:** EchoesOfTheNine has a public repository star but its `/EchoesOfTheNine/` destination returned 404 in the audit. It is not falsely added to the published-site list. An HTML response is not proof that a game starts, that WebXR works, or that a remote site permits framing. The old destination-check snapshot retains its original observation date and is not silently re-labeled as fresh. The Atlas itself can offer direct-first launching and safe, explicitly optional iframe previews.

The separate Field Atlas↔Constellation deep links still use public `github:<numeric-id>` identities; unknown and private identities are never fetched or promoted. No cross-origin passport sharing, authenticated API, runtime permission changes, new dependency graph edges or automatic publishing are introduced.


Edition 11 adds real-browser visitor acceptance gates to Edition 10's shareable Postcards, local Passport, Coverage Ledger and Atlas bridges. Production serves the last merged `main` deployment; pull requests build and validate without replacing it.

## Explore the Living Architecture

The five original layouts remain: thematic constellation, Fibonacci sphere, chronological helix, language orbits, and golden-angle spiral. World/language/activity colors, Field green, Lattice gold, search, the index, directory, Pages/fork filters, random discovery and both rendering paths are preserved.

**Relationships** is an optional layer on those same layouts:

- **Verified in source · mint:** inspected bridge code, navigation links, or shared library declarations. This does not prove a live integration or an inter-repository import.
- **Documented contract · gold:** an explicit public integration claim or candidate contract, with its limits retained.
- **Thematic association · lavender:** optional editorial neighbors in the same curated world. Off by default; never represented as code dependencies.

Select a project to emphasize its direct neighbors and dim unrelated nodes. **Fit connections** frames the relevant group. The inspector lists incoming/outgoing/shared relationships, commit-pinned evidence, review dates and scope. Missing links mean **not recorded**, rather than proof that no relationship exists.

The first ledger contains **eight sourced connections across nine public projects**: five source facts and three documented contracts. This is a bounded review, not an exhaustive dependency audit of 177 repositories. The two React manifests in the shared-library relationship use different major versions; compatibility is not implied.

Drag to orbit, scroll/pinch to zoom, and right-drag or Shift-drag to pan. `/` focuses search; `Esc` clears selection/search; arrow keys rotate a focused map and visit projects elsewhere. Use the directory for a full keyboard-accessible list. Reduced-motion preferences are respected.

## Guided Trails · Edition 04

Open **Guided trails** in the map header to follow a five-stop introduction through the public Field. Three routes introduce the Atlas and observatory, making tools and studios, and research and trust projects. Each stop focuses the existing 3D map and inspector; use **Previous**, **Next world**, or **Exit** to navigate. Selecting an unrelated project, clearing the selection, or resetting filters exits the trail without interfering with ordinary search and exploration.

**These routes are editorial introductions, not evidence-backed dependency graphs.** They do not add edges to the Relationships ledger or imply operational integrations. Stops resolve against the validated public inventory; missing or private projects are skipped, and routes with fewer than three public stops do not appear. The application performs no private API lookups and needs no new dependencies. See `src/trails.js` and `tests/trails.test.mjs`.

## Shareable Journeys · Edition 05

A guided trail now has a **Copy stop link** action. Its URL records the reviewed trail ID, a 1-based stop index and the same stable public GitHub repository ID used by the regular inspector. For example, `?trail=first-light&stop=1&repo=github:<id>` (replace `<id>` with the actual numeric public repository ID). A visitor opening that link starts at the intended point of the tour, with the map and inspector focused as usual. Next/Previous stops add browser history entries; Back/Forward restores the stop. Exiting the journey strips tour parameters while retaining the selected ordinary repository link.

Shared journeys are validated against the **current complete public snapshot**. Unknown trails, duplicate/inconsistent parameters, missing or private repositories and out-of-range stops are not restored. Routes are still editorial introductions and are never promoted into technical dependency evidence. No private lookups, runtime dependency, cookie tracking or backend were added. A select-and-copy fallback is available if the browser denies clipboard permission.

## Field Passport · Edition 06

Open **Passport** in the map header to see saved and recently explored public projects. Use **Save to Passport** in any project inspector to toggle a favorite. Selecting a saved or recent project uses the existing map and inspector.

Passport data lives **only in your browser's localStorage** under a dedicated versioned key. It stores `github:<numeric-id>` values, not project descriptions, links, private inventory, or user details. Recent history contains at most 20 unique public IDs. Favorites are bounded to 200 entries. Refreshing the public inventory removes saved IDs that are no longer part of the validated public dataset; nothing attempts to fetch private repositories.

**Export favorites JSON** creates a small local file containing only favorite IDs. **Import favorites JSON** merges known public favorites with current saves, skipping unknown or now-private IDs. It never imports/export recent history, never sends data to a server, and requires no account. Browser local-storage restrictions may cause bookmarks not to persist after refresh; the UI warns users when a write fails. Clear commands require confirmation.

This feature does not sync between devices or with Field Atlas, and it does not imply a dependency between saved projects. Existing repository links, tours and evidence remain separate.

## Atlas Lens · Edition 07

**Atlas chapters** in the sidebar filters the existing 3D layouts, searchable index and repository directory to projects represented by the **reviewed, public-only Atlas chapter map** (`src/atlas.json`). Switch it off to show all public worlds again. A dated label explains exactly which chapter map the filter uses. The selected project inspector marks reviewed Atlas chapters and offers **Read in Field Atlas**, preserving the book's existing `?chapter=<RepoName>` navigation.

The checked-in Atlas map contains **124 reviewed public chapter identities as of October 21, 2026**. The live Atlas was observed later with more chapters. **This is not a live completeness claim:** projects added or removed since the review do not automatically change the map. The lens is unavailable if its manifest is invalid or no longer resolves to current public repos. It never fetches unknown or private repository identifiers.

The Atlas remains an independent book; this change only modifies FieldConstellation. A [separate Atlas-side two-way link proposal](docs/ATLAS_TWO_WAY_BRIDGE_PROPOSAL.md) specifies how to support stable `github:<id>` return links without changing the Atlas until separately authorized.

## Atlas Pulse · Edition 08

**Two provenance levels, clearly separated:**

- **Reviewed chapters** is the unchanged `atlas.json` crosswalk, reviewed October 21, 2026, with **124** public chapter identities in the older Constellation inventory. These link using Atlas's original `?chapter=RepoName` deep links.
- **Atlas published sites** uses a new immutable, dated `atlas-published.json` copy of Field Atlas's **public Pages verification manifest** from **October 22, 2026 at 02:54 UTC**. The Atlas snapshot verified **126** public HTML destinations from an owner listing of **179** public repos. The Constellation repository snapshot currently contains **177** public repos; **125 of those 126** published-site IDs match. One verified Atlas project, `PhiOS-XR`, is absent from Constellation's earlier snapshot and is not invented as a star.

This does **not** mean there are only 126 Atlas chapters. The live book was separately observed showing **141 available chapters**, including seed, published and publication entries. A public-site verification is not a curator review, a guarantee the application functions, or a guarantee that a particular visitor's customized Atlas shelf contains the chapter. Dates and provenance appear directly in the UI. The two filters are mutually exclusive but work with normal search, categories, and directory filters. Both filters fail closed against invalid source data or a non-public/missing project.

A project in the published-site crosswalk can open an Atlas `?project=github:<numeric-id>` deep link, which Field Atlas now validates against its own current verified public manifest. No cross-origin browser fetch, private repository lookup, account, visitor passport sharing or dependency claim is involved. The data changes only through a reviewed commit, **not live on every page load**.

## Coverage Ledger · Edition 09

The **View coverage ledger** control below the Atlas filters opens a transparent, accessible comparison of three **different** public observations: the displayed Constellation repository inventory, the curator-reviewed Atlas chapter map, and Atlas's public Pages-verified published-site snapshot.

The dialog exposes exact public matching counts, each underlying observation date, and a short list of **published-site records that cannot be matched to the currently displayed Constellation repository snapshot**. An unmatched project does **not** mean a private repository, broken site or failed integration. For example, the bundled older public repo inventory lists 177 records while the separately dated published Atlas manifest lists 126 verified HTML sites; 125 match by public numeric repository ID plus name, and PhiOS-XR appears only in the newer published snapshot.

**Refresh public repository listing** reuses Constellation's existing anonymous, fully paginated GitHub public-repository refresh, with all-or-nothing validation and preservation of previous data on failure. It does not change the Atlas source manifests. If a newly published public repository is now in the listing, the ledger reconciles it after refresh.

**Export coverage JSON** creates a reproducible, dated, read-only receipt describing these independently sourced counts and mismatches, with explicit caveats. It contains only public repository IDs and names, never local Passport favorites, history, cookies or visitor identity. If an Atlas source is malformed or unavailable, the ledger says **Unavailable**, not zero coverage. The existing five layouts, Passport, evidence-backed relationships and Atlas navigation remain unchanged.

## Field Postcards · Edition 10

A **Field Postcard** is a visitor-chosen collection of **1–8 currently public GitHub repository IDs** that opens in a preview dialog on another visitor's Constellation. To create one, first save worlds in **Field Passport**, then select **Make Field Postcard**. Choose at most eight saved projects and click **Copy postcard link**. If browser clipboard access is unavailable, an editable-selection fallback shows the exact link for manual copying.

The link uses a bounded, validated `?postcard=github:<id>,github:<id>` query parameter. Creating a share link does not include the visitor's Passport backup, previously viewed projects, local names, timestamps, history, cookies, or credentials. It also strips unrelated `repo` and curated trail parameters from the shared URL so the recipient sees a postcard, not an accidental tour.

**Opening someone else's postcard never imports it.** Visitors can preview currently public worlds, open one in the 3D map, or explicitly click **Save these worlds to my Passport**. An invalid, duplicated, oversized, or fully unavailable postcard is rejected; unknown or now-unavailable IDs in an otherwise valid link are omitted without revealing private metadata. The Passport only changes after explicit selection, and its existing local-first storage limits are respected. No backend, authenticated GitHub lookup, live destination certification, cross-origin browser storage or analytics service is involved.

## Browser-Proven Journeys · Edition 11

Every pull request and `main` push now has a **blocking Chromium acceptance gate** after the existing public data, JavaScript syntax, unit-test, production build and Pages audit checks. Deployment depends on the successful completion of this real-browser verification.

The gate exercises the actual built static site served locally under its canonical `/FieldConstellation/` GitHub Pages subpath. It tests:
- Desktop project deep links, inspector and opt-in Passport saving across reloads.
- Choosing two saved worlds, creating a postcard and the selectable copy fallback when clipboard access is unavailable.
- A separate anonymous browser opening the postcard without automatically importing favorites, explicitly saving the public collection, and navigating to the selected project's star.
- A touch-enabled mobile viewport with accessible postcard preview and Escape dismissal.
- A forced **no-WebGL2** environment with a usable public repository directory.
- Checks for uncaught JavaScript errors, public inventory rendering, correct URL cleanup, and no inadvertent history export.

The workflow uploads a small screenshot packet to the workflow artifacts for visual review. The browser tool is **CI-only**, installed temporarily in GitHub Actions after `npm ci`; it is not a new browser/runtime app dependency. To run locally:

```bash
npm ci
npm run build
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
npm run acceptance:browser
```

The acceptance gate verifies concrete scripted journeys. It does **not** claim exhaustive accessibility, production network availability, content correctness or general human sign-off.

## Accurate counts and live destinations

The bundled snapshot contains **177 public repositories**, fetched on 21 October 2026. The current public listing was fully paginated and compared with Edition 02: no added or removed repositories; ten records had metadata changes.

The earlier owner-only hosted snapshot had **212 records: 176 public and 36 private**. The later public export included FieldConstellation itself, bringing its public total to 177. These are different scopes and capture times. This public application contains no private repository records, names, IDs or URLs taken from that private inventory. See the [audit](docs/EDITION_03_AUDIT.md) for the exact reconciliation and its limits.

**Pages enabled is not the same as a working application.** The bundled observation checks 127 eligible HTTPS destinations: **126 returned an HTML document and one returned 404**. The header counts recent HTML observations, separately from the 126 Pages flags. Each inspector shows its own check date and status.

**Explore This World** appears only for a matching destination checked within seven days. The check requires a 2xx `text/html` response and an HTML document marker within the first 8 KiB. It does not test every application feature, iframe support, authenticity or continuous uptime. Restricted/time-limited requests are inconclusive. Stale, unavailable, unchecked and undeclared destinations have explicit explanations; declared unverified URLs remain separately labeled.

## The Atlas bridge

The public [Field Atlas entrance](https://michaelwave369.github.io/FieldAtlas/) was read from public repository metadata and checked over HTTPS. Constellation links to that entrance globally and to **124 reviewed public chapters** where the shared Atlas manifest supports them. Other projects open the entrance without promising a chapter. Browser-customized Atlas shelves may differ.

Shareable Constellation links use the stable GitHub repository ID:

```text
?repo=github:1428952721
```

Only records in the currently loaded public inventory resolve. An unknown ID never triggers a private lookup or an external redirect. The Atlas continues to use its existing `?chapter=RepoName` interface. No FieldAtlas files are changed; the [bridge proposal](docs/ATLAS_BRIDGE.md) describes future ID alignment.

## Run, test and build

Requires Node.js 22 or later. No account, paid API, server secret or new runtime dependency is needed.

```sh
npm ci
npm run check
npm test
npm run build
npm run build:verify
npm run preview
```

Open `http://localhost:4173/FieldConstellation/`. Assets and modules use relative paths, including fonts and rendering code. The preview server also accepts `/`.

## Refresh public data

```sh
npm run refresh
npm run destinations:check
npm run atlas:refresh
npm test
npm run build
npm run build:verify
```

Review the JSON diff and submit a PR. These commands update separate checked-in observations:

- `refresh`: validates every page of the anonymous GitHub public inventory and atomically replaces `src/repos.json`. An incomplete, duplicated, invalid or non-public response leaves the saved file unchanged.
- `destinations:check`: bounded HTTPS checks of public homepage/Pages candidates, with six workers and no app actions. Review failures and redirects. Re-run at least weekly if fresh availability buttons are desired.
- `atlas:refresh`: maps the Atlas’s public shared manifest to IDs already in Constellation’s public inventory. Empty or invalid results preserve the chapter map.

Browser refresh updates only that browser’s public cache. It preserves the displayed dataset on failure and handles GitHub rate limits with a useful message. It does **not** silently reset destination/evidence check dates. The snapshot remains usable without refreshing.

To add a relationship, review public source, add a typed record and commit-pinned evidence to `src/relationships.json`, and run the tests. Both endpoint IDs and evidence repositories must belong to the public inventory. Do not auto-promote thematic similarity or a README claim into a proven dependency.

## Deployment and architecture

The existing GitHub Actions workflow validates, tests, builds, audits `/FieldConstellation/` assets and uploads the Pages artifact. Only `main` deploys. Pull requests cannot deploy to production. Pages uses GitHub Actions as its configured source.

See [architecture](docs/ARCHITECTURE.md), [milestone/requirements](docs/EDITION_03_MILESTONE.md), [validation](VALIDATION.md), [changelog](CHANGELOG.md) and [Grok provenance](GROK-INTEGRATION.md).

App code remains MIT licensed. Three.js is pinned to `0.180.0` and MIT licensed; DM Sans retains the SIL Open Font License. The build preserves both vendor notices. Hardware WebGL verification and a complete ecosystem relationship review remain open work.

**Ledger Above Ego.**
