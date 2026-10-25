import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildReport} from '../scripts/unification-report.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const seed = read('data/unification/public-capabilities.v1.json');
const oldInventory = read('src/repos.json');

test('public capability seed is bounded, source-identified and non-duplicative', () => {
  const report = buildReport(oldInventory, seed);
  assert.equal(seed.scope, 'public');
  assert.equal(report.seed.total, seed.entries.length);
  assert(report.seed.total >= 20);
  assert.equal(report.seed.matchedInSnapshot + report.seed.needsPublicSnapshotRefresh, report.seed.total);
  assert.equal(report.seed.unreviewedInSnapshot + report.seed.matchedInSnapshot, oldInventory.repos.length);
  assert(seed.entries.every(entry => entry.review === 'README_ONLY_NOT_INDEPENDENTLY_TESTED'));
  assert(seed.entries.every(entry => entry.evidence?.path === 'README.md'));
});

test('unification reconciliation rejects duplicate, stale-mapped or invented identity', () => {
  const duplicate = {...seed, entries: [...seed.entries, seed.entries[0]]};
  assert.throws(() => buildReport(oldInventory, duplicate), /duplicate/);
  const present = seed.entries.find(item => oldInventory.repos.some(repo => String(repo.id) === item.id.slice(7)));
  assert(present, 'there should be at least one matching historical public entry');
  const renamed = {...seed, entries: seed.entries.map(item => item === present ? {...item, name: 'not-the-real-name'} : item)};
  assert.throws(() => buildReport(oldInventory, renamed), /mismatch/);
  assert.throws(() => buildReport(oldInventory, {...seed, scope: 'private'}), /scope/);
});

test('CLI exports machine-readable offline reconciliation with no side effects', () => {
  const run = spawnSync(process.execPath, ['scripts/unification-report.mjs', '--json'], {encoding: 'utf8'});
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.seed.total, seed.entries.length);
  assert(report.limitations.some(line => line.includes('Private')));
});
