import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnapshot} from '../src/inventory.js';
import {resolveRelationships} from '../src/relationships.js';
import {renderProjectIntelligence,validateRepoNerveHandoff,loadProjectEvidence} from '../src/gateway/intelligence.js';

const read=path=>JSON.parse(readFileSync(new URL('../src/'+path,import.meta.url),'utf8'));
const snapshot=parseSnapshot(read('repos.json'));
const repo=name=>snapshot.repos.find(item=>item.name===name);
const handoff=(rows,other={})=>({
  schemaVersion:1,source:'PhiRepoNerve',scope:'public-ids-only',owner:'MichaelWave369',
  observedAt:'2026-11-08T20:00:00+00:00',repositories:rows,...other
});
const row=(id,extra={})=>({id:String(id),pushedAt:'2026-11-08T19:00:00Z',archived:false,...extra});
const fixedNow=Date.parse('2026-11-09T10:00:00Z');

test('public-only RepoNerve handoff accepts only exact known public immutable IDs',()=>{
  const file=handoff([row(repo('PhiOS').id),row(repo('PhiOS-XR').id)]);
  const result=validateRepoNerveHandoff(file,snapshot.repos,fixedNow);
  assert.equal(result.rows.size,2);
  assert.equal(result.rows.get(String(repo('PhiOS').id)).archived,false);
});

test('raw private fleet dumps, unknown IDs, extra fields, duplicate IDs and stale unsafe input are rejected',()=>{
  for(const input of [
    {items:[{private:1,full_name:'MichaelWave369/Secret'}]},
    handoff([row('987654321012345')]),
    handoff([row(repo('PhiOS').id,{private:false})]),
    handoff([row(repo('PhiOS').id),row(repo('PhiOS').id)]),
    handoff([row(repo('PhiOS').id)],{owner:'AnotherOwner'}),
    handoff([row(repo('PhiOS').id)],{scope:'all'}),
    handoff([row(repo('PhiOS').id)],{token:'redacted'}),
    handoff([row(repo('PhiOS').id,{pushedAt:'not a date'})]),
    handoff([row(repo('PhiOS').id)],{observedAt:'2099-11-08T20:00:00Z'}),
  ])assert.throws(()=>validateRepoNerveHandoff(input,snapshot.repos,fixedNow));
});

test('a known ID with visibility changed to private is denied even if it was previously public',()=>{
  const hidden=snapshot.repos.map(r=>String(r.id)===String(repo('PhiOS').id)?{...r,visibility:'private'}:r);
  assert.throws(()=>validateRepoNerveHandoff(handoff([row(repo('PhiOS').id)]),hidden,fixedNow));
});

test('source-reviewed relation evidence is visible but never promoted to end-to-end integration',()=>{
  const relationships=resolveRelationships(snapshot.repos,read('relationships.json'));
  const html=renderProjectIntelligence(repo('Domistika'),{
    snapshotAt:snapshot.fetchedAt,relationships,deployments:read('deployments.json')
  });
  assert.match(html,/Source-reviewed connections/);
  assert.match(html,/Reviewed/);
  assert.match(html,/Source 1/);
  assert.match(html,/not proof it works end to end/);
  assert.match(html,/Not verified by this public intelligence view/);
  assert.match(html,/Destination check is stale|Destination not checked|No public destination declared/);
});

test('absent relationship or destination ledgers remain unknown and HTML is escaped',()=>{
  const item={...repo('PhiOS'),description:'<img src=x onerror=alert(1)>'};
  const html=renderProjectIntelligence(item,{snapshotAt:snapshot.fetchedAt});
  assert(!html.includes('<img'));
  assert.match(html,/&lt;img/);
  assert.match(html,/Relationship ledger unavailable/);
  assert.match(html,/Destination checks unavailable/);
});

test('optional local RepoNerve data does not become CI or production claims',()=>{
  const payload=validateRepoNerveHandoff(handoff([row(repo('PhiOS').id)]),snapshot.repos,fixedNow);
  const html=renderProjectIntelligence(repo('PhiOS'),{handoff:payload,snapshotAt:snapshot.fetchedAt});
  assert.match(html,/RepoNerve complete scan observed/);
  assert.match(html,/This is not CI evidence/);
});

test('public evidence loader fails closed independently for invalid or missing ledgers',async()=>{
  const fetcher=async url=>url.includes('relationships')?
    {ok:true,json:async()=>({schemaVersion:1,owner:'MichaelWave369',relationships:[{id:'private-phantom',from:'github:123',to:'github:456'}]})}:
    {ok:false,json:async()=>null};
  const result=await loadProjectEvidence(snapshot.repos,fetcher);
  assert.equal(result.relationships,null);
  assert.equal(result.deployments,null);
});

test('gateway remains a single local script with no automatic private API fetch',()=>{
  const page=readFileSync(new URL('../src/gateway/index.html',import.meta.url),'utf8');
  const overview=readFileSync(new URL('../src/gateway/overview.js',import.meta.url),'utf8');
  const hierarchy=readFileSync(new URL('../src/gateway/hierarchy.js',import.meta.url),'utf8');
  assert.equal((page.match(/<script\b/g)||[]).length,1);
  assert.match(page,/id="gatewayRepoNerveFile"/);
  assert.match(page,/id="gatewayRepoNerveClear"/);
  assert.match(hierarchy,/project-node/);
  assert.match(overview,/validateRepoNerveHandoff/);
  assert.doesNotMatch(overview,/127\.0\.0\.1|localhost:8765|Authorization:|GITHUB_TOKEN/);
});
