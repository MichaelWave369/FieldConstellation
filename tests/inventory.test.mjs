import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnapshot,validatePublicRepos,newerPublicCache,fetchPublicInventory} from '../src/inventory.js';

const snapshot=JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8'));
function raw(index){return {id:9000000+index,name:'Fixture-'+index,private:false,owner:{login:'MichaelWave369'},html_url:'https://github.com/MichaelWave369/Fixture-'+index,topics:[],created_at:'2026-01-01T00:00:00Z',pushed_at:'2026-10-01T00:00:00Z',has_pages:false,archived:false,fork:false};}
const page=Array.from({length:100},(_,i)=>raw(i));
const response=value=>new Response(JSON.stringify(value),{status:200});

test('snapshot and cache boundaries reject mixed scope, duplicate identities and forged repository URLs',()=>{
  assert.equal(parseSnapshot(snapshot).repos.length,snapshot.repos.length);
  for(const patch of [{visibility:'private'},{url:'https://github.com/SomeoneElse/Project'},{id:'0'},{name:123},{created:'unknown'},{topics:['ok',{}]},{size:NaN}])assert.throws(()=>validatePublicRepos([{...snapshot.repos[0],...patch}]));
  assert.throws(()=>validatePublicRepos([snapshot.repos[0],snapshot.repos[0]]));
  assert.throws(()=>parseSnapshot({...snapshot,complete:false}));
  assert.throws(()=>parseSnapshot({...snapshot,scope:'all'}));
  assert.throws(()=>parseSnapshot({...snapshot,owner:'SomeoneElse'}));
});

test('only a newer, complete public cache with a plausible date replaces a bundled snapshot',()=>{
  const now=Date.parse(snapshot.fetchedAt)+3600000;
  const cache={...snapshot,fetchedAt:new Date(now-1000).toISOString()};
  assert.equal(newerPublicCache(JSON.stringify(cache),snapshot,now).fetchedAt,cache.fetchedAt);
  assert.equal(newerPublicCache(JSON.stringify(snapshot),snapshot,now),null);
  assert.equal(newerPublicCache(JSON.stringify({...cache,fetchedAt:new Date(now+120000).toISOString()}),snapshot,now),null);
  assert.equal(newerPublicCache(JSON.stringify({...cache,repos:[{...cache.repos[0],visibility:'private'}]}),snapshot,now),null);
  assert.equal(newerPublicCache('broken json',snapshot,now),null);
});

test('public refresh fetches all pages and validates the whole result before returning',async()=>{
  const calls=[];
  const repos=await fetchPublicInventory(async url=>{calls.push(url);return response(calls.length===1?page:[raw(100)]);});
  assert.equal(repos.length,101);assert.equal(calls.length,2);assert.match(calls[1],/page=2$/);assert(repos.every(r=>r.visibility==='public'));
  assert.equal(repos[0].id,String(page[0].id));assert.equal(repos[0].pages,false);
});

test('a second-page failure, pagination cap, duplicates, private records and rate limits cannot yield a partial refresh',async()=>{
  const original=JSON.stringify(snapshot);
  const badPages=[()=>new Response('',{status:500}),()=>response([{...raw(100),private:true}]),()=>response([{...raw(100),owner:{login:'SomeoneElse'}}]),()=>response([raw(0)]),()=>response([])];
  for(let i=0;i<badPages.length-1;i++){
    let count=0;await assert.rejects(fetchPublicInventory(async()=>++count===1?response(page):badPages[i]()));
  }
  await assert.rejects(fetchPublicInventory(async()=>response(page),{maxPages:1}),/Pagination/);
  for(const status of [403,429])await assert.rejects(fetchPublicInventory(async()=>new Response('',{status})),/rate limit/);
  await assert.rejects(fetchPublicInventory(async()=>response([])),/empty/);
  await assert.rejects(fetchPublicInventory(async()=>response({message:'unexpected'})),/unexpected/);
  assert.equal(JSON.stringify(snapshot),original);
});
