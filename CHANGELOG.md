# Changelog

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
