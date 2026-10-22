import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId} from '../src/project-links.js';
import {publishedAtlasRecords,publishedAtlasIds,publishedAtlasLabel,publishedAtlasLink,ATLAS_PUBLISHED_SOURCE} from '../src/atlas-published.js';

const load=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const snapshot=load('atlas-published'),repos=load('repos').repos,base='https://michaelwave369.github.io/FieldAtlas/';

test('Atlas published provenance is distinct from reviewed Atlas chapter map',()=>{
  const ids=publishedAtlasIds(snapshot,repos);
  assert.equal(snapshot.sourceUrl,ATLAS_PUBLISHED_SOURCE);
  assert.equal(snapshot.verifiedCount,126);
  assert.equal(snapshot.pages.length,126);
  assert.equal(ids.size,125,'One newly published site is not in the older 177-repo Constellation snapshot');
  assert.match(publishedAtlasLabel(snapshot,repos),/125 of 126 Atlas-verified published sites/);
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

test('verified public Pages are not proof of a visitor-curated chapter or live app behavior',()=>{
  const missing=snapshot.pages.filter(row=>!repos.some(repo=>projectId(repo)===row.projectId));
  assert.equal(missing.length,1);
  assert.equal(missing[0].repo,'PhiOS-XR');
  assert(!publishedAtlasIds(snapshot,repos).has(missing[0].projectId));
});
