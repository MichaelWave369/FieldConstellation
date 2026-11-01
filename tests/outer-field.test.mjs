import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS} from '../src/missions.js';
import {OUTER_STEPS,OUTER_MAX_XP,emptyOuter,availableOuter,readOuter,sanitizeOuter,outerProgress,attemptOuter} from '../src/outer-field.js';
import {projectId} from '../src/project-links.js';

const names=new Set(MISSIONS.flatMap(m=>m.options));
for(const step of OUTER_STEPS){
  step.sources.forEach(name=>names.add(name));
  if(step.visit)names.add(step.visit);
  if(step.id!=='warden-convergence')step.choices.forEach(([ids])=>ids.split('|').forEach(name=>names.add(name)));
}
const repos=[...names].map((name,i)=>({id:String(i+1),name,visibility:'public',group:'infrastructure',url:'https://github.com/MichaelWave369/'+name}));
const fullGates={schemaVersion:1,completedIds:MISSIONS.map(m=>m.id)};
const incompleteGates={schemaVersion:1,completedIds:MISSIONS.slice(0,8).map(m=>m.id)};
const quest={schemaVersion:1,discoveredIds:repos.map(projectId)};
test('outer field is a nine-stage 3/2/1/3 sequence with source-backed public choices',()=>{
  const steps=availableOuter(repos);
  assert.equal(steps.length,9);
  assert.equal(new Set(steps.map(s=>s.id)).size,9);
  assert.deepEqual(steps.map(s=>s.kind),['artifact','artifact','artifact','combination','combination','secret','boss','boss','boss']);
  assert(steps.every(s=>s.sourceRepos.length>0&&s.sourceRepos.every(r=>r.visibility==='public')));
  assert.equal(OUTER_MAX_XP,400);
});
test('nine-gates completion is mandatory, and a missing/private project fails closed',()=>{
  assert.equal(outerProgress(repos,incompleteGates,emptyOuter()).unlocked,false);
  assert.equal(attemptOuter(repos,incompleteGates,emptyOuter(),quest,'artifact-atlas','FieldAtlas').accepted,false);
  const hidden=repos.map(repo=>repo.name==='Agentora'?{...repo,visibility:'private'}:repo);
  assert.equal(availableOuter(hidden).length,0);
  assert.equal(outerProgress(hidden,fullGates,emptyOuter()).available,false);
  assert.equal(outerProgress(hidden,fullGates,emptyOuter()).finished,false);
  assert.equal(attemptOuter(hidden,fullGates,emptyOuter(),quest,'artifact-atlas','FieldAtlas').accepted,false);
});
test('artifact hunts require a genuine previously discovered public repo star',()=>{
  const start=emptyOuter();
  const wrong=attemptOuter(repos,fullGates,start,quest,'artifact-atlas','PocketBrain');
  assert.equal(wrong.reason,'wrong');
  assert.deepEqual(wrong.save,start);
  const notVisited=attemptOuter(repos,fullGates,start,{discoveredIds:[]},'artifact-atlas','FieldAtlas');
  assert.equal(notVisited.reason,'visit-required');
  assert.equal(notVisited.visitRepo.name,'FieldAtlas');
  const cleared=attemptOuter(repos,fullGates,start,quest,'artifact-atlas','FieldAtlas');
  assert.equal(cleared.reason,'cleared');
  assert.equal(outerProgress(repos,fullGates,cleared.save).xp,30);
  assert.equal(attemptOuter(repos,fullGates,cleared.save,quest,'artifact-atlas','FieldAtlas').accepted,false);
});
test('all nine challenges unlock secret and boss sequentially, without repeatable XP',()=>{
  let save=emptyOuter();
  for(const [index,step] of OUTER_STEPS.entries()){
    const outOfOrder=attemptOuter(repos,fullGates,save,quest,'warden-convergence','evidence-bound');
    if(index<8)assert.equal(outOfOrder.accepted,false);
    const result=attemptOuter(repos,fullGates,save,quest,step.id,step.correct);
    assert.equal(result.reason,'cleared',step.id);
    save=result.save;
    const progress=outerProgress(repos,fullGates,save);
    assert.equal(progress.cleared,index+1);
    assert.equal(progress.xp,OUTER_STEPS.slice(0,index+1).reduce((n,s)=>n+s.xp,0));
    if(index===4){assert(progress.secretOpen);assert.equal(progress.current.id,'hidden-wrist');}
    if(index===5){assert.equal(progress.current.kind,'boss');assert.equal(progress.bossHealth,3);}
    if(index>=6)assert.equal(progress.bossHealth,3-(index-5));
  }
  const final=outerProgress(repos,fullGates,save);
  assert.equal(final.finished,true);
  assert.equal(final.xp,400);
  assert.equal(final.relics.length,4);
  assert.equal(final.bossHealth,0);
  assert.equal(attemptOuter(repos,fullGates,save,quest,'warden-convergence','evidence-bound').accepted,false);
});
test('storage rejects out-of-order completions, unknown steps and untrusted versions',()=>{
  assert.deepEqual(readOuter('nope',repos),emptyOuter());
  assert.deepEqual(readOuter('x'.repeat(2501),repos),emptyOuter());
  assert.deepEqual(sanitizeOuter({schemaVersion:500,completedIds:OUTER_STEPS.map(s=>s.id)},repos),emptyOuter());
  const mixed={schemaVersion:1,completedIds:['warden-convergence','artifact-atlas','bad','artifact-memory','artifact-memory']};
  assert.deepEqual(sanitizeOuter(mixed,repos).completedIds,['artifact-atlas','artifact-memory']);
  assert.deepEqual(readOuter(JSON.stringify(mixed),repos).completedIds,['artifact-atlas','artifact-memory']);
});
