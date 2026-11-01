import test from 'node:test';
import assert from 'node:assert/strict';
import {availableMissions,emptyMissionSave,readMissionSave,sanitizeMissionSave,attemptMission,missionProgress,MISSION_XP,MISSIONS} from '../src/missions.js';

const names=[...new Set(MISSIONS.flatMap(m=>m.options))];
const repos=names.map((name,i)=>({id:String(i+1),name,visibility:'public',group:i%2?'play':'infrastructure'}));
test('nine unique missions form three thematic acts with public, present repository choices',()=>{
  assert.equal(MISSIONS.length,9);
  assert.equal(new Set(MISSIONS.map(m=>m.id)).size,9);
  const list=availableMissions(repos);
  assert.equal(list.length,9);
  assert.deepEqual(list.map(m=>m.act),[1,1,1,2,2,2,3,3,3]);
  assert(list.every(m=>m.optionRepos.length===3&&m.optionRepos.some(repo=>repo.name===m.answer)));
  assert(list.every(m=>m.answerRepo.visibility==='public'));
});
test('private or unavailable candidate never appears as a public mission choice',()=>{
  const unavailable=repos.filter(repo=>repo.name!=='PhiSafe');
  const filtered=availableMissions(unavailable);
  assert(filtered.length<9);
  assert(filtered.every(m=>m.optionRepos.every(r=>r.visibility==='public')));
  const hidden=availableMissions(repos.map(r=>r.name==='PhiServe'?{...r,visibility:'private'}:r));
  assert(hidden.length<9);
  assert(hidden.every(m=>m.optionRepos.every(r=>r.visibility==='public')));
});
test('sequential gate, wrong answer, correct answer, replay and XP are deterministic',()=>{
  let save=emptyMissionSave();
  assert.equal(missionProgress(repos,save).current.id,'sanctuary-01');
  const outOfOrder=attemptMission(repos,save,'frontier-09','PhiXRCommons');
  assert.equal(outOfOrder.accepted,false);
  assert.deepEqual(outOfOrder.save,save);
  const wrong=attemptMission(repos,save,'sanctuary-01','PhiServe');
  assert.equal(wrong.accepted,true);
  assert.equal(wrong.correct,false);
  assert.deepEqual(wrong.save,save);
  for(let i=0;i<MISSIONS.length;i++){
    const mission=MISSIONS[i];
    const answer=attemptMission(repos,save,mission.id,mission.answer);
    assert.equal(answer.correct,true);
    save=answer.save;
    assert.equal(missionProgress(repos,save).xp,(i+1)*MISSION_XP);
    assert.equal(attemptMission(repos,save,mission.id,mission.answer).accepted,false,'replay grants no additional XP');
  }
  const ending=missionProgress(repos,save);
  assert.equal(ending.finished,true);
  assert.equal(ending.current,null);
  assert.equal(ending.cleared,9);
  assert(ending.chapters.every(ch=>ch.cleared===3));
});
test('local save rejects arbitrary IDs, duplicated IDs, out of order progress and oversized data',()=>{
  const forged={schemaVersion:1,completedIds:['frontier-09','sanctuary-01','sanctuary-01','nonexistent',33]};
  assert.deepEqual(sanitizeMissionSave(forged,repos).completedIds,['sanctuary-01']);
  assert.deepEqual(readMissionSave('{not JSON',repos),emptyMissionSave());
  assert.deepEqual(readMissionSave('x'.repeat(2049),repos),emptyMissionSave());
  assert.deepEqual(readMissionSave(JSON.stringify({schemaVersion:2,completedIds:['sanctuary-01']}),repos),emptyMissionSave());
  const legit={schemaVersion:1,completedIds:MISSIONS.slice(0,3).map(m=>m.id)};
  assert.deepEqual(readMissionSave(JSON.stringify(legit),repos),legit);
});
test('loss of a public project prunes unavailable mission claims without affecting other game state',()=>{
  const save={schemaVersion:1,completedIds:MISSIONS.map(m=>m.id)};
  const reduced=repos.filter(r=>r.name!=='PhiXRCommons');
  const normalized=sanitizeMissionSave(save,reduced);
  assert.equal(normalized.completedIds.length,8);
  assert.equal(missionProgress(reduced,normalized).total,8);
});
