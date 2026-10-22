import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {atlasCoverageAudit,atlasCoverageReceipt,COVERAGE_KIND} from '../src/atlas-audit.js';
import {projectId} from '../src/project-links.js';

const load=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const inventory=load('repos'),repos=inventory.repos,atlas=load('atlas'),published=load('atlas-published');

test('coverage receipt distinguishes recorded reviewed chapters, published HTML and public repositories',()=>{
  const audit=atlasCoverageAudit(repos,inventory,atlas,published);
  assert.equal(audit.kind,COVERAGE_KIND);
  assert.equal(audit.publicInventory.repositoryCount,177);
  assert.equal(audit.reviewed.valid,true);
  assert.equal(audit.reviewed.recordedCount,124);
  assert.equal(audit.reviewed.matchedCount,124);
  assert.equal(audit.published.valid,true);
  assert.equal(audit.published.verifiedHtmlCount,126);
  assert.equal(audit.published.matchedCount,125);
  assert.equal(audit.published.unmatchedCount,1);
  assert.deepEqual(audit.published.unmatched,[{
    projectId:'github:1429113142',
    repo:'PhiOS-XR',
    reason:'not present in displayed public snapshot'
  }]);
  const printable=JSON.parse(atlasCoverageReceipt(repos,inventory,atlas,published));
  assert.deepEqual(printable,audit);
  assert(!JSON.stringify(printable).includes('favoriteIds'),'visitor passport must never be included');
});

test('when a newer public inventory contains the missing project, audit matches it without changing source claims',()=>{
  const next=[...repos,{id:'1429113142',name:'PhiOS-XR',visibility:'public'}];
  const report=atlasCoverageAudit(next,inventory,atlas,published);
  assert.equal(report.published.matchedCount,126);
  assert.deepEqual(report.published.unmatched,[]);
  assert.equal(report.published.verifiedHtmlCount,126);
});

test('a private or renamed repository never silently enters public coverage',()=>{
  const found=repos.find(r=>r.name==='Domistika');
  assert(found);
  const modified=repos.map(r=>r.id===found.id?{...r,visibility:'private'}:r);
  const a=atlasCoverageAudit(modified,inventory,atlas,published);
  assert(a.published.unmatched.some(x=>x.projectId===projectId(found)));
  assert.equal(a.publicInventory.repositoryCount,176);
  const renamed=repos.map(r=>r.id===found.id?{...r,name:'renamed-example'}:r);
  const b=atlasCoverageAudit(renamed,inventory,atlas,published);
  assert(b.published.unmatched.some(x=>x.projectId===projectId(found)&&x.reason.includes('name differs')));
});

test('invalid published/reviewed sources produce explicit invalid status, not a false zero',()=>{
  const broken=atlasCoverageAudit(repos,inventory,{...atlas,chapters:[atlas.chapters[0],atlas.chapters[0]]},{...published,owner:'somebody-else'});
  assert.equal(broken.reviewed.valid,false);
  assert.equal(broken.reviewed.matchedCount,null);
  assert.equal(broken.published.valid,false);
  assert.equal(broken.published.unmatchedCount,null);
  assert.deepEqual(broken.published.unmatched,[]);
  for(const changed of [
    {...published,pages:[published.pages[0],published.pages[0],...published.pages.slice(2)]},
    {...published,pages:[{...published.pages[0],url:'javascript:evil'},...published.pages.slice(1)]},
    {...published,verifiedCount:5000},
  ])assert.equal(atlasCoverageAudit(repos,inventory,atlas,changed).published.valid,false);
});

test('receipt remains a dated reproducible observation instead of querying a live system',()=>{
  const audit=atlasCoverageAudit(repos,inventory,atlas,published);
  assert.equal(audit.publicInventory.fetchedAt,inventory.fetchedAt);
  assert.equal(audit.reviewed.checkedAt,atlas.checkedAt);
  assert.equal(audit.published.sourceGeneratedAt,published.sourceGeneratedAt);
  assert(!('checkedNow' in audit));
});
