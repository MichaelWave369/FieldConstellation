import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnapshot} from '../src/inventory.js';
import {ARCHITECTURE_GROUPS,architectureFor} from '../src/architecture-taxonomy.js';
import {PHIOS_SURFACES,buildHierarchy} from '../src/gateway/hierarchy.js';

const snapshot=parseSnapshot(JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')));

test('hierarchy pins the four public PhiOS surfaces above all ten editorial branches',()=>{
  const model=buildHierarchy(snapshot.repos);
  assert.deepEqual(model.platform.map(surface=>surface.label),[
    'PhiOS Core','PhiOS Web','PhiOS Mobile','PhiOS XR'
  ]);
  assert.equal(PHIOS_SURFACES.length,4);
  assert.equal(model.groups.length,ARCHITECTURE_GROUPS.length);
  assert.equal(model.groups.length,10);
});

test('every public project is placed once and only once',()=>{
  const model=buildHierarchy(snapshot.repos);
  const ids=[...model.platform.map(item=>item.repo.id),
    ...model.groups.flatMap(item=>item.repos.map(repo=>repo.id))];
  assert.equal(ids.length,snapshot.repos.length);
  assert.equal(new Set(ids).size,snapshot.repos.length);
  assert.equal(model.branchCount+model.platform.length,snapshot.repos.length);
  assert.equal(snapshot.scope,'public');
});

test('filtered branch results preserve pinned platform family and never invent missing projects',()=>{
  const matches=snapshot.repos.filter(repo=>architectureFor(repo).id==='CREATIVE_PIPELINE');
  const model=buildHierarchy(snapshot.repos,matches);
  assert.equal(model.platform.length,4);
  assert(model.groups.find(item=>item.group.id==='CREATIVE_PIPELINE').repos.length>0);
  assert(model.groups.every(item=>item.group.id==='CREATIVE_PIPELINE'||item.repos.length===0));
  assert.equal(model.branchCount,matches.length);
});

test('gateway uses its existing validated public snapshot and keeps single local script entry',()=>{
  const html=readFileSync(new URL('../src/gateway/index.html',import.meta.url),'utf8');
  const overview=readFileSync(new URL('../src/gateway/overview.js',import.meta.url),'utf8');
  assert.match(html,/id="gatewayHierarchy"/);
  assert.match(html,/src=".\/overview.js"/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.match(overview,/renderHierarchy/);
  assert.match(overview,/parseSnapshot/);
  assert.doesNotMatch(overview,/private_repo|Authorization:|GITHUB_TOKEN/i);
});
