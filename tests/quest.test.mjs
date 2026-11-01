import test from 'node:test';
import assert from 'node:assert/strict';
import {projectId} from '../src/project-links.js';
import {emptyQuest,readQuest,sanitizeQuest,discover,questProgress} from '../src/quest.js';

const repos=Array.from({length:10},(_,i)=>({
  id:i+1,name:'World'+i,visibility:'public',group:i%2?'play':'infrastructure'
}));
const id=i=>projectId(repos[i]);
test('quest journal stores only unique IDs from the current public listing',()=>{
  assert.deepEqual(sanitizeQuest({schemaVersion:1,discoveredIds:[id(0),id(0),'github:999999','bad']},repos).discoveredIds,[id(0)]);
  assert.deepEqual(sanitizeQuest({schemaVersion:999,discoveredIds:[id(0)]},repos),emptyQuest());
  assert.equal(readQuest('not json',repos).discoveredIds.length,0);
});
test('one-time Passport migration occurs only before a journal exists',()=>{
  const passport={favoriteIds:[id(1)],recentIds:[id(2),id(1)]};
  assert.deepEqual(readQuest(null,repos,passport).discoveredIds,[id(1),id(2)]);
  assert.deepEqual(readQuest(JSON.stringify(emptyQuest()),repos,passport),emptyQuest());
});
test('discoveries are idempotent, public-only and earn 10 playful XP per new world',()=>{
  const first=discover(emptyQuest(),repos[0],repos);
  assert.deepEqual(discover(first,repos[0],repos),first);
  assert.equal(questProgress(repos,first,{favoriteIds:[]}).experience,10);
  assert.deepEqual(discover(first,{...repos[1],visibility:'private'},repos),first);
});
test('3, 6, 9 milestone ranks and eight thematic categories remain bounded',()=>{
  let journal=emptyQuest();
  for(let i=0;i<9;i++){
    journal=discover(journal,repos[i],repos);
    const p=questProgress(repos,journal,{favoriteIds:[]});
    assert.equal(p.total,i+1);
    assert.equal(p.branches.reduce((sum,b)=>sum+b.discovered,0),i+1);
  }
  const stats=questProgress(repos,journal,{favoriteIds:[id(0)]});
  assert.equal(stats.rank.at,9);
  assert.equal(stats.next.at,18);
  assert.equal(stats.saved,1);
  assert.equal(stats.achievements.find(x=>x.id==='nine').unlocked,true);
  assert.equal(stats.achievements.find(x=>x.id==='all-stars').unlocked,false);
});
test('only source-verified relationship endpoints count towards the evidence achievement',()=>{
  const journal={schemaVersion:1,discoveredIds:[id(0),id(1)]};
  const links=[
    {status:'verified',from:id(0),to:id(1)},
    {status:'documented',from:id(0),to:id(1)},
    {status:'verified',from:id(0),to:id(8)}
  ];
  const progress=questProgress(repos,journal,{favoriteIds:[]},links);
  assert.equal(progress.completedLinks,1);
  assert.equal(progress.documentedLinks,1);
  assert.equal(progress.achievements.find(x=>x.id==='source-link').unlocked,true);
  assert.equal(questProgress(repos,emptyQuest(),{favoriteIds:[]},links).completedLinks,0);
});
