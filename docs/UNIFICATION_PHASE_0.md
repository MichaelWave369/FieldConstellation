# Φ Unification | Phase 0: inventory before integration

**Mission:** determine what has actually been built, which public components overlap, and which specific interfaces can be verified, without making an unmeasured "90% complete" claim.

**Observation dated 2026-10-25:** a fully paginated connected GitHub repository search returned 222 accessible repositories: **186 public** and **36 non-public**. Only aggregate counts of non-public repositories appear here. Do not commit their names, IDs, code, descriptions, URLs or integration claims to this public repository.

## What this PR really delivers

- `data/unification/public-capabilities.v1.json`: **25 selected public repositories**, categorized by primary capability and backed by the exact SHA-1 blob identity of each inspected public README.
- `scripts/unification-report.mjs`: offline, read-only comparison to Constellation's checked-in **177-public-repo snapshot from 2026-10-21**. A repo newer than the snapshot is **awaiting refresh**, not "missing" or "private".
- `tests/unification.test.mjs`: seed schema, duplicates, source-boundaries, stale snapshot identity mismatch and CLI JSON export checks.
- No UI changes, private data, model calls, network access or runtime executions.

Run with Node 22+:

```sh
node scripts/unification-report.mjs
node scripts/unification-report.mjs --json
npm test
```

### Strict evidence classes

| Class | Meaning | Allowed claim |
| --- | --- | --- |
| README triaged | A public project's README was inspected and its content identity recorded. | The repository **describes** this purpose. |
| Contract documented | Public documentation describes a specific inter-repo interface. | The *contract* exists, with its stated limitations. |
| Source-verified | Both relevant public endpoints or exact integration declarations are supported by immutable commit-and-line citations. | The cited source implements the described portion. |
| Runtime reproduced | Explicit tests run against pinned versions and retain reviewable inputs/results. | Only the demonstrated behavior works under those conditions. |

The seed contains **README triage only**. It is deliberately separate from `src/relationships.json`, whose stronger claims require the established commit-pinned evidence and validation policy. A GitHub file's blob SHA identifies content; it is **not** the same as a pinned commit-and-line evidence link.

## Suggested priority seams, not claimed operating integrations

1. **Intent → code:** Vibe's contracts and PhiThon's bounded source/evidence bridge. Review exact cross-repository version pinning, negative controls and runtime semantics.
2. **Code → OS:** PhiThon/Vibe proposal-to-PhiOS execution interface. No trusted PhiVM/native runtime is asserted by this seed.
3. **Governance ownership:** PhiOS versus PhiKernel responsibilities; avoid parallel sources of execution authority. PhiKernel remains Linux-hosted.
4. **AI → governed action:** BrainC / SuperPhiVessel / PhiKeyhole369. Check the distinction between read-only evidence, synthetic demos and real authority.
5. **Offline distribution:** Trellis / GitPorch / PhiPie / PhiARK. Package, build, hardware and content availability are different acceptance criteria.
6. **Events and devices:** OverStrings / InfiniteInterconnects / Phi5. Prove transport and permissions independently before attaching real actuators or audio.
7. **Public observability:** FieldConstellation remains a **map of evidence**, not the OS control plane.

## Next reviewed increments

**0A Public coverage:** run existing `npm run refresh` in its own review so the 177-record public snapshot can be reconciled with current GitHub public data. Do not change the public graph by inventing nodes from unverified names.

**0B Capability coverage:** expand README triage to the remaining public inventory; distinguish duplicates, alternatives, independent creative tools, research labs and infrastructure. Do not assign maturity from names.

**0C Evidence:** pin selected source/manifest links, add only qualified relationships to the existing ledger, distinguish "documented" from runtime-tested.

**0D First reproducible end-to-end acceptance:** selected Vibe intent -> PhiThon behavior test -> approved, isolated execution -> evidence receipt. Include denial and tamper cases. Deploy nothing automatically.

**0E Separate private review:** any private components need a private operator-controlled catalog, not a public static artifact. This public initiative can discuss interfaces generically without revealing confidential identities.

## Completion metric (not yet measured)

Report per capability: *existence*, *source-reviewed*, *runtime-tested*, *interface-verified*, *integrated in target*, and *physical-device-tested* (if relevant). Progress is a ratio with an explicit denominator and evidence class, never a guess based on repository count.

**Capability is not authority. Ledger above ego.**
