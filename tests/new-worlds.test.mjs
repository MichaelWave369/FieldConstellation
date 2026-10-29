import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnapshot} from '../src/inventory.js';
import {prepareRepos,categoryFor} from '../src/model.js';
import {availableTrails} from '../src/trails.js';
import {reviewedAtlasIds} from '../src/atlas-lens.js';
import {publishedAtlasIds} from '../src/atlas-published.js';
import {projectId} from '../src/project-links.js';

const read=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const inventory=parseSnapshot(read('repos'));
const repos=inventory.repos, reviewed=read('atlas'), published=read('atlas-published');

test('public inventory is a fully validated 199-record independent snapshot',()=>{
  assert.equal(repos.length,199);
  assert.equal(new Set(repos.map(r=>r.id)).size,199);
  assert(repos.every(r=>r.visibility==='public'));
  for(const name of ['BTM','SparkTheSubstrate','EchoesOfTheNine','TweedleVerse','LENZ','FieldStoryForge','BackyardProductionCompany','GenEWrist','PhiPress','PhiOS-XR']){
    assert(repos.some(r=>r.name===name),'missing public star '+name);
  }
});

test('recent games and studios have editorial groups without invented integration edges',()=>{
  const prepared=prepareRepos(repos);
  for(const name of ['BTM','SparkTheSubstrate','EchoesOfTheNine','TweedleVerse','LENZ']){
    assert.equal(categoryFor(repos.find(r=>r.name===name)),'play',name);
    assert.equal(prepared.find(r=>r.name===name).group,'play',name);
  }
  for(const name of ['FieldStoryForge','BackyardProductionCompany'])assert.equal(categoryFor(repos.find(r=>r.name===name)),'creative');
  assert.equal(categoryFor(repos.find(r=>r.name==='GenEWrist')),'infrastructure');
});

test('new guided routes resolve safely from public stars, not claims of live demos',()=>{
  const trails=availableTrails(repos);
  assert(trails.some(t=>t.id==='new-worlds'));
  assert(trails.some(t=>t.id==='studio-circuit'));
  const games=trails.find(t=>t.id==='new-worlds');
  assert.deepEqual(games.stops.map(s=>s.name),['BTM','SparkTheSubstrate','EchoesOfTheNine','TweedleVerse','LENZ']);
  const without=availableTrails(repos.filter(r=>r.name!=='BTM'));
  assert(!without.find(t=>t.id==='new-worlds').stops.some(r=>r.name==='BTM'));
  assert(trails.every(t=>t.stops.every(s=>s.visibility==='public')));
});

test('a reviewed Atlas chapter is distinct from published Pages and an undocumented repo',()=>{
  const indexed=reviewedAtlasIds(reviewed,repos);
  const verified=publishedAtlasIds(published,repos);
  assert.equal(indexed.size,131);
  assert.equal(verified.size,148);
  for(const name of ['BTM','SparkTheSubstrate','TweedleVerse','LENZ','FieldStoryForge','GenEWrist','BackyardProductionCompany']){
    const repo=repos.find(r=>r.name===name);assert(indexed.has(projectId(repo)));assert(verified.has(projectId(repo)));
  }
  const echo=repos.find(r=>r.name==='EchoesOfTheNine');
  assert(echo&&!indexed.has(projectId(echo))&&!verified.has(projectId(echo)));
});
