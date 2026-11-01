# Edition 13 · The Infinite Tinkerer RPG

A **playful, optional overlay** on FieldConstellation's public-only map, not a development status or capability audit.

## Gameplay loop
- Open the **Quest Journal** in the map header. Eight constellation branches show explored / available public worlds, thematic skill progression, and the next unvisited public star in each branch.
- Exploring a project in the existing map, index, directory, guided trail, or journal awards that *browser* one discovery (10 **game XP**, once per repository).
- The 3 / 6 / 9 / 18 / 36 / 72 discovery ranks and eight local achievements make progress visible. The Quest color lens distinguishes discovered stars from undiscovered ones.
- Existing Field Passport favorites remain bookmarks. Neither favorite saves nor repository counts are interpreted as successful builds.
- Source-verified relationship endpoint exploration unlocks one specifically labeled **evidence trail** achievement. It does **not** imply runtime interoperability.

## Truth and privacy boundaries
- The journal is stored as a versioned localStorage record of **known public numeric GitHub IDs only**. No account, private repositories, backend, analytics, PR actions, CI lookups, or network mutation.
- An existing Passport's saved/recent IDs seed the quest journal **only the first time** Quest Journal runs. Resetting explicitly writes an empty journal, so it stays reset.
- Refreshing the public inventory drops no-longer-public IDs. A failed storage write leaves this session playable but warns.
- The UI's **Reset discoveries** is separate from and does not erase the Passport.
- A source-verified relationship is a reviewed source observation, *not* an integration runtime test. All skill-tree branches are **editorial categories**.
- **XP** is a game mechanic only. Green tests, releases, deployments, merged PRs and integration state require independent, current evidence and are intentionally not awarded here.

## Verification
`npm run check && npm test && npm run build && npm run build:verify`
Use the existing Chromium acceptance workflow to exercise navigation and Passport regression, then manually test a Quest Journal open, discovery, quest lens, and reset in production preview.
