# Validation

## Automated checks

Run `npm run check`, `npm test`, and `npm run build`.

The model tests cover five layouts with empty, single, small, and 600-repository inventories; unique finite coordinates; chronological edges; language-ring spacing and same-language peers; composable search, visibility, Pages and fork filters; activity threshold colors; safe outgoing URLs; public refresh metadata; and the public-only, unique-ID snapshot with its reconciled reference inventory.

The build copies the app, local font assets and licenses, and the pinned Three.js modules into `dist/`. Relative URLs support `/FieldConstellation/` hosting. No credential or backend is required by the browser.

## Visual verification

The combined explorer was exercised at desktop size and in a 390 × 844 mobile viewport. Layout switching, language/activity colors, the gold theme, index selection, search, filters, directory, repository facts and modal controls were checked in the Canvas fallback. The public export is checked again against its own build and public inventory before publication.

The available browser disables hardware WebGL. The Canvas renderer was verified; the hardware WebGL path still needs a check on a WebGL-enabled device. Links and positions represent navigation and associations, not an audited dependency graph.
