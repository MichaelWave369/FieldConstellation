// Offline, read-only Φ Unification seed reconciliation. No network or file writes.
import {readFileSync} from 'node:fs';

const read = relative => JSON.parse(readFileSync(new URL('../' + relative, import.meta.url), 'utf8'));
const snapshot = read('src/repos.json');
const audit = read('data/unification/public-capabilities.v1.json');
const fatal = message => { throw new Error('Unification seed invalid: ' + message); };

export function buildReport(snapshot, audit) {
  if (audit.schemaVersion !== 1 || audit.scope !== 'public' || audit.owner !== 'MichaelWave369') fatal('scope/schema/owner');
  if (snapshot.scope !== 'public' || snapshot.complete !== true || !Array.isArray(snapshot.repos)) fatal('public snapshot');
  if (!Array.isArray(audit.entries) || audit.entries.length === 0) fatal('empty seed');
  if (snapshot.repos.some(repo => repo.visibility !== 'public')) fatal('snapshot includes non-public records');
  const seenIds = new Set(), seenNames = new Set(), matched = [], pending = [];
  const byId = new Map(snapshot.repos.map(repo => ['github:' + String(repo.id), repo]));
  for (const item of audit.entries) {
    if (!/^github:[0-9]+$/.test(item.id) || !/^[A-Za-z0-9._-]+$/.test(item.name)) fatal('invalid public identity');
    if (seenIds.has(item.id) || seenNames.has(item.name.toLowerCase())) fatal('duplicate seed identity');
    seenIds.add(item.id);
    seenNames.add(item.name.toLowerCase());
    if (!item.primaryLayer || !item.role || item.review !== 'README_ONLY_NOT_INDEPENDENTLY_TESTED') fatal('missing bounded review metadata');
    if (item.evidence?.path !== 'README.md' || !/^[0-9a-f]{40}$/.test(item.evidence.blobSha)) fatal('missing README content identity');
    const upstream = byId.get(item.id);
    if (upstream) {
      if (upstream.name.toLowerCase() !== item.name.toLowerCase()) fatal('identity/name mismatch');
      matched.push(item.name);
    } else pending.push(item.name); // An older snapshot cannot establish that a current public project is absent.
  }
  const layers = {};
  for (const item of audit.entries) layers[item.primaryLayer] = (layers[item.primaryLayer] || 0) + 1;
  return {
    schemaVersion: 1,
    purpose: 'Readme-only public architecture triage, not proof of operational integration',
    catalogObservedDate: audit.observedDate,
    inventoryObservation: audit.inventoryObservation,
    checkedInPublicSnapshot: {fetchedAt: snapshot.fetchedAt, records: snapshot.repos.length},
    seed: {total: audit.entries.length, matchedInSnapshot: matched.length, needsPublicSnapshotRefresh: pending.length, unreviewedInSnapshot: snapshot.repos.length - matched.length},
    layers: Object.fromEntries(Object.entries(layers).sort(([a], [b]) => a.localeCompare(b))),
    publicSeedNamesAbsentFromOldSnapshot: pending.sort(),
    limitations: [
      'Private repository identities are not included.',
      'A README role does not show code integration, deployment or CI success.',
      'Unmatched public names may be newer than the checked-in snapshot.',
      'Do not promote candidates into src/relationships.json without commit-pinned endpoint evidence.'
    ]
  };
}

if (process.argv[1] && process.argv[1].includes('unification-report.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/unification-report.mjs [--json]  # read-only public seed reconciliation');
  } else if (args.some(arg => arg !== '--json')) {
    console.error('Unknown argument. Use --json or --help.');
    process.exitCode = 2;
  } else {
    try {
      const report = buildReport(snapshot, audit);
      if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
      else console.log([
        'Φ Unification · public README triage (no integration claims)',
        'Checked-in public inventory: ' + report.checkedInPublicSnapshot.records + ' (' + report.checkedInPublicSnapshot.fetchedAt + ')',
        'Reviewed public seed: ' + report.seed.total,
        'Matched to old snapshot: ' + report.seed.matchedInSnapshot,
        'Await public inventory refresh: ' + report.seed.needsPublicSnapshotRefresh,
        'Unreviewed in old snapshot: ' + report.seed.unreviewedInSnapshot,
        'Layers represented: ' + Object.keys(report.layers).length,
        'Private repository names: excluded'
      ].join(String.fromCharCode(10)));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
