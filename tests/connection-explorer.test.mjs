import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareRepos} from '../src/model.js';
import {projectId} from '../src/project-links.js';
import {resolveRelationships} from '../src/relationships.js';
import {connectionExplorerIndex,filterConnections} from '../src/connection-explorer.js';

const data=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const repos=prepareRepos(data('repos').repos);
const relationships=resolveRelationships(repos,data('relationships'));
const index=connectionExplorerIndex(repos,relationships);

test('source explorer uses only the already validated, public, sourced relationship ledger',()=>{
  assert.equal(index.links.length,relationships.length);
  assert.equal(index.counts.total,index.counts.verified+index.counts.documented);
  assert(index.counts.verified>0&&index.counts.documented>0);
  assert(index.links.every(r=>r.fromRepo.visibility==='public'&&r.toRepo.visibility==='public'&&r.evidence.length));
  assert(index.links.every(r=>r.status==='verified'||r.status==='documented'));
  assert(index.projects.every(repo=>repo.visibility==='public'));
  assert.equal(new Set(index.projects.map(repo=>projectId(repo))).size,index.projects.length);
  const stable=connectionExplorerIndex(repos,relationships);
  assert.deepEqual(stable.links.map(r=>r.id),index.links.map(r=>r.id));
});

test('project, status and text queries filter evidence without changing its grade or order',()=>{
  const domistika=repos.find(r=>r.name==='Domistika');
  const byProject=filterConnections(index.links,{project:projectId(domistika)});
  assert(byProject.length>0);
  assert(byProject.every(r=>r.from===projectId(domistika)||r.to===projectId(domistika)));
  const verified=filterConnections(index.links,{status:'verified'});
  assert.equal(verified.length,index.counts.verified);
  assert(verified.every(r=>r.status==='verified'));
  assert.equal(filterConnections(index.links,{status:'documented'}).length,index.counts.documented);
  const match=filterConnections(index.links,{query:'Auralith'});
  assert(match.length>0);
  assert(match.every(r=>[r.fromRepo.name,r.toRepo.name,r.summary,r.scope,...r.evidence.map(e=>e.claim)].some(x=>x.toLowerCase().includes('auralith'))));
  assert.equal(filterConnections(index.links,{project:'github:999999999999'}).length,0);
  assert.equal(filterConnections(index.links,{query:'not-a-real-connection-12345'}).length,0);
});

test('private endpoints and conceptual associations cannot become source claims',()=>{
  const real=index.links[0],withoutEndpoint=repos.filter(r=>projectId(r)!==real.to);
  const missing=connectionExplorerIndex(withoutEndpoint,relationships);
  assert(!missing.links.some(r=>r.id===real.id));
  const fake={...real,id:'thematic-only-test',status:'conceptual'};
  const withFake=connectionExplorerIndex(repos,[...relationships,fake]);
  assert.equal(withFake.links.length,index.links.length);
  const privateRepos=repos.map(r=>projectId(r)===real.from?{...r,visibility:'private'}:r);
  assert(!connectionExplorerIndex(privateRepos,relationships).links.some(r=>r.id===real.id));
  const duplicate=connectionExplorerIndex(repos,[...relationships,relationships[0]]);
  assert.equal(duplicate.links.length,index.links.length);
});

test('large public inventory leaves bounded relationship index and supports empty ledgers',()=>{
  const many=Array.from({length:650},(_,i)=>({
    id:'f'+i,name:'Synthetic '+i,visibility:'public',group:'research'
  }));
  const bigger=connectionExplorerIndex([...repos,...many],relationships);
  assert.equal(bigger.links.length,relationships.length);
  assert.deepEqual(connectionExplorerIndex(repos,[]).counts,{total:0,verified:0,documented:0});
  assert.deepEqual(filterConnections([],{}),[]);
});
