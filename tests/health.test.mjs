import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnapshot} from '../src/inventory.js';
import {resolveRelationships} from '../src/relationships.js';
import {validateHealthObservations,summarizeHealth,renderHealthBoard,inspectPublicCi,renderCiLookup} from '../src/gateway/health.js';

const read=path=>JSON.parse(readFileSync(new URL('../src/'+path,import.meta.url),'utf8'));
const snapshot=parseSnapshot(read('repos.json'));
const checks=read('deployments.json');
const relationships=resolveRelationships(snapshot.repos,read('relationships.json'));
const source=read('health-observations.json');
const now=Date.parse('2026-11-09T10:00:00Z');
const find=name=>snapshot.repos.find(repo=>repo.name===name);

test('dated health observations include only source-scoped public GitHub PR runs',()=>{
  const reviewed=validateHealthObservations(source,now);
  assert.equal(reviewed.ci.length,2);
  assert(reviewed.ci.every(run=>run.event==='pull_request'&&/^[0-9a-f]{40}$/.test(run.headSha)));
  assert.equal(reviewed.publication.site,'www.enterthefield.org');
});

test('stale HTML checks never become fresh verified uptime or current broken apps',()=>{
  const data=summarizeHealth(snapshot.repos,{
    deployments:checks,relationships,observations:validateHealthObservations(source,now),
    snapshotAt:new Date(now-5*86400000).toISOString()
  },now);
  assert(data.destination.stale>0,'old destination evidence must age into recheck');
  assert.equal(data.destination.reachable,0);
  assert.equal(data.destination.unavailable,0,'old HTTP failure must not be a current breakage');
  assert.equal(data.inventoryFresh,false,'a five-day-old public inventory needs refresh');
  assert.equal(data.observedGap,true);
  assert.equal(data.publicationFresh,true);
  assert(data.relationshipCount>0);
});

test('PR run coverage cannot become 225 green repositories',()=>{
  const data=summarizeHealth(snapshot.repos,{
    deployments:checks,relationships,observations:validateHealthObservations(source,now),
    snapshotAt:snapshot.fetchedAt
  },now);
  assert(data.covered<=2);
  assert.equal(data.ciUnknown,data.total-data.covered);
  assert.equal(data.recentPrFailures,0);
  assert(data.recentPrPasses>=1);
  const html=renderHealthBoard(data);
  assert.match(html,/Cited PR checks passed/);
  assert.match(html,/CI coverage unknown/);
  assert.match(html,/not current main or production/);
  assert.match(html,/Review Netlify publish source/);
  assert.doesNotMatch(html,/All systems healthy|100% uptime|All builds green/i);
});

test('publication discrepancy expires to recheck, not permanent outage',()=>{
  const later=Date.parse(source.publication.observedAt)+8*86400000;
  const data=summarizeHealth(snapshot.repos,{
    observations:validateHealthObservations(source,later),snapshotAt:snapshot.fetchedAt
  },later);
  const html=renderHealthBoard(data);
  assert.equal(data.publicationFresh,false);
  assert.match(html,/previous publication gap was recorded/);
  assert.match(html,/Recheck the previously observed production/);
  assert.doesNotMatch(html,/Action: review publication mismatch/);
});

test('incomplete and hostile health evidence fails closed',()=>{
  for(const changed of [
    {...source,owner:'OtherOrg'},
    {...source,scope:'private-fleet'},
    {...source,token:'secret'},
    {...source,ci:[{...source.ci[0],repositoryId:'../../hidden'}]},
    {...source,ci:[{...source.ci[0],conclusion:'all-green'}]},
    {...source,ci:[{...source.ci[0],workflow:'<script>x</script>',extra:'private'}]},
    {...source,publication:{...source.publication,productionUrl:'https://127.0.0.1/private'}},
    {...source,publication:{...source.publication,observedAt:'2099-01-01T00:00:00Z'}}
  ])assert.throws(()=>validateHealthObservations(changed,now));
});

test('unknown destination and relationship coverage remains explicitly unknown',()=>{
  const data=summarizeHealth(snapshot.repos,{snapshotAt:snapshot.fetchedAt},now);
  assert.equal(data.destination.unknown,data.total);
  assert.equal(data.relationshipCount,null);
  assert.equal(data.recentPrPasses,0);
  assert.match(renderHealthBoard(data),/No verified public-domain publication comparison/);
});

test('anonymous CI lookup is click-triggered, strictly public and run-scoped',async()=>{
  const repo=find('FieldConstellation');
  let requested='';
  const result=await inspectPublicCi(repo,async (url,options)=>{
    requested=url;
    assert.equal(options.headers.Accept,'application/vnd.github+json');
    assert.equal(options.headers.Authorization,undefined);
    return {ok:true,json:async()=>({workflow_runs:[
      {id:7121,head_branch:'main',head_sha:'a'.repeat(40),name:'public CI',
       status:'completed',conclusion:'success',event:'workflow_dispatch',
       repository:{full_name:'MichaelWave369/FieldConstellation'}}
    ]})};
  });
  assert.match(requested,/api\.github\.com\/repos\/MichaelWave369\/FieldConstellation\/actions\/runs/);
  assert.equal(result.state,'observed-success');
  assert.match(renderCiLookup(result),/This run alone does not certify current HEAD/);
  await assert.rejects(()=>inspectPublicCi({...repo,visibility:'private'},async()=>{throw Error('must not fetch');}));
});

test('CI lookup treats failed API and missing branch-matching evidence as unknown',async()=>{
  await assert.rejects(()=>inspectPublicCi(find('PhiOS'),async()=>({ok:false,status:403})));
  const result=await inspectPublicCi(find('PhiOS'),async()=>({ok:true,json:async()=>({workflow_runs:[]})}));
  assert.equal(result.state,'unknown');
  assert.match(renderCiLookup(result),/No matching public workflow/);
});

test('gateway integrates health via existing local module without private fleet calls',()=>{
  const page=readFileSync(new URL('../src/gateway/index.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../src/gateway/overview.js',import.meta.url),'utf8');
  assert.equal((page.match(/<script\b/g)||[]).length,1);
  for(const field of ['gatewayHealth','gatewayHealthRepo','gatewayHealthCheck','gatewayHealthResult'])
    assert(page.includes('id="'+field+'"'));
  assert.match(script,/renderHealthBoard/);
  assert.match(script,/inspectPublicCi/);
  assert(!/127\.0\.0\.1:8765|GITHUB_TOKEN|privateRepoNerve/i.test(script));
});
