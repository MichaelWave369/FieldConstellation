# Edition 26 · Planet Connections Explorer

Prepared 2026-11-04. Scope: `MichaelWave369/FieldConstellation` only. The current GitHub Pages deployment and the separate `enterthefield.org` and `phi-field.com` sites are **not changed in this draft**.

## What visitors can do

1. Turn on **Relationships** in the Phitarium header and choose **Explore sourced connections ↗** in the existing architecture panel. Alternatively, expand a project's Planet Dossier and use **Explore source connections ↗**.
2. The new modal shows the separately reviewed **source-grade public relationship ledger**. Project selection defaults to the currently selected reviewed public project when available, otherwise All reviewed projects.
3. Filter by **Project**, **Source grade** (all, verified in source, documented contract), and **Evidence search** (project names, relation summary, scope, source claims). **Clear filters** restores the full reviewed list.
4. Each result lists both public endpoints with direction arrows; relation kind, reviewed date, summary; and a native expandable section with scope boundaries and **commit-pinned, line-specific GitHub source citations**.
5. The endpoint controls close the modal and open the normal inspector. If existing map filters hide that repository, they are cleared on this **explicit visit**. The architecture neighborhood is then highlighted; Passport/Quest normal visit behavior applies.
6. Keyboard and touch users have the same native select/input/button controls and can dismiss the modal with Escape or the visible Close button.

## Source truth contract

- Only `resolveRelationships()` results from the separately dated `src/relationships.json` are supplied to the new `connectionExplorerIndex()`. The resolver rejects invalid schema, private/missing endpoints, unsupported status upgrades, mutable URLs, claims without commit-pinned lines, and other invalid evidence.
- `src/connection-explorer.js` independently discards missing or non-public endpoints, conceptual associations and duplicate edge IDs. It contains no network requests, storage writes or derived integration guesses.
- **Verified in source** means inspected source or package declarations support the bounded stated claim; **Documented contract** means a public document describes the contract. Neither means a deployed bridge or observed end-to-end integration.
- Thematic neighbors from the solar map, planet dossier and optional architecture overlays are **excluded** from the sourced connection explorer.
- A missing relationship does not mean two repositories are unrelated. Review coverage and source inspection dates remain plainly visible.
- Source hyperlinks keep the existing validated and pinned public GitHub URL plus `rel="noopener noreferrer"`. Repository names, summaries, claims and IDs are HTML-escaped before insertion.
- No new data source, background scheduler, GitHub write automation, token, third-party asset, analytics, Netlify build, DNS change or hosting cutover is added.

## Review and acceptance

- `npm ci && npm run check && npm test && npm run build && npm run build:verify`
- Existing CI Playwright suite `npm run acceptance:browser`: uses an isolated browser context so explicit visits do **not** modify the original Quest/Passport fixtures. Check a known public project, status and project filters, an evidence search, native details with commit-pinned GitHub URL, inspected endpoint, and Dossier shortcut.
- Test responsive 390px browser and no-WebGL2 Canvas fallback; confirm counts match reviewed public edges.
- Manually verify native keyboard accessibility, source-opening in a separate tab, Escape and Close behavior, and physical Quest 3 browser input. **Physical Quest testing is not yet verified.**
- Confirm all six existing Phitarium layouts, the Field Gateway, and all Six Houses still work before approving merge.
