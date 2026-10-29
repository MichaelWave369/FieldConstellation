import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId} from '../src/project-links.js';
import {publishedAtlasRecords,publishedAtlasIds,publishedAtlasLabel,publishedAtlasLink,publishedAtlasWebsite,ATLAS_PUBLISHED_SOURCE} from '../src/atlas-published.js';

const load=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const snapshot=load('atlas-published'),repos=load('repos').repos,base='https://michaelwave369.github.io/FieldAtlas/';

test('Atlas published provenance is distinct from reviewed Atlas chapter map',()=>{
  const ids=publishedAtlasIds(snapshot,repos);
  assert.equal(snapshot.sourceUrl,ATLAS_PUBLISHED_SOURCE);
  assert.equal(snapshot.verifiedCount,148);
  assert.equal(snapshot.pages.length,148);
  assert.equal(ids.size,148,'All current verified Atlas IDs should match the complete public snapshot');
  assert.match(publishedAtlasLabel(snapshot,repos),/148 of 148 Atlas-verified published sites/);
  for(const id of ids)assert(repos.some(r=>r.visibility==='public'&&projectId(r)===id));
});

test('published manifest links use the numeric Atlas alias and preserve Pages subpath',()=>{
  const repo=repos.find(r=>r.name==='Domistika');
  const link=publishedAtlasLink(snapshot,repos,repo);
  assert(link);
  const url=new URL(link);
  assert.equal(url.href,base+'?project='+encodeURIComponent(projectId(repo)));
  assert.equal(url.searchParams.get('project'),projectId(repo));
});

test('renamed, private, unknown and malformed identities are never published',()=>{
  const repo=repos.find(r=>r.name==='Domistika');
  const altered=repos.map(r=>r.id===repo.id?{...r,visibility:'private'}:r);
  assert.equal(publishedAtlasLink(snapshot,altered,repo),null);
  const renamed={...repo,name:'NewName'};
  assert(!publishedAtlasRecords(snapshot,[renamed]).has(projectId(repo)));
  assert.equal(publishedAtlasLink(snapshot,repos,{...repo,id:'123456789999'}),null);
  const badRow={...snapshot.pages[0],projectId:'javascript:alert(1)'};
  const bad={...snapshot,pages:[badRow,...snapshot.pages.slice(1)]};
  assert.equal(publishedAtlasIds(bad,repos).size,0);
});

test('tampering, duplicate records, wrong source and invalid URLs fail closed',()=>{
  const [first,second]=snapshot.pages;
  const variants=[
    {...snapshot,owner:'not-the-owner'},
    {...snapshot,sourceUrl:'https://attacker.example/list'},
    {...snapshot,verifiedCount:1000},
    {...snapshot,sourceGeneratedAt:'not-a-date'},
    {...snapshot,pages:[first,first,...snapshot.pages.slice(2)]},
    {...snapshot,pages:[{...first,url:'https://evil.example/?id=1'},...snapshot.pages.slice(1)]},
    {...snapshot,pages:[{...first,url:'javascript:evil'},...snapshot.pages.slice(1)]},
    {...snapshot,pages:[{...first,repo:second.repo},...snapshot.pages.slice(1)]}
  ];
  for(const item of variants)assert.equal(publishedAtlasIds(item,repos).size,0);
});

test('a public game repository can be present without a verified Pages destination',()=>{
  const game=repos.find(repo=>repo.name==='EchoesOfTheNine');
  const xr=repos.find(repo=>repo.name==='PhiOS-XR');
  assert(game&&xr);
  assert(!publishedAtlasIds(snapshot,repos).has(projectId(game)));
  assert(publishedAtlasIds(snapshot,repos).has(projectId(xr)));
  assert(snapshot.pages.every(row=>repos.some(repo=>repo.visibility==='public'&&projectId(repo)===row.projectId)));
});

test('dated verified website fallback returns canonical URL only for matching public IDs',()=>{
  const reel=repos.find(r=>r.name==='ReelCommons');
  assert(reel);
  assert.equal(publishedAtlasWebsite(snapshot,repos,reel),'https://michaelwave369.github.io/ReelCommons/');
  const echo=repos.find(r=>r.name==='EchoesOfTheNine');
  assert(echo);
  assert.equal(publishedAtlasWebsite(snapshot,repos,echo),null);
  assert.equal(publishedAtlasWebsite(snapshot,repos,{...reel,visibility:'private'}),null);
  assert.equal(publishedAtlasWebsite({...snapshot,owner:'Other'},repos,reel),null);
  assert.equal(publishedAtlasWebsite(snapshot,repos,{...reel,name:'REELCommons'}),'https://michaelwave369.github.io/ReelCommons/');
  const ui=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(ui,/!destination.url&&publishedSite/);
  assert.match(ui,/Open Atlas-listed website/);
});
