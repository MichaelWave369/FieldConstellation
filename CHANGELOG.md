# Changelog

## Edition 09 · Coverage Ledger — PR milestone

- Add a read-only, separately dated Atlas ↔ Constellation public coverage ledger accessible from sidebar filters.
- Reconcile curator-reviewed chapters and Atlas's verified published HTML inventory against the displayed public repository IDs, with a readable mismatch list.
- Reuse validated anonymous public GitHub inventory refresh to resolve newer public projects without changing Atlas source manifests.
- Export a local JSON receipt with source dates, counts, mismatches and explicit caveats, excluding all visitor data.
- Fail closed on invalid manifests instead of reporting misleading zero coverage; add deterministic tests of 177/124/126/125 counts and PhiOS-XR divergence.
- Retain all layouts, Passport, tours, Atlas doors and sourced technical relationship classifications.


## Edition 08 · Atlas Pulse — PR milestone

- Keep the existing curator-reviewed Atlas chapter filter and add a separate dated, public Pages-verified-site filter.
- Record Atlas's published public Pages inventory with 126 verified sites at 2026-10-22 02:54 UTC. Resolve 125 against Constellation's existing 177 public repositories; do not invent the missing site.
- Show exact source date, count and provenance in sidebar and About without confusing published sites with the Atlas's larger living book.
- Offer canonical `?project=github:<numeric-id>` chapter navigation for matched published projects using the Atlas's newly deployed public-ID bridge.
- Validate snapshot source, unique identities, public scope and Pages build output; keep all filters local-first with no new runtime dependencies.


## Edition 07 · Atlas Lens — PR milestone

- Filter the existing Constellation and directory to reviewed public projects that have a chapter in the independently dated Atlas map.
- Show a reviewed Atlas chapter count and map date; explicitly distinguish the reviewed subset from the live Atlas catalog.
- Label reviewed project inspector entries and preserve the existing book chapter links.
- Test that only currently public repository IDs can enter the lens; reject invalid, unknown and private chapter identifiers and malformed maps.
- Document a separately authorized Atlas-side canonical-ID return link proposal without changing FieldAtlas.
- Preserve the existing 3D layouts, source-backed relationship ledger, personal Passport, guided tours and safe static deployment.


## Edition 06 · Field Passport — PR milestone

- Add a browser-local Field Passport to bookmark and revisit public repository worlds.
- Track a bounded list of recently selected public projects and keep public numeric IDs only.
- Add a save toggle in the project inspector and a searchable-by-browsing Passport dialog for favorites and recent discoveries.
- Add a portable JSON favorites export/import; reject malformed data and drop stale or private IDs, preserving local recent history.
- Require confirmation to clear either collection, and gracefully degrade when local browser storage is blocked.
- Preserve the relationship ledger, curated tours, stable links and existing five layouts with no backend or runtime dependency.


## Edition 05 · Shareable Journeys — PR milestone

- Restore guided trails from validated `?trail=<id>&stop=<n>` public-only permalinks, optionally paired with the matching stable repository ID.
- Add a Copy stop link action and text selection fallback for restricted clipboard permissions.
- Push browser history when navigating tour stops, and restore the correct trail on Back/Forward.
- Strip tour-specific query parameters on exit or unrelated project selection without breaking ordinary project links.
- Reject stale, duplicated, inconsistent, missing/private and out-of-range link claims; add deterministic round-trip and privacy tests.
- Keep curated tours editorial and independent of the evidence-backed Relationships layer.


## Edition 04 · Guided Trails — PR milestone

- Add three curated routes across the public Field: First Light, The Makers’ Workshop, and Research & Receipts.
- Provide a keyboard-accessible trail chooser and compact previous/next/exit controls that focus each public stop in the existing map and inspector.
- Resolve stops only against the validated public snapshot; missing or private items are skipped, and unusable routes are hidden.
- Explicitly label routes as editorial, independent of evidence-backed relationships; retain the five layouts, themes, rendering fallbacks, Atlas bridge, and deployment gates.
- Add deterministic public-scope tests for trail curation without fetching private repository data or introducing dependencies.


## Edition 03 · The Living Architecture — PR milestone

- Add optional Relationships across all five existing layouts, direct-neighbor emphasis, fit-connections and per-project evidence cards.
- Seed eight public connections: five inspected source facts and three documented contracts, with pinned citations, direction, review dates and scope. Keep thematic links optional and visibly editorial.
- Expand discovery with topics, README links, stable public project permalinks, related projects and dated destination explanations; retain random-world exploration.
- Add checked Atlas navigation and reviewed chapter links without changing FieldAtlas.
- Refresh 177 public records and replace declared-URL “live” counts with recent HTML observations. Record 126 reachable HTML destinations and one 404 from 127 checks.
- Share strict snapshot/cache/refresh validation, preserve last valid data on failure, and atomically refresh checked-in JSON.
- Extend the existing CI build with a Pages subpath/asset/data audit. Preserve MIT notices, Three.js pin, fonts, themes, Canvas fallback and production-only-on-main deployment.

The candidate does not certify every destination feature, live integration or unreviewed project relationship. Broader evidence coverage, hardware WebGL QA, ongoing destination review and the separately proposed Atlas canonical-ID alias are next-edition work.

## Edition 02 · Constellation × Lattice

Combined the original world map with Grok-inspired language orbits, golden-angle spiral, color lenses, indexing, filters and metadata. Exported a public-only 177-repository snapshot and deployed GitHub Pages while retaining the separate owner-only application.
