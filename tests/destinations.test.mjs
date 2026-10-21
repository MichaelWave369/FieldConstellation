import test from 'node:test';
import assert from 'node:assert/strict';
import {destinationCandidate,destinationStatus,publicDestination,probeDestination,DESTINATION_MAX_AGE} from '../src/destinations.js';
const repo={id:'123',name:'Example',homepage:'',pages:true};
const now=Date.parse('2026-10-21T21:00:00Z');
const html=(status=200,type='text/html')=>new Response('<!doctype html><html><head><title>Public project</title></head></html>',{status,headers:{'content-type':type}});
const ledger=check=>({schemaVersion:1,owner:'MichaelWave369',checks:[check]});

test('a Pages flag yields a candidate, and only a recent HTML observation yields an Explore destination',async()=>{
  assert.equal(destinationCandidate(repo),'https://michaelwave369.github.io/Example/');
  assert.equal(destinationStatus(repo,null,now).state,'unchecked');
  const check=await probeDestination(repo,async()=>html(),now);
  assert.equal(check.status,'reachable');assert.equal(destinationStatus(repo,ledger(check),now).url,check.url);
  assert.equal(destinationStatus(repo,ledger(check),now+DESTINATION_MAX_AGE+1).state,'stale');
  assert.equal(destinationStatus({...repo,homepage:'https://new-site.example.net/'},ledger(check),now).state,'unchecked');
  assert.equal(destinationStatus(repo,ledger({...check,contentType:'application/json'}),now).url,null);
});

test('destination probes separate unavailable HTML from access restrictions and network uncertainty',async()=>{
  assert.equal((await probeDestination(repo,async()=>html(404),now)).status,'unavailable');
  assert.equal((await probeDestination(repo,async()=>html(200,'application/json'),now)).status,'unavailable');
  assert.equal((await probeDestination(repo,async()=>new Response('',{headers:{'content-type':'text/html'}}),now)).status,'unavailable');
  for(const code of [401,403,429])assert.equal((await probeDestination(repo,async()=>html(code),now)).status,'inconclusive');
  assert.equal((await probeDestination(repo,async()=>{throw Error('timeout');},now)).status,'inconclusive');
  assert.equal(destinationStatus({...repo,pages:false},null,now).state,'none');
});

test('redirect checks are bounded and cannot follow unsafe destinations',async()=>{
  const calls=[];
  const check=await probeDestination(repo,async url=>{calls.push(url);return calls.length===1?new Response('',{status:301,headers:{location:'https://public-project.example.net/'}}):html();},now);
  assert.equal(check.status,'reachable');assert.equal(check.url,'https://public-project.example.net/');assert.equal(calls.length,2);
  let blockedCalls=0;
  const blocked=await probeDestination(repo,async()=>{blockedCalls++;return new Response('',{status:302,headers:{location:'http://127.0.0.1/private'}});},now);
  assert.equal(blocked.status,'inconclusive');assert.equal(blockedCalls,1);
  let loopCalls=0;
  const loop=await probeDestination(repo,async()=>{loopCalls++;return new Response('',{status:302,headers:{location:'/again'}});},now);
  assert.equal(loop.status,'inconclusive');assert.equal(loopCalls,6);
  for(const value of ['javascript:alert(1)','https://user:secret@example.net/','https://127.0.0.1/','https://2130706433/','https://[::1]/','https://project.local/','https://github.com/MichaelWave369/Example'])assert.equal(publicDestination(value),null);
});
