import test from 'node:test';
import assert from 'node:assert/strict';
import {IMMERSIVE_STARS,resolveImmersiveExhibits,recentCheckSummary,RECENT_CHECK_WINDOW_MS} from '../src/immersive.js';

const names=[...IMMERSIVE_STARS];
const repos=names.map((name,i)=>({id:String(i+1),name,visibility:'public',homepage:'https://field.example.net/'+name+'/'}));
test('immersive exhibition is bounded, stable and public-only',()=>{
  assert.equal(resolveImmersiveExhibits(repos).length,12);
  assert.deepEqual(resolveImmersiveExhibits([...repos].reverse()).map(r=>r.name),names);
  const privateOne=repos.map(r=>r.name==='PhiOS'?{...r,visibility:'private'}:r);
  assert(!resolveImmersiveExhibits(privateOne).some(r=>r.name==='PhiOS'));
  assert.deepEqual(resolveImmersiveExhibits([]),[]);
  assert.equal(new Set(resolveImmersiveExhibits([...repos,repos[0]]).map(r=>r.id)).size,12);
});
test('stale deployment snapshots never show a misleading zero HTML result',()=>{
  const now=Date.parse('2026-11-01T20:00:00Z');
  const stale={schemaVersion:1,owner:'MichaelWave369',checkedAt:'2026-10-21T22:04:54Z',checks:[]};
  const result=recentCheckSummary(repos,stale,now);
  assert.equal(result.count,null);
  assert.equal(result.label,'checks expired');
  assert.match(result.detail,/2026-10-21/);
  assert.equal(recentCheckSummary(repos,null,now).count,null);
});
test('fresh verification counts only eligible, unique public HTML observations',()=>{
  const now=Date.parse('2026-11-01T20:00:00Z');
  const checkedAt=new Date(now-RECENT_CHECK_WINDOW_MS+60000).toISOString();
  const base={schemaVersion:1,owner:'MichaelWave369',checkedAt,checks:[
    {projectId:'github:1',candidateUrl:repos[0].homepage,url:repos[0].homepage,checkedAt,status:'reachable',httpStatus:200,contentType:'text/html; charset=utf-8'},
    {projectId:'github:1',candidateUrl:repos[0].homepage,url:repos[0].homepage,checkedAt,status:'reachable',httpStatus:200,contentType:'text/html'},
    {projectId:'github:2',candidateUrl:repos[1].homepage,url:repos[1].homepage,checkedAt,status:'unavailable',httpStatus:404,contentType:'text/html'},
    {projectId:'github:3',candidateUrl:repos[2].homepage,url:repos[2].homepage,checkedAt,status:'reachable',httpStatus:302,contentType:'text/html'},
    {projectId:'github:4',candidateUrl:repos[3].homepage,url:repos[3].homepage,checkedAt,status:'reachable',httpStatus:200,contentType:'application/json'},
    {projectId:'github:9999',candidateUrl:'https://other.example.net/',url:'https://other.example.net/',checkedAt,status:'reachable',httpStatus:200,contentType:'text/html'}
  ]};
  assert.equal(recentCheckSummary(repos,base,now).count,1);
  assert.equal(recentCheckSummary(repos,{...base,owner:'NotThisOwner'},now).count,null);
  const hidden=repos.map(repo=>repo.name==='FieldConstellation'?{...repo,visibility:'private'}:repo);
  assert.equal(recentCheckSummary(hidden,base,now).count,0);
});
