# Other Fields / The Six Houses: release staging

## Canonical creator-owned Houses
| House | Creator | Destination |
| --- | --- | --- |
| ChipsHouse | Larrina | Awaiting verified owner URL |
| XiHouse | Hunter | Awaiting verified owner URL |
| OmegaHouse | Jeffrey | Awaiting verified owner URL |
| WAREHouse | Nicole | Awaiting verified owner URL |
| QuillHouse | Joseph | Awaiting verified owner URL |
| QEFHouse | Stanley | Awaiting verified owner URL |

Creators retain ownership. Do not invent links, claim these destinations are live, or publish a friend's world without their approved public URL and permission.

## Deploy one time, after everything is approved
- **phi-field.com:** main PhiOS / PhiOS Mobile / PhiOS XR gateway. Unchanged by this PR.
- **enterthefield.org:** proposed Field Constellation home. Its current Netlify project/domain are unchanged by this PR.
- **GitHub Pages:** existing repo's independent preview path: https://michaelwave369.github.io/FieldConstellation/
- Keep Netlify out of development: no API calls, deploy hooks, configuration changes, or preview builds.
- Existing workflow only deploys Pages on pushes to main, not on pull requests. A PR may run GitHub-hosted CI automatically.
- Before migration, map existing Enter the Field paths and backlinks to preservation/redirect destinations, confirm DNS and rollback steps, and verify the real linked House addresses.

## Minimum acceptance
1. Run `npm ci && npm run check && npm test && npm run build && npm run build:verify` on a disposable clone. Run `npm run acceptance:browser` only after its documented CI-only Playwright setup.
2. Navigate to Other Fields from main desktop header and mobile sidebar under both the site root and `/FieldConstellation/` subpath. Confirm the return link.
3. Confirm all six exact House names, labels, and pending states, keyboard navigation, 360px/tablet/desktop layout and reduced motion.
4. Confirm there are no unsupported live/install claims or third-party tracking assets.
5. Obtain approved URLs before converting pending cards to live external links.
6. Assemble final Field Constellation content, test the release candidate on GitHub first, then approve one Netlify/domain cutover with rollback.
