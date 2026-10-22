import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId} from '../src/project-links.js';
import {emptyPassport} from '../src/passport.js';
import {
  MAX_POSTCARD_WORLDS,readPostcardLink,buildPostcardLink,withoutPostcard,savePostcardFavorites
} from '../src/postcards.js';

const repos=JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')).repos;
const [a,b,c]=repos.filter(r=>r.visibility==='public').slice(0,3);
const base='https://michaelwave369.github.io/FieldConstellation/';

test('public postcards round-trip, maintain ordering, and never include visit history',()=>{
  const ids=[projectId(b),projectId(a),projectId(c)];
  const link=buildPostcardLink(base+'?repo='+encodeURIComponent(projectId(a))+'&trail=first-light&stop=2&utm_source=friend#old',ids,repos);
  const parsed=new URL(link);
  assert.deepEqual(parsed.searchParams.get('postcard').split(','),ids);
  assert.equal(parsed.searchParams.has('repo'),false);
  assert.equal(parsed.searchParams.has('trail'),false);
  assert.equal(parsed.searchParams.has('stop'),false);
  assert.equal(parsed.searchParams.get('utm_source'),null,'unrelated tracking or attribution query parameters are never shared');
  assert.equal(parsed.hash,'');
  assert.deepEqual(readPostcardLink(link,repos).ids,ids);
  assert.deepEqual(readPostcardLink(link,repos).worlds.map(x=>x.id),[b.id,a.id,c.id]);
  assert.equal(readPostcardLink(link,repos).omitted,0);
  assert(!link.includes('recent'));
  assert(!link.includes('favorite'));
});

test('malformed, oversized, forged and duplicate links fail closed',()=>{
  const id=projectId(a),long=Array.from({length:MAX_POSTCARD_WORLDS+1},(_,i)=>'github:'+(i+1));
  const bad=[
    '?postcard='+id+','+id,
    '?postcard=github:0',
    '?postcard=github:01',
    '?postcard='+encodeURIComponent('javascript:evil'),
    '?postcard='+id+'&postcard='+id,
    '?postcard='+long.join(','),
    '?postcard='+encodeURIComponent('github:1\n'),
    '?postcard=',
    '?postcard='+encodeURIComponent('github:'+('9'.repeat(100)))
  ];
  for(const query of bad)assert.equal(readPostcardLink(base+query,repos),null,query);
  assert.throws(()=>buildPostcardLink(base,[id,id],repos));
  assert.throws(()=>buildPostcardLink(base,[],repos));
  assert.throws(()=>buildPostcardLink(base,['github:9876543219999'],repos));
  assert.equal(new URL(withoutPostcard(base+'?postcard='+id+'&utm_source=hello')).searchParams.get('utm_source'),'hello');
});

test('a stale shared collection can still open its currently public worlds, without naming unknown IDs',()=>{
  const altered=repos.map(r=>r.id===b.id?{...r,visibility:'private'}:r);
  const link=buildPostcardLink(base,[projectId(a),projectId(b),projectId(c)],repos);
  const parsed=readPostcardLink(link,altered);
  assert.deepEqual(parsed.ids,[projectId(a),projectId(c)]);
  assert.equal(parsed.omitted,1);
  assert.equal(readPostcardLink(buildPostcardLink(base,[projectId(b)],repos),altered),null);
  assert.throws(()=>buildPostcardLink(base,[projectId(b)],altered));
});

test('opening a postcard never changes favorites; saving is explicit, additive and idempotent',()=>{
  const ids=[projectId(a),projectId(b)];
  let passport={...emptyPassport(),favoriteIds:[projectId(a)],recentIds:[projectId(c)]};
  const link=buildPostcardLink(base,ids,repos);
  assert(readPostcardLink(link,repos));
  assert.deepEqual(passport.favoriteIds,[projectId(a)],'just opening a link must not change saved data');
  const result=savePostcardFavorites(passport,ids,repos);
  assert.deepEqual(result.passport.favoriteIds,[projectId(a),projectId(b)]);
  assert.deepEqual(result.passport.recentIds,[projectId(c)]);
  assert.equal(result.saved,1);
  assert.equal(savePostcardFavorites(result.passport,ids,repos).saved,0);
});

test('saving excludes unavailable/private identities and preserves existing saved order',()=>{
  const altered=repos.map(r=>r.id===b.id?{...r,visibility:'private'}:r);
  const result=savePostcardFavorites(emptyPassport(),[projectId(a),projectId(b),projectId(c)],altered);
  assert.deepEqual(result.passport.favoriteIds,[projectId(a),projectId(c)]);
  assert.throws(()=>savePostcardFavorites(emptyPassport(),Array(9).fill(projectId(a)),repos));
});
