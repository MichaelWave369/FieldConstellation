# Edition 23 · Solar Navigator

## Objective
Make the six-layout Phitarium's new Solar Systems view explorable beyond rotating an entire star chart. Visitors should be able to choose a category sun, move the camera toward it, inspect visible planets, and return to the full sky.

## Visitor interactions

- Open **Solar Systems** from the bottom map layout controls.
- A compact **Solar Navigator** panel becomes available with an accessible `Focus system` selector, dynamic public-repository counts, and an **All systems** reset button.
- Choosing a sun filters the displayed planets to that category (respecting all other active filters), stops automatic camera rotation, and flies into the category's center. A 3D sun can also be clicked/tapped as a pointer shortcut.
- **All systems** clears only the category focus, retaining any other active search, language, GitHub Pages, Atlas, and fork filters.
- If additional filters leave the selected category empty, the map preserves those filters and informs the visitor. Use the existing **Show all** control to clear all filters.
- The existing sidebar category buttons use the same focus action in Solar Systems mode.
- The selectable directory, repository inspector, Passport and Quest data remain browser-local and retain their previous behavior. Changing a category does not create relationships or modify user saves.

## Technical and safety boundaries

- No new GitHub API calls, server, service worker, Netlify function, analytics tracking, or scheduled deployment.
- The dropdown, category counts, and camera use the **current validated public inventory**, including browser-local auto-refreshed data.
- Suns are illustrative category nodes, not GitHub repositories or verified dependency hubs. Existing source-graded Relationships mode retains its own separate evidence contract.
- Sun pointer picking uses the same existing perspective camera projection as repository picking. Public repository planets take precedence when overlapping a sun.
- Animation is **off by default** and respects reduced-motion settings. The accessible dropdown works when WebGL2 is unavailable.
- Physical Quest 3 browser acceptance remains pending until tested on-device.

## Acceptance gates

1. `npm ci && npm run check && npm test && npm run build && npm run build:verify`
2. CI-only Playwright `npm run acceptance:browser` tests selecting a system, aria-pressed sync on category buttons, public visible count, All systems reset and the existing map in desktop Chromium, narrow mobile and no-WebGL2 Canvas.
3. Manual keyboard testing for selector and reset button; no horizontal overflow on mobile.
4. Manually test pointer-tapping the actual sun graphics in desktop and Quest browsers. Pointer hit testing is not equivalent to device qualification.
5. Preserve all six Houses and the existing gateway routes; no production domain or Netlify cutover here.
