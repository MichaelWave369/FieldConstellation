# Edition 15 · The Nine Gates

**The Nine Gates** is an optional, playable **learning adventure** inside FieldConstellation's existing Quest RPG. The Field Constellation and Field Passport are unchanged.

## First campaign

There are **three chapters with three sequential gates each**, set in a fictional universe:

1. **The Settlement Wakes:** PhiSafe, REEL Theater, PhiOS Mobile.
2. **The Makers Forge:** LWG, PhiServe, CycleWeave.
3. **Beyond the Known Map:** Piece by Piece, Break the Matrix, PhiXRCommons.

Each gate presents a fictional task and **three real public repository choices**. Choosing a wrong project reveals a hint without a penalty. Choosing the correct one unlocks the next mission, displays a fact-checked explanation with product limitations, links to the actual GitHub README, and offers **Travel to this star** in the existing 3D map. A perfect expedition clears **9 × 30 = 270 mission XP**. This is *game XP* independent of existing discovery XP and without any CI or release authority.

## Playing

On the live [FieldConstellation](https://michaelwave369.github.io/FieldConstellation/), open **Quest RPG → Play The Nine Gates**. The mission dialog works with keyboard, touch and regular browsers; no WebXR hardware or account is required. The game builds choices only from repository names present in the current validated **public-only** inventory. If a project becomes unavailable or private, its gate does not show private metadata. Chapter progress and the next available gate are derived from the validated current list.

## Privacy and limits

- Progress uses `localStorage` key `field-constellation-missions-v1`, with **only whitelisted completed mission IDs**. It never stores answer attempts, identity, browsing history, private repository data, social accounts, telemetry or credentials.
- Sequential prefix validation rejects forged or out-of-order mission completion. Correct answers are idempotent, and replays cannot farm XP.
- Campaign reset is separate from **Field Passport**, **Quest RPG discoveries** and shared postcards. Browser storage failure means progress may be session-only.
- Fact explanations derive from the public READMEs reviewed November 1, 2026. They are curated descriptions, **not live runtime verification**. Mission examples explicitly distinguish prototypes, experimental research and planned features from deployed capabilities.
- No new runtime packages, backend, mutable GitHub calls, agent execution, or personal data handling.
- This is educational gameplay with free-form fictional worldbuilding, not a verified technical integration map.

## Verification

```sh
npm ci
npm run check
npm test
npm run build
npm run build:verify
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
npm run acceptance:browser
```

Acceptance checks wrong answers, earned XP, gate unlocks, README path, local persistence, separate reset and existing Passport regression.

## Next rungs (not implemented)

- Branching story routes with multiple legitimate solutions and explicitly modeled trade-offs.
- Optional read-the-docs scavenger hunts with source-pinned evidence and quizzes.
- Public shareable campaign completion cards, without synchronizing or disclosing private progress.
- Keyboard-first adventure map with animated encounters and accessible static fallback.
