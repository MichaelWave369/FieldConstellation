# Edition 16 · The Outer Field: Infinite Spiral

**The Outer Field** is a playable *postgame* campaign embedded in the public FieldConstellation site. It begins only after **The Nine Gates** has exactly nine valid completed gates. The old Quest RPG, Passport, Nine Gates progress, guided trails, source-reviewed architecture, privacy model, and non-WebGL fallback remain intact.

## The 3–6–9 adventure

The field opens at **9/9 Nine Gates**, then introduces nine additional encounters:

| Phase | Challenges | Public project learning |
| --- | --- | --- |
| Artifact Hunts (3) | Archivist's Lens, Memory Shard, Guild Compass | **FieldAtlas**, **PocketBrain**, **Agentora** |
| Combination Forge (2) | Book + Star Chart; Mind + Engine | FieldAtlas + FieldConstellation and PocketBrain + PhiServe have complementary *roles*, not automatically verified integration |
| Hidden World (1) | The Room Between Worlds | **GenEWrist** and its Universal / World Modes |
| The Fracture Warden (3) | Panic Signal, Permission Trap, Living Constellation | **PhiSafe**, **FieldAccord**, and a final epistemic-boundaries challenge |

The encounters follow a strict order. **Four** of them require the player to **visit a real project's star on the map** before claiming a relic, making exploration part of the game rather than merely presenting a multiple-choice question. Wrong choices supply hints; no loss, timer, online leaderboard, or punitive mechanics.

The fictional story rewards are **Archivist's Lens**, **Memory Shard**, **Guild Compass**, the secret **World Key**, two combination titles and three boss shields. Adventure XP is deterministic: 3×30 + 2×40 + 1×50 + 3×60 = **400** total game XP. There is no reward farming through replay.

Clearing the final shield unlocks an animated **Infinite Spiral portal**. Clicking it closes the story screen and switches the **existing, real Constellation map** to the golden-angle **spiral layout**, focusing its own public repository star. The portal is a visual/navigation metaphor, not an inter-app runtime interface. Animation respects reduced-motion preferences.

## How to play

Open [FieldConstellation](https://michaelwave369.github.io/FieldConstellation/) → **Quest RPG** → **The Outer Field**. Locked visitors can enter **The Nine Gates** directly from its gate screen. Clearing all nine original gates also displays a glowing portal into The Outer Field on the victory screen.

Each artifact hunt asks a project question. Once answered correctly, if its star has not yet been discovered the player is sent to the public 3D map to visit the real repository. Return via **Quest RPG → The Outer Field** and claim the artifact. The answer's explanatory panel contains GitHub README links. For visitors without WebGL2 the existing canvas renderer, index, and directory remain available.

## Truth, privacy and security

- Every repository choice must resolve from the **current validated public-only** inventory. If any required public project goes private, is renamed without an updated curatorial mapping, or disappears, this postgame fails closed rather than presenting a private or fake star.
- All repository capability summaries are curated from public READMEs as checked November 1, 2026. They can become stale; the original READMEs remain one click away.
- **Combinations are conceptual pairings.** They do **not** assert a running software bridge, working deployment or cross-repository integration. The final boss explicitly teaches the difference between public GitHub visibility, independently dated website reachability, and code/integration evidence.
- **Game XP, relics, shields, and portals never convey software execution authority, access rights, PR status, CI status, release status or runtime interoperability.**
- Browser-only save: `field-constellation-outer-v1` contains a bounded, versioned list of **whitelisted completed encounter IDs** only. It never stores user identity, account secrets, quest answers, telemetry, remote state, private repository data or personal history.
- An Outer Field reset leaves Nine Gates, discovered worlds, saved Passport favorites and postcards unchanged. Resetting an independent earlier quest can relock the Outer Field until that campaign is complete again, without erasing the separate Outer save. Removed/private projects invalidate unavailable Outer steps.
- No new runtime dependencies, remote writes, accounts, paid services, code execution, external game assets or untrusted cross-origin embedding.
- All portal navigation remains within the current public map. The animation is decorative, with an accessible status and a reduced-motion path.

## Validation

`npm run check && npm test && npm run build && npm run build:verify && npm run acceptance:browser`

The Chromium flow should play and clear the original nine gates, confirm postgame lock/unlock, discover four real public stars, claim artifacts, solve both conceptual combinations, discover the secret room, defeat all boss phases, use the portal, and verify persistence and independent resets. Unit tests cover missing/private project fail-closed, strict ordered progression, unlock prerequisites, XP accounting and invalid local save data.
