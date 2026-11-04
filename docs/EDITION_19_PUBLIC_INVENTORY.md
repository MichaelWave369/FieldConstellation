# Edition 19 · Public repository identity audit

Date: 2026-11-04. Scope: **public owner repositories only**.

Four paginated connected GitHub search pages (100 + 100 + 60 + 0): 260 accessible owner repositories, of which 225 were public and 35 private. Baseline snapshot: 211 public, 2026-11-01. All 211 prior IDs still public, no detected renames or removals. Fourteen new public identities, independently checked using public repository API metadata:

- [CompAware](https://github.com/MichaelWave369/CompAware) · numeric GitHub ID `1443220237`
- [PhiRSI](https://github.com/MichaelWave369/PhiRSI) · numeric GitHub ID `1446073096`
- [phi-field](https://github.com/MichaelWave369/phi-field) · numeric GitHub ID `1442243366`
- [ElsewhereEngine](https://github.com/MichaelWave369/ElsewhereEngine) · numeric GitHub ID `1443725257`
- [ShedofShadows](https://github.com/MichaelWave369/ShedofShadows) · numeric GitHub ID `1442446370`
- [InfiniteTinkerer](https://github.com/MichaelWave369/InfiniteTinkerer) · numeric GitHub ID `1443672621`
- [RetroVerse](https://github.com/MichaelWave369/RetroVerse) · numeric GitHub ID `1443315535`
- [Blackout](https://github.com/MichaelWave369/Blackout) · numeric GitHub ID `1442092735`
- [PaperGhost](https://github.com/MichaelWave369/PaperGhost) · numeric GitHub ID `1443390000`
- [Altermath](https://github.com/MichaelWave369/Altermath) · numeric GitHub ID `1444899374`
- [G-FunkProp](https://github.com/MichaelWave369/G-FunkProp) · numeric GitHub ID `1443505759`
- [PhiMadaPrime](https://github.com/MichaelWave369/PhiMadaPrime) · numeric GitHub ID `1443845098`
- [PhiBridge369](https://github.com/MichaelWave369/PhiBridge369) · numeric GitHub ID `1445969352`
- [RacetoOblivion](https://github.com/MichaelWave369/RacetoOblivion) · numeric GitHub ID `1442178365`

The 35 private records are excluded entirely. The 211 older public records retain their historical metadata and have not been re-fetched field-by-field; the `fetchedAt` value signifies complete identity reconciliation only. Atlas chapters and reachability checks, architectural relationships, app installation, CI success and native release health were not refreshed or inferred.

**Thematic groups** in this edition are editorial discovery aids, not executable dependencies. The fully paginated client-side Refresh action uses only anonymous public GitHub REST; failures leave the prior complete snapshot untouched. No automated Netlify use is introduced.

Acceptance: `npm ci && npm run check && npm test && npm run build && npm run build:verify`; then the existing `npm run acceptance:browser` with CI-only Playwright. Check 225 public stars, searchable additions, stable previous saved identities, correct Six Houses navigation. No manual workflows, merge, Netlify or domain cutover in this draft.
