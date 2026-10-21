import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRAILS,availableTrails} from '../src/trails.js';

const snapshot = JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')).repos;

test('all curated trails resolve through the current public inventory',()=>{
  const trails=availableTrails(snapshot);
  assert.equal(trails.length,TRAILS.length);
  assert(trails.every(trail=>trail.stops.length>=3));
  for(const trail of trails){
    assert(trail.stops.every(repo=>repo.visibility==='public'));
    assert.equal(new Set(trail.stops.map(r=>r.id)).size,trail.stops.length);
  }
});

test('missing, renamed and private projects never appear as tour stops',()=>{
  const names=['FieldAtlas','FieldConstellation','SuperPhiVessel','Domistika','PhiCade'];
  const repos=names.map((name,id)=>({id:id+1,name,visibility:'public'}));
  const tours=availableTrails(repos);
  assert.equal(tours.length,1);
  assert.deepEqual(tours[0].stops.map(r=>r.name),names);
  const privateCopy=repos.map(r=>r.name==='Domistika'?{...r,visibility:'private'}:r);
  assert(!availableTrails(privateCopy)[0].stops.some(r=>r.name==='Domistika'));
  assert.equal(availableTrails(privateCopy.filter(r=>r.name!=='PhiCade')).length,1);
  assert.equal(availableTrails(privateCopy.filter(r=>!['PhiCade','FieldAtlas'].includes(r.name))).length,0);
});

test('trail IDs and stop names are unique; descriptions never claim verified dependencies',()=>{
  assert.equal(new Set(TRAILS.map(t=>t.id)).size,TRAILS.length);
  for(const trail of TRAILS){
    assert.match(trail.id,/^[a-z][a-z0-9-]*$/);
    assert.equal(new Set(trail.names.map(n=>n.toLowerCase())).size,trail.names.length);
    assert(trail.names.length>=3);
    assert(!/verified dependency|live integration/i.test(trail.description));
  }
});
