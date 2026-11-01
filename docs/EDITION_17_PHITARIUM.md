# Edition 17 · THE PHITARIUM

**The Phitarium** is a planetarium presentation layer built *into* the existing FieldConstellation application. It transforms the observatory into a celestial public-repository theater without renaming the repo, discarding its five star layouts, or changing its RPG progression.

## What visitors see

- A deep midnight-blue, indigo and ice-cyan projection chamber with a curved observational dome, zenith and horizon markings, a new Φ Phitarium wordmark, refined map instruments and translucent glass panels.
- A real **hemispherical meridian and altitude grid** drawn as bounded, low-opacity 3D line segments behind the real public repository stars. The same lines are projected by the existing CPU Canvas renderer, so visitors without WebGL still see a recognizable planetarium.
- A restyled public Field Passport, Quest RPG, Nine Gates and Outer Field. **No gameplay or evidence records** have been rewritten by the visual overhaul.
- An optional **Dome Show** on the map header. It projects a six-star, one-pass short presentation using only public, currently displayed repository data: FieldConstellation, FieldAtlas, PhiOS, PhiServe, BTM and GenEWrist. These are *examples*, not claims of runtime integration.
- Each star is focused using the existing 3D camera. A visitor may manually advance, end the show, or explicitly **Explore this star** to open its existing inspector.

## Controls and privacy

- **Start Dome Show** begins a user-controlled fly-through of the **currently visible** public stars from the six-star curated set. A frame lasts eight seconds; after the final frame the show stops. It does not loop indefinitely. With filters applied, missing stars are skipped; if fewer than two eligible stars remain, the UI asks the visitor to select **Show all** to enjoy the full tour. Filters and current layout are not changed.
- **Next star** advances immediately. **Explore this star** intentionally invokes the ordinary repository selection flow, which may update the browser-local discovery history. Simply *watching* does **not** change the current selection, collect a star, award XP, bookmark anything, or modify the URL/history. Ending the show restores the previously visible inspector.
- Mouse dragging the sky, changing layouts, refreshing the public listing or choosing a star stops the show. **End show** is always available and restores the viewer's earlier orbit preference.
- When the browser document is hidden, the show stops advancing until the tab is visible again.
- With **reduced motion**, the show still works but does not auto-advance and camera transitions are immediate. Keyboard and screen readers can operate the existing header and show buttons.
- Show content comes from the validated current **public-only** repository snapshot, skips missing/private projects, and uses the existing public descriptions. There are no private repo lookups, additional API calls, user profiles, accounts, saved show telemetry, new fonts, external image/video assets or network dependencies.
- The existing **Field / Lattice** look toggle becomes a blue/cyan vs amber presentation spectrum while preserving its previous function.

## Truth boundaries

- The dome and stars are a visual interface over *public GitHub repositories*, not an astronomical simulation of real celestial objects or a claim that the projects are linked at runtime.
- The original relationship ledger, destination probes, Atlas source classes and publish timestamps remain independently dated and unchanged.
- The RPG remains educational fiction. A visual guide or showtime sequence is not a live build, WebXR qualification, CI result, deployment health test or authorization.
- Project descriptions are editorially sourced from the public GitHub inventory; they can become stale and should be verified in the linked repositories.

## Test contract

`npm run check && npm test && npm run build && npm run build:verify && npm run acceptance:browser`

The automated browser test checks the visual Phitarium shell, public Dome Show order, Play/Next/End behavior, no silent Passport or Quest discoveries, and the non-WebGL2 planetarium fallback. Existing desktop, mobile, postcard, Atlas, Nine Gates and Outer Field playthroughs remain regression-tested.
