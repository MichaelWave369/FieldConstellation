import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareRepos} from '../src/model.js';
import {projectId} from '../src/project-links.js';
import {resolveRelationships} from '../src/relationships.js';
import {connectionExplorerIndex} from '../src/connection-explorer.js';
import {findEvidenceJourney} from '../src/evidence-journeys.js';

const load=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const repos=prepareRepos(load('repos').repos);
const reviewed=resolveRelationships(repos,load('relationships'));
const index=connectionExplorerIndex(repos,reviewed);
const id=name=>projectId(repos.find(r=>r.name===name&&r.visibility==='public'));

test('a shortest journey uses only separate source-backed edges, not an inferred integration',()=>{
  const route=findEvidenceJourney(index,id('SiliconLouvre'),id('WaveForgeStudio'));
  assert(route);
  assert.deepEqual([route.startRepo.name,...route.steps.map(s=>s.toRepo.name)],
    ['SiliconLouvre','Domistika','Auralith369','paracut','WaveForgeStudio']);
  assert.equal(route.steps.length,4);
  assert(route.steps.every(s=>s.relation.evidence.length>0&&['verified','documented'].includes(s.relation.status)));
  assert(route.steps.some(s=>s.relation.status==='documented'));
  assert(route.steps.every((s,i)=>i===0||route.steps[i-1].toRepo.id===s.fromRepo.id));
});

test('direction labels are preserved when a visitor traverses a directed relation backwards',()=>{
  const forward=findEvidenceJourney(index,id('SiliconLouvre'),id('Auralith369'));
  const reverse=findEvidenceJourney(index,id('Auralith369'),id('SiliconLouvre'));
  assert.equal(forward.steps.length,2);
  assert(forward.steps.every(step=>!step.reversed));
  assert.equal(reverse.steps.length,2);
  assert(reverse.steps.every(step=>step.reversed));
  assert(reverse.steps.every(step=>step.relation.direction==='directed'));
});

test('grade filters, disconnected projects and six-hop maximum have honest empty outcomes',()=>{
  const from=id('SiliconLouvre'),to=id('WaveForgeStudio');
  assert.equal(findEvidenceJourney(index,from,to,{grade:'verified'}),null);
  assert.equal(findEvidenceJourney(index,id('PhiCade'),to),null);
  assert.equal(findEvidenceJourney(index,from,to,{maxHops:3}),null);
  assert.equal(findEvidenceJourney(index,'github:999999999',to),null);
  assert.equal(findEvidenceJourney(index,from,to,{maxHops:4})?.steps.length,4);
  assert.deepEqual(findEvidenceJourney(index,from,from)?.steps,[]);
});

test('conceptual, missing and private nodes cannot create a visitor evidence path',()=>{
  const fake={...index.links[0],id:'fake-conceptual',status:'conceptual'};
  const rewritten=connectionExplorerIndex(repos,[...reviewed,fake]);
  assert.equal(findEvidenceJourney(rewritten,id('PhiCade'),id('Auralith369')),null);
  const without=connectionExplorerIndex(repos.filter(repo=>repo.name!=='Domistika'),reviewed);
  assert.equal(findEvidenceJourney(without,id('SiliconLouvre'),id('Auralith369')),null);
  const privateCopy=repos.map(repo=>repo.name==='Domistika'?{...repo,visibility:'private'}:repo);
  const filtered=connectionExplorerIndex(privateCopy,reviewed);
  assert.equal(findEvidenceJourney(filtered,id('SiliconLouvre'),id('Auralith369')),null);
});

test('deterministic graph search remains bounded with 650 additional public repos',()=>{
  const extra=Array.from({length:650},(_,i)=>({id:String(500000+i),name:'Extra '+i,group:'creative',visibility:'public'}));
  const larger=connectionExplorerIndex([...repos,...extra],reviewed);
  const first=findEvidenceJourney(larger,id('SiliconLouvre'),id('WaveForgeStudio'));
  const again=findEvidenceJourney(larger,id('SiliconLouvre'),id('WaveForgeStudio'));
  assert.deepEqual(first.steps.map(step=>step.relation.id),again.steps.map(step=>step.relation.id));
  assert.equal(first.steps.length,4);
});
