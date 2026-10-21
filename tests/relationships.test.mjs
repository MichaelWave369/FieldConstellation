import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareRepos} from '../src/model.js';
import {projectId} from '../src/project-links.js';
import {validateRelationship,resolveRelationships,relationshipEdges,neighborhood,relatedProjects} from '../src/relationships.js';

const data=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const repos=prepareRepos(data('repos').repos),ledger=data('relationships');

test('every checked-in connection has public endpoints, commit-pinned sources and an explicit claim boundary',()=>{
  assert(ledger.relationships.length>0);
  assert(ledger.relationships.every(r=>validateRelationship(r,repos)));
  assert.equal(new Set(ledger.relationships.map(r=>r.id)).size,ledger.relationships.length);
  assert(ledger.relationships.some(r=>r.status==='verified'));
  assert(ledger.relationships.some(r=>r.status==='documented'));
  assert(!ledger.relationships.some(r=>r.status==='conceptual'));
});

test('unknown or private endpoints, unpinned citations and unsupported status upgrades are rejected',()=>{
  const original=ledger.relationships[0];
  for(const patch of [{from:'github:999999999999'},{to:original.from},{status:'runtime-verified'},{evidence:[]},{evidence:[{url:'https://github.com/MichaelWave369/Domistika/blob/main/README.md#L1',claim:'mutable'}]},{evidence:[{url:'javascript:alert(1)',claim:'unsafe'}]}])assert.equal(validateRelationship({...original,...patch},repos),false);
  const privateRepos=repos.map(r=>projectId(r)===original.to?{...r,visibility:'private'}:r);
  assert.equal(validateRelationship(original,privateRepos),false);
  const documented=ledger.relationships.find(r=>r.status==='documented');
  assert.equal(validateRelationship({...documented,status:'verified'},repos),false);
  const shared=ledger.relationships.find(r=>r.kind==='shared-library');
  assert.equal(validateRelationship({...shared,evidence:shared.evidence.slice(0,1)},repos),false);
});

test('relationship resolution preserves direction and skips stale endpoints without inventing nodes',()=>{
  const all=resolveRelationships(repos,ledger);
  assert.equal(all.length,ledger.relationships.length);
  const target=repos.find(r=>r.name==='Domistika'),related=relatedProjects(target,all);
  assert(related.some(r=>r.direction==='Outgoing'&&r.repo.name==='Auralith369'));
  assert(related.some(r=>r.direction==='Incoming'&&r.repo.name==='SiliconLouvre'));
  const missing=repos.filter(r=>r.name!=='Auralith369');
  assert(resolveRelationships(missing,ledger).every(r=>r.fromRepo.name!=='Auralith369'&&r.toRepo.name!=='Auralith369'));
  assert.equal(resolveRelationships(repos,{...ledger,relationships:[...ledger.relationships,ledger.relationships[0]]}).length,all.length);
});

test('the graph contains only sourced edges by default and conceptual links remain explicitly optional',()=>{
  const all=resolveRelationships(repos,ledger),sourced=relationshipEdges(repos,all),combined=relationshipEdges(repos,all,true);
  assert.equal(sourced.length,all.length);assert(!sourced.some(e=>e[2]==='conceptual'));
  const conceptual=combined.filter(e=>e[2]==='conceptual');assert(conceptual.length>0);
  assert(conceptual.every(([a,b])=>repos[a].group===repos[b].group));
  const selected=repos.find(r=>r.name==='Domistika'),neighbors=neighborhood(selected.id,repos,sourced);
  assert(neighbors.has(selected.id));assert(neighbors.has(repos.find(r=>r.name==='Auralith369').id));assert(neighbors.has(repos.find(r=>r.name==='SiliconLouvre').id));
  assert(!neighbors.has(repos.find(r=>r.name==='PhiCade').id));
  assert(sourced.every(([a,b])=>a!==b&&repos[a]&&repos[b]));
});
