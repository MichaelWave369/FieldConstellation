import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableTrails} from '../src/trails.js';
import {projectId} from '../src/project-links.js';
import {readTrailLink,trailLink,withoutTrail} from '../src/trail-links.js';

const repos=JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8')).repos;
const base='https://michaelwave369.github.io/FieldConstellation/';
const trails=availableTrails(repos);

test('every current public trail stop round trips through its canonical deep link',()=>{
  for(const trail of trails)for(let index=0;index<trail.stops.length;index++){
    const href=trailLink(base,trail,index);
    const parsed=readTrailLink(href,repos);
    assert(parsed);
    assert.equal(parsed.trail.id,trail.id);
    assert.equal(parsed.index,index);
    assert.equal(parsed.repo.id,trail.stops[index].id);
    assert.equal(new URL(href).searchParams.get('repo'),projectId(parsed.repo));
    assert.equal(new URL(href).searchParams.get('stop'),String(index+1));
  }
});

test('unknown, malformed, duplicated, mismatched and out-of-bounds URL claims are rejected',()=>{
  const trail=trails[0],good=trailLink(base,trail,0),url=new URL(good);
  for(const query of [
    '?trail=unknown&stop=1',
    '?trail='+trail.id+'&stop=0',
    '?trail='+trail.id+'&stop=999',
    '?trail='+trail.id+'&stop=01',
    '?trail='+trail.id+'&stop=1&stop=2',
    '?trail='+trail.id+'&stop=1&trail='+trail.id,
    '?trail='+trail.id+'&stop=1&repo=github:999999999999',
    '?trail='+trail.id+'&stop=1&repo='+projectId(trail.stops[0])+'&repo='+projectId(trail.stops[0]),
    '?trail='+trail.id
  ])assert.equal(readTrailLink(base+query,repos),null,query);
  url.searchParams.delete('repo');
  assert.equal(readTrailLink(url.href,repos)?.repo.id,trail.stops[0].id,'repo ID is optional when curated stop is valid');
});

test('private or missing public stops can never be restored from a shared link',()=>{
  const trail=trails[0],href=trailLink(base,trail,0),target=trail.stops[0].id;
  const altered=repos.map(r=>r.id===target?{...r,visibility:'private'}:r);
  const parsed=readTrailLink(href,altered);
  assert.equal(parsed,null,'private project cannot appear even when a stale URL names it');
  assert.equal(readTrailLink(href,repos.filter(r=>r.id!==target)),null,'missing target cannot resolve');
});

test('removing a trail only removes tour parameters, preserving an ordinary project link',()=>{
  const url=trailLink(base+'?utm_source=friend',trails[0],2);
  const cleared=new URL(withoutTrail(url));
  assert.equal(cleared.searchParams.has('trail'),false);
  assert.equal(cleared.searchParams.has('stop'),false);
  assert.equal(cleared.searchParams.get('repo'),projectId(trails[0].stops[2]));
  assert.equal(cleared.searchParams.get('utm_source'),'friend');
  assert.throws(()=>trailLink(base,trails[0],-1));
  assert.throws(()=>trailLink(base,trails[0],99));
});
