import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareRepos,layoutPositions,layoutEdges,languageOrbits,filterRepos,colorFor,normalizePublic,safeUrl} from '../src/model.js';

// Synthetic fixtures; none represents a captured account repository.
const fixture=prepareRepos([
  {id:'new',name:'Newest',description:'',language:'Python',created:'2026-03-01T00:00:00Z',updated:'2026-03-02T00:00:00Z',visibility:'private',pages:false,fork:false,size:80},
  {id:'old',name:'Oldest',description:'',language:'JavaScript',created:'2026-01-01T00:00:00Z',updated:'2026-01-02T00:00:00Z',visibility:'public',pages:true,fork:false,size:100},
  {id:'mid',name:'Middle',description:'',language:'Python',created:'2026-02-01T00:00:00Z',updated:'2026-02-02T00:00:00Z',visibility:'public',pages:true,fork:true,size:200}
]);

test('all five layouts retain every project, including inventories beyond 512 nodes',()=>{
  const large=prepareRepos(Array.from({length:600},(_,i)=>({...fixture[0],id:'repo-'+i,name:'Repository '+i,created:new Date(Date.UTC(2026,0,1)+i*3600000).toISOString()})));
  for(const mode of ['constellation','helix','sphere','orbits','spiral'])for(const repos of [[],fixture.slice(0,1),fixture,large]){
    const positions=layoutPositions(repos,mode);assert.equal(positions.length,repos.length);assert(positions.every(p=>p.length===3&&p.every(Number.isFinite)));assert.equal(new Set(positions.map(p=>p.join(','))).size,repos.length);
  }
});

test('both timeline layouts connect actual creation order',()=>{
  for(const mode of ['helix','spiral']){
    const positions=layoutPositions(fixture,mode),names=layoutEdges(fixture,positions,mode).map(([a,b])=>[fixture[a].name,fixture[b].name]);
    assert.deepEqual(names,[['Oldest','Middle'],['Middle','Newest']]);
    const byName=new Map(fixture.map((r,i)=>[r.name,positions[i]]));assert(byName.get('Oldest')[1]<byName.get('Middle')[1]);assert(byName.get('Middle')[1]<byName.get('Newest')[1]);
  }
});

test('language rings separate languages, connect only peers, and give larger populations more room',()=>{
  const rings=languageOrbits(fixture),python=rings.find(r=>r.language==='Python'),js=rings.find(r=>r.language==='JavaScript');assert(python.radius>js.radius);
  const points=layoutPositions(fixture,'orbits');fixture.forEach((r,i)=>{const ring=rings.find(x=>x.language===r.language);assert(Math.abs(Math.hypot(points[i][0],points[i][2])-ring.radius)<1e-8);});
  const edges=layoutEdges(fixture,points,'orbits');assert.equal(edges.length,1);assert(edges.every(([a,b])=>fixture[a].language===fixture[b].language));
});

test('Pages, fork, privacy, language and search filters compose without changing the inventory',()=>{
  assert.deepEqual(filterRepos(fixture,{pagesOnly:true,hideForks:true}).map(r=>r.name),['Oldest']);
  assert.deepEqual(filterRepos(fixture,{visibility:'private',language:'Python'}).map(r=>r.name),['Newest']);
  assert.equal(filterRepos(fixture,{visibility:'private',pagesOnly:true}).length,0);
  assert.deepEqual(filterRepos(fixture,{query:'mIdDlE'}).map(r=>r.id),['mid']);assert.equal(fixture.length,3);
});

test('language and age colors honor their displayed keys',()=>{
  const now=Date.parse('2026-10-21T00:00:00Z');assert.equal(colorFor({language:'Python'},'language',now),'#3fbfa0');
  for(const [days,color]of [[0,'#f5d68b'],[7,'#f5d68b'],[8,'#d7a866'],[30,'#d7a866'],[31,'#8ba58b'],[90,'#8ba58b'],[91,'#6d7884']])assert.equal(colorFor({updated:new Date(now-days*86400000).toISOString()},'activity',now),color);
});

test('public refresh retains Pages and issue metadata and accepts only safe outgoing links',()=>{
  const repo=normalizePublic({id:12,name:'Example',html_url:'https://github.com/MichaelWave369/Example',has_pages:true,open_issues_count:3,language:null});
  assert.equal(repo.pages,true);assert.equal(repo.issues,3);assert.equal(repo.visibility,'public');assert.equal(repo.homepage,'https://michaelwave369.github.io/Example/');
  assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('data:text/html,test'),null);assert.equal(safeUrl('https://github.com/MichaelWave369'), 'https://github.com/MichaelWave369');
});

test('the public snapshot excludes private records and retains the reconciled Grok inventory',()=>{
  const data=JSON.parse(readFileSync(new URL('../src/repos.json',import.meta.url),'utf8'));
  assert(data.complete);assert.equal(new Set(data.repos.map(r=>r.id)).size,data.repos.length);assert.equal(new Set(data.repos.map(r=>r.name.toLowerCase())).size,data.repos.length);
  assert.equal(data.scope,'public');assert(data.repos.length>0);assert(data.repos.every(r=>r.visibility==='public'&&r.url==='https://github.com/'+data.owner+'/'+r.name));assert.equal(data.integration.matchingRepositories,data.integration.grokPublicSnapshotCount);assert(data.repos.every(r=>typeof r.pages==='boolean'&&typeof r.issues==='number'));
});
