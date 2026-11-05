import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARCHITECTURE_GROUPS,architectureFor,architectureCounts,architecturePositions} from '../src/architecture-taxonomy.js';
import {prepareRepos,layoutPositions,layoutEdges,GROUPS} from '../src/model.js';
import {parseSnapshot} from '../src/inventory.js';

const snapshot=parseSnapshot(JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')));
const repo=(name,other={})=>({id:'800000001',name,description:'',topics:[],archived:false,...other});
test('PhiOS taxonomy is a separate ten-role architecture, not an overwrite of eight artistic houses',()=>{
  assert.equal(ARCHITECTURE_GROUPS.length,10);
  assert.equal(GROUPS.length,8);
  assert.equal(new Set(ARCHITECTURE_GROUPS.map(g=>g.id)).size,10);
  assert.equal(ARCHITECTURE_GROUPS[0].id,'CORE_OS');
});
test('central ecosystem nodes and creative handoffs have explicit placements',()=>{
  for(const [name,id] of [['PhiOS','CORE_OS'],['PhiKernel','CORE_OS'],['Infinite-Porch','AI_HOME'],['Infinite-Commons','WORLD_PORTAL'],['InfiniteInterconnects','BRIDGE'],['PhiServe','LOCAL_SERVICE'],['parallax-pixelforge','CREATIVE_PIPELINE'],['FramefieldStudio','CREATIVE_PIPELINE'],['paracut','CREATIVE_PIPELINE'],['BTM','WORLD_PORTAL'],['PhianoSheets','APP'],['Altermath','RESEARCH_LIBRARY']]){
    assert.deepEqual(architectureFor(repo(name)),{id,basis:'curated',integration:'cataloged'},name);
  }
});
test('new owner-tagged projects route directly; uncertainty remains visible',()=>{
  assert.deepEqual(architectureFor(repo('NewOne',{topics:['phios-creative-pipeline']})),{id:'CREATIVE_PIPELINE',basis:'owner-topic',integration:'cataloged'});
  assert.deepEqual(architectureFor(repo('PhiOS',{topics:['phios-experiment']})),{id:'EXPERIMENT',basis:'owner-topic',integration:'cataloged'},'Owner tags may correct curated historical placements');
  assert.deepEqual(architectureFor(repo('FreshAsset',{description:'A keyframe editor for imported models'})),{id:'CREATIVE_PIPELINE',basis:'suggested-needs-review',integration:'cataloged'});
  assert.deepEqual(architectureFor(repo('Conflicted',{topics:['phios-app','phios-bridge']})),{id:'EXPERIMENT',basis:'conflicting-owner-topics',integration:'cataloged'});
  assert.equal(architectureFor(repo('UndocumentedThing')).id,'EXPERIMENT');
  assert.equal(architectureFor(repo('UndocumentedThing')).basis,'unreviewed');
  assert.equal(architectureFor(repo('Ambiguous',{description:'A desktop app and virtual reality world portal'})).id,'EXPERIMENT');
  assert.equal(architectureFor(repo('PhiOS',{archived:true})).id,'ARCHIVE');
});
test('entire bundled public catalog gets one role; counts never imply installations',()=>{
  const counts=architectureCounts(snapshot.repos);
  assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),snapshot.repos.length);
  assert.equal(Object.keys(counts).length,10);
  assert(snapshot.repos.every(r=>architectureFor(r).integration==='cataloged'));
  const incomplete=snapshot.repos.filter(r=>!r.archived&&architectureFor(r).basis!=='curated'&&architectureFor(r).id!=='ARCHIVE');
  assert.deepEqual(incomplete.map(r=>r.name),[],'Current public snapshot must have explicit placement; newly discovered repos may be queued for review');
  assert.equal(new Set(snapshot.repos.map(r=>r.id)).size,snapshot.repos.length);
});
test('architectural coordinates are deterministic across input reorder and inventory growth',()=>{
  const records=prepareRepos(snapshot.repos);
  const points=layoutPositions(records,'architecture');
  const byId=new Map(records.map((r,i)=>[r.id,points[i]]));
  assert(points.every(p=>p.length===3&&p.every(Number.isFinite)));
  const reversed=records.slice().reverse();
  layoutPositions(reversed,'architecture').forEach((p,i)=>assert.deepEqual(p,byId.get(reversed[i].id)));
  const newcomers=Array.from({length:650},(_,i)=>repo('New-'+i,{id:String(900000000+i)}));
  const expanded=[...records,...newcomers];
  const after=architecturePositions(expanded);
  for(let i=0;i<records.length;i++)assert.deepEqual(after[i],points[i]);
  assert.deepEqual(layoutEdges(records,points,'architecture'),[],'Categories do not create fake code dependencies');
});
test('gateway includes a counted, sortable, searchable public catalog without deployment hooks',()=>{
  const html=readFileSync(new URL('../src/gateway/index.html',import.meta.url),'utf8');
  const code=readFileSync(new URL('../src/gateway/overview.js',import.meta.url),'utf8');
  assert.match(html,/id="gatewayCount"/);
  assert.match(html,/id="gatewayProjects"/);
  assert.match(html,/id="gatewaySort"/);
  assert.match(html,/src=".\/overview.js"/);
  assert.match(code,/fetchPublicInventory/);
  assert.match(code,/parseSnapshot/);
  assert.match(code,/autoRefreshDue/);
  assert.doesNotMatch(code,/netlify\.com|private_repo|process\.env|Authorization:/i);
});
