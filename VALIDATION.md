# Edition 03 validation receipt

## Intake and boundaries

Controlling request and coverage: [milestone receipt](docs/EDITION_03_MILESTONE.md). Untouched source: `d3be07cea3da86353e047d595ca2470e1221a957`. Work is a feature-branch candidate for review; it is not merged or independently release-certified.

## Results observed locally

| Check | Result |
| --- | --- |
| Edition 02 syntax, seven tests, production build | Passed before application changes |
| Production baseline workflow `39680831373` | Build and deploy completed successfully |
| Baseline Pages subpath | HTML plus eleven assets returned HTTP 200 |
| Fresh anonymous public inventory | Two pages, 177 unique public repositories; zero added/removed IDs vs bundled Edition 02 |
| Current destination probes | 127 checks: 126 2xx HTML documents, one HTTP 404 (LoopCatch) |
| Public Atlas entrance | HTTP 200 HTML; shared manifest mapped to 124 public chapter IDs |
| Edition 03 JavaScript syntax | Passed |
| Edition 03 tests | 20 passed, 0 failed |
| Production build | Passed |
| Pages build audit | Passed: relative HTML/module/font paths, licenses, public snapshot and all eight ledger records |

Tests include the original five layouts with empty, single, small and 600-project inventories; true chronological edges; language rings; composable filters; activity keys; URL safety and metadata. New checks cover full pagination, second-page failure, private/foreign/duplicate records, pagination caps, rate limits, cache scope/future dates, public query IDs/renames, bounded Atlas links, pinned source/direction validation, optional thematic edges, direct-neighbor sets, HTTPS redirect limits, empty/non-HTML responses, inconclusive checks and seven-day staleness.

The destination sweep inspected at most 8 KiB per response, did not authenticate, and did not execute destination-app actions. These results are observations at the JSON timestamps, not continuous uptime or full functional tests.

## Failure preserved and repair

The first new asset-audit run failed with `Unresolved bare module: three/addons/controls/OrbitControls.js`. Inspection found a commented documentation example in the vendored library. The scanner now removes block comments before reading static import references. Re-running the build audit passed. No application path was changed to hide a failure.

Pointer testing found the new thematic checkbox inherited `pointer-events: none` from the decorative caption. The relationship control panel now opts into pointer events; the checkbox and Fit connections were retested successfully. Related-project navigation also initially retained the inspector scroll position; selecting a different project now resets the panel to its heading. Mobile review identified control/panel overlap and an unnamed icon-only Directory button. The mobile relationship caption/pane/camera offset were adjusted, the button received an accessible name, and 390 × 844 checks confirmed the repair.

## Browser and deployment review

The candidate was exercised through the supported internal Sites preview server in the browser, using the exact built public assets. Desktop checks covered all five layouts, Field/Lattice theme switching, thematic and relationship-link toggles, directory, direct-neighbor tracing, evidence expansion, related-project navigation, stable project-link reload, unavailable/no-destination explanations, topics, empty recovery, the `/` keyboard shortcut and random discovery.

At a 390 × 844 iframe viewport, navigation, search, explicit project selection, tracing, thematic controls and the accessible directory were exercised. The relationship controls and inspector did not overlap; the document had no horizontal overflow. Pages filtering displayed 126/177, adding Hide forks displayed 125/177, and reset restored 177/177. The test waited for the sliding navigation to settle before interacting with offscreen filters.

A controlled missing optional relationship asset disabled that layer and showed its recovery message while the Canvas map and 177-entry directory remained usable. The asset was then restored. Application-source JavaScript errors were not observed during normal smoke paths; browser-extension metadata errors were unrelated, and the deliberate missing-resource test was expected.

The review screenshot in `docs/images/edition03.jpg` shows the tested candidate. No new hosted Site was created; preview stayed internal. PR CI is checked after opening the PR. Production remains the existing Edition 02 main deployment until a human merges.

The prior Edition 02 explorer was exercised in the available browser’s Canvas fallback at desktop and 390 × 844 sizes. Hardware WebGL is unavailable in that browser. Hardware rendering, physical touch/pinch devices, changed OS reduced-motion preferences, headset/VR use, every destination application feature and cross-project runtime qualification remain unverified. Existing reduced-motion branches were preserved and reviewed in source.

## Reproduce

```sh
npm ci
npm run check
npm test
npm run build
npm run build:verify
```

Network observations can be refreshed separately using the commands in the README. Runtime dependencies remain unchanged, and vendor MIT/OFL notices are preserved.
