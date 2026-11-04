# Edition 24 · Solar System Discovery

Prepared: 2026-11-04. Scope: `FieldConstellation` static web app, no domain cutover or hosting changes.

## Visitor experience

1. Choose **Solar Systems** from the map layout bar.
2. Select one of the eight category suns from the **Solar Navigator** dropdown or click its sun. The map zooms into its visible planets and preserves any other visitor filters.
3. Select **Discover planets & guided route** to open an accessible modal. The button remains disabled without a focused category or matching public repositories.
4. The modal displays the **three most-starred** public repos and **three most recently created** public repos in that system. Buttons open the existing Phitarium repository inspector.
5. The guided route contains up to **five unique public repositories**, combining starred, created, and last-push order. **Previous** and **Next** change the exhibit description, not the stored Passport or Quest discovery.
6. **Inspect planet** explicitly closes the dialog and invokes the existing inspector. If the visitor returns to the same system with the same visible set, the guide resumes at the previous stop. Changing the system or filtered route resets the guide.

## Truth and safety

- Public GitHub metrics are a **visual/editorial traversal aid** only. Stars and forks do not determine software quality; old push activity does not imply abandonment or security status; a source repository is not proof of a released, deployed, or working application.
- Existing `src/repos.json` and anonymous user-controlled public-refresh data are the only data sources. No new network, token, server, worker, telemetry, scheduled job, Netlify, domain, or DNS change.
- Repositories are filtered by `visibility === 'public'`, chosen `group`, and the existing visible-ID set. A private, missing or filtered-out repository cannot enter a discovery list.
- HTML for names/metadata is escaped with the existing app escaping helper before insertion. Repository selection continues to use stable numeric IDs.
- Both webgl and Canvas fallback, and all pre-existing 6 layouts, games, Passport and Six Houses remain supported.
- Desktop Chromium, mobile Chromium and Canvas fallback test the modal. **Physical Quest 3 testing is not complete**.

## Acceptance checklist

- `npm ci && npm run check && npm test && npm run build && npm run build:verify`.
- `npm run acceptance:browser` in existing Playwright CI setup; inspect desktop/mobile screenshots.
- Select category infrastructure, open modal, see three popular and three new public projects, advance/rewind guided route, close, return to all systems. Discovery is disabled for all-systems state.
- Repeat on 390px mobile and Canvas fallback, verify no horizontal overflow and accessible focus.
- Confirm all six House cards still work and no Netlify deploy was triggered.
