# Atlas ↔ Constellation: two-way identity bridge proposal

**Status:** proposal only. This PR changes FieldConstellation, not FieldAtlas.

## Existing public contracts (21 October 2026)

- FieldConstellation uses stable public repository identities: `github:<numeric-id>`.
- A deep link `?repo=github:<id>` selects the matching currently public project.
- FieldAtlas currently accepts `?chapter=<RepoName>` and exposes its own browser-local visitor passport and project suggestion panel.
- The Constellation's `src/atlas.json` is a **dated reviewed subset** (124 public chapter identities observed October 21); the live Atlas was observed with a larger catalog later. Treat the reviewed subset and live library as different observations. The new Atlas Lens is intentionally scoped to the dated reviewed subset.

## Separately proposed Atlas-side improvement

When the owner authorizes changing FieldAtlas:

1. Add an optional `?project=github:<numeric-id>` alias to the existing Atlas deep link handler.
2. Resolve the ID **only against the already loaded public Atlas catalog and its reviewed public manifest**. Do not perform authenticated lookups, speculative name matching, or private API queries. Never resolve raw user-supplied numeric IDs against unreviewed endpoints.
3. Preserve the existing `?chapter=<RepoName>` and `?tour=<known-id>` behaviors, reader history, filters, local shelf curation, and visitor passport. A stale/invalid project ID should show a friendly directory fallback, not silently open the wrong chapter.
4. In the Atlas reader, show **View in Field Constellation** only when the current chapter has a validated, public numeric GitHub ID in the reviewed Atlas catalog. Build its destination as `https://michaelwave369.github.io/FieldConstellation/?repo=github:<id>`.
5. Distinguish the Atlas's editorial "Field Constellation" suggestions from the Constellation's commit-pinned technical relationship ledger. Do not represent one as the other.
6. Test repository rename survival, missing/private/stale IDs, duplicate URL parameters, a chapter with no reviewed ID, and return navigation on mobile.

**No shared cookies, data sync, cross-origin storage access, iframe embedding, or passport uploads.**

This design intentionally keeps both applications independently usable. It is a proposal rather than authorization to edit FieldAtlas.
