import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId} from '../src/project-links.js';
import {PASSPORT_KEY,emptyPassport,sanitizePassport,parsePassport,toggleFavorite,recordVisit,clearPassportSection,passportRepos,exportFavorites,importFavorites,MAX_RECENT} from '../src/passport.js';

const repos=JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')).repos;
const [a,b,c]=repos.filter(r=>r.visibility==='public').slice(0,3);

test('local passport starts empty and only contains public repository identities',()=>{
  assert.equal(typeof PASSPORT_KEY,'string');
  assert.deepEqual(parsePassport('{broken',repos),emptyPassport());
  const sample={schemaVersion:1,favoriteIds:[projectId(a),'github:9999999999999',projectId(a),'not-an-id'],recentIds:[projectId(b)]};
  assert.deepEqual(sanitizePassport(sample,repos),{schemaVersion:1,favoriteIds:[projectId(a)],recentIds:[projectId(b)]});
  assert.deepEqual(parsePassport('a'.repeat(20001),repos),emptyPassport());
  assert.deepEqual(parsePassport(JSON.stringify({...sample,schemaVersion:99}),repos),emptyPassport());
});

test('saving and revisiting favorites and recent projects is deterministic',()=>{
  let p=emptyPassport();
  p=toggleFavorite(p,a,repos);
  assert.deepEqual(p.favoriteIds,[projectId(a)]);
  p=toggleFavorite(p,a,repos);
  assert.deepEqual(p.favoriteIds,[]);
  p=toggleFavorite(p,b,repos);
  p=recordVisit(p,a,repos);
  p=recordVisit(p,c,repos);
  p=recordVisit(p,a,repos);
  assert.deepEqual(p.recentIds,[projectId(a),projectId(c)]);
  assert.equal(p.favoriteIds.length,1);
  assert.deepEqual(passportRepos(p.recentIds,repos).map(r=>r.id),[a.id,c.id]);
  assert.deepEqual(clearPassportSection(p,'recentIds',repos).recentIds,[]);
  assert.deepEqual(clearPassportSection(p,'favoriteIds',repos).favoriteIds,[]);
});

test('deleted and private items are never restored or recorded',()=>{
  const altered=repos.map(r=>r.id===a.id?{...r,visibility:'private'}:r);
  const input={schemaVersion:1,favoriteIds:[projectId(a),projectId(b)],recentIds:[projectId(a)]};
  assert.deepEqual(sanitizePassport(input,altered).favoriteIds,[projectId(b)]);
  assert.deepEqual(toggleFavorite(emptyPassport(),a,altered),emptyPassport());
  assert.deepEqual(recordVisit(emptyPassport(),a,altered),emptyPassport());
  assert.equal(passportRepos([projectId(a)],altered).length,0);
});

test('imports merge only known public favorites and never import visit history',()=>{
  let p=recordVisit(emptyPassport(),a,repos);
  p=toggleFavorite(p,a,repos);
  const exported=exportFavorites(toggleFavorite(emptyPassport(),b,repos),repos);
  assert.deepEqual(Object.keys(JSON.parse(exported)),['schemaVersion','kind','favoriteIds']);
  const merged=importFavorites(p,exported,repos);
  assert.deepEqual(merged.passport.favoriteIds,[projectId(a),projectId(b)]);
  assert.deepEqual(merged.passport.recentIds,[projectId(a)]);
  assert.equal(merged.imported,1);
  const unknown={schemaVersion:1,kind:'field-constellation-public-favorites',favoriteIds:[projectId(c),'github:9999999999999']};
  const withUnknown=importFavorites(p,JSON.stringify(unknown),repos);
  assert.equal(withUnknown.omitted,1);
  assert(!withUnknown.passport.favoriteIds.includes('github:9999999999999'));
});

test('rejects oversized, malformed or irrelevant import data',()=>{
  assert.throws(()=>importFavorites(emptyPassport(),'nope',repos));
  assert.throws(()=>importFavorites(emptyPassport(),JSON.stringify({schemaVersion:1,kind:'different',favoriteIds:[]}),repos));
  assert.throws(()=>importFavorites(emptyPassport(),JSON.stringify({schemaVersion:1,kind:'field-constellation-public-favorites',favoriteIds:['javascript:alert(1)']}),repos));
  assert.throws(()=>importFavorites(emptyPassport(),'x'.repeat(33000),repos));
});

test('history is bounded and oldest entries are discarded',()=>{
  const fake=Array.from({length:MAX_RECENT+6},(_,i)=>({id:String(i+1),name:'test'+i,visibility:'public'}));
  let state=emptyPassport();
  for(const repo of fake)state=recordVisit(state,repo,fake);
  assert.equal(state.recentIds.length,MAX_RECENT);
  assert.equal(state.recentIds[0],'github:'+fake.at(-1).id);
  assert(!state.recentIds.includes('github:1'));
});
