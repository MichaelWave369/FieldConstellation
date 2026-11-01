# Edition 18 · Phitarium Immersive Dome

The **Immersive Dome** is a full-viewport planetarium mode inside the existing FieldConstellation site. It is an exhibition *presentation*, not a separate site, VR application, automated agent or gameplay reset.

## What visitors experience

Select **Enter Dome** in the regular map header. The sidebars, inspection panels, map header and technical footer disappear. The actual WebGL or Canvas public-repository map expands to the full screen, framed by the existing projected dome and an atmospheric nebula field. Two very occasional decorative shooting stars cross the scene. The atmosphere uses bundled CSS, not downloaded media or speculative integrations.

A compact exhibition console lets visitors visit twelve curated public project exhibits using **Previous / Next** or left/right arrow keys. The project name, editorial group, and original public inventory description update as the camera travels between those stars:

FieldConstellation, FieldAtlas, PhiOS, Agentora, Domistika, BTM, Pulse369, CycleWeave, PhiServe, PhiXRCommons, GenEWrist, and FieldAccord.

The itinerary contains only *currently available, public* repository records and honors the ordinary map's existing visible filters. Missing or private stars are skipped. With fewer than two visible examples, the site explains how to view all.

### Deliberate actions vs passive viewing

- **Previous/Next**, reading an exhibit, or dragging the dome are **read-only** and do not edit bookmarks, discoveries, XP, the current selected project, or browser URL.
- **Read project README** opens that selected public repository documentation in a new tab using a validated GitHub URL.
- **Explore this star** explicitly exits presentation mode and uses the existing regular project-selection flow, including its normal browser-local visit and discovery mechanisms.
- **Quest RPG** exits the immersive stage and opens the existing Quest RPG without altering its progression.
- **Exit Dome** or **Escape** restores the sidebar, normal dashboard, previous inspection panel, orbit setting, selected project and camera viewpoint. Closing a deep-linked project does not silently rewrite its URL.
- This is a spatial exhibition, not an assertion that project pairs are integrated or operational.

### Accessibility and performance

- Screen-reader labels and visible buttons work with keyboard, touch or mouse. Arrow keys navigate the exhibits. Focus is placed on Exit Dome on entry and returns to Enter Dome on exit.
- `prefers-reduced-motion: reduce` turns off meteor animations and uses immediate rather than eased camera movement.
- The nebula and shooting stars are decorative CSS with `aria-hidden` and `pointer-events:none`, so they do not block map controls or require a GPU shader.
- Existing Canvas 2D fallback keeps the same interactive exhibition controls on browsers without WebGL2.
- No audio autoplay, accounts, remote rendering, analytics, external images, new JavaScript dependencies, or privileged GitHub actions.
- A returned visitor can still use the five layouts, source-reviewed relationships, Field Passport, Nine Gates and Outer Field, whose saves remain unchanged.

## Recent HTML verification display

An earlier dated `deployments.json` ledger was last checked **October 21, 2026**. At the present November 1 run it is outside the site's stated seven-day freshness limit, so **zero fresh verified checks is not the same as zero working sites**.

The UI now displays **— / checks expired** when the overall verification ledger is stale. A recent valid ledger displays only independently verifiable HTTPS HTML observations that match the **current** public candidate URLs. The number never certifies app health or runtime integrations. The existing HTTPS bounded-probe script, ledger schema and seven-day cutoff are not weakened or refreshed merely to raise a number.

## Verification

`npm run check && npm test && npm run build && npm run build:verify && npm run acceptance:browser`

Chromium acceptance covers desktop fullscreen layout, read-only navigations, keyboard Escape restoration, deep-link integrity, explicit Explore behavior in a clean visitor context, Quest launch, mobile presentation, and Canvas fallback. Unit tests verify curated public-only exhibits, missing/private omission and exact verification freshness semantics.

## Next potential stages (not yet implemented)

- Full guided narration with closed captions and user-controlled voice playback.
- Audio-optional ambient soundscapes generated from original recordings.
- A bigger museum floorplan where different constellation sectors have distinct exhibit halls.
- Browser WebXR dome viewing after opt-in permissions and physical headset acceptance.
