# Edition 25 · Planet Dossier

Prepared 2026-11-04. Scope: FieldConstellation static browser app, no live-site cutover or domain changes.

## User-facing behavior

1. Select a repository in the Phitarium (regular star, Directory, Solar Discovery, or deep link).
2. Press **Dossier ⤢** in its inspector heading. The narrow inspector expands to show a separate **Source & neighborhood** section.
3. Review the displayed public inventory **reconciliation** date, *not* a claim that every metadata field was audited on that date.
4. The sourced relationship summary reports only status=**verified** and status=**documented** entries from the validated, separately dated relationship ledger. A missing/unloaded ledger is explicitly **unknown**, never represented as zero verified connections. Zero recorded relationships is explicitly a scoped result, **not** proof of no relationship.
5. Explore up to **three nearby public stars** from the same editorial category, filtered by the current visible-ID set. Same-language projects appear first, followed by the most recent code-push dates, then deterministic name ordering. A nearby project is **not** an API dependency or verified integration.
6. Select a neighboring star to open its normal project inspector; source citations, external GitHub links, Atlas material, Passport, Quest and dated destination state remain in their existing places.
7. Press **Compact ⤡** to return to the original narrow view. Expansion is per current browser tab, not an account or remote preference.

## Boundaries and semantics

- `src/planet-dossier.js` is pure, deterministic for a given input and never fetches data or writes to storage.
- The dossier uses the already validated **public** inventory and reviewed relationships, excluding private records and items filtered out by the visitor.
- Linkable neighbor actions use stable repository IDs and the existing `selectRepo` path. No fabricated links, code-dependency claims, health scores, inferred deployment readiness, or new diagnostics.
- The existing inspector's source-card details and separately dated reachability ledger remain the authoritative detailed evidence surfaces.
- A source connection count is not a quality score or a count of all real-world relationships.
- No additional hosting, API, GitHub scheduler, Netlify build, DNS, deployment, tracking or external libraries.
- Physical Quest 3 testing remains manual and **unverified**.

## Acceptance

- `npm ci && npm run check && npm test && npm run build && npm run build:verify`.
- In existing CI Playwright environment: `npm run acceptance:browser` tests opening and collapsing the dossier, visiting a nearby star, mobile width, Canvas-only mode and old flows.
- Keyboard: focus the Dossier button, activate with Enter/Space, tab through accessible neighbor buttons, and return to compact mode.
- Check 390px portrait mobile and desktop readability, panel scrolling and map navigation after collapse.
- Confirm current 225+ public-repository constellation and all Six Houses still navigate.
- No production `enterthefield.org` or Netlify updates until the broader one-cutover migration is explicitly approved.
