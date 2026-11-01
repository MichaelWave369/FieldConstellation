import {projectId} from './project-links.js';
import {missionProgress} from './missions.js';

// Nine curated, public-only learning encounters. Their fictional combinations
// describe complementary design roles, NEVER a verified runtime integration.
export const OUTER_KEY='field-constellation-outer-v1';
export const OUTER_STEPS=[
  {
    id:'artifact-atlas',kind:'artifact',chapter:'Relics of the Field',
    title:'The Archivist’s Lens',scene:'A forgotten map is filled with project names, but the story behind each star is missing. Find the living book that catalogs the worlds.',
    question:'Which repository holds the living project library?',
    choices:[['FieldAtlas','FieldAtlas'],['PocketBrain','PocketBrain'],['BTM','BTM']],
    correct:'FieldAtlas',visit:'FieldAtlas',reward:'Archivist’s Lens',xp:30,
    hint:'It is a book and chapter navigator, not a local memory model or an FPS.',
    lesson:'FieldAtlas is the living library of repository chapters and their linked public destinations. Reviewed chapters and reachable websites have separate evidence standards.',
    sources:['FieldAtlas']
  },
  {
    id:'artifact-memory',kind:'artifact',chapter:'Relics of the Field',
    title:'The Memory Shard',scene:'The traveler forgets what happened between visits. Seek a browser-first, local-first memory companion.',
    question:'Which project explores private, browser-local memory?',
    choices:[['PocketBrain','PocketBrain'],['PhiServe','PhiServe'],['LWG','LWG']],
    correct:'PocketBrain',visit:'PocketBrain',reward:'Memory Shard',xp:30,
    hint:'Look for the browser-based assistant that stores memory locally.',
    lesson:'PocketBrain is a local-first browser AI app with local memory and optional user-controlled model bridge modes. It is not an invisible cross-app memory authority.',
    sources:['PocketBrain']
  },
  {
    id:'artifact-guild',kind:'artifact',chapter:'Relics of the Field',
    title:'The Guild Compass',scene:'A settlement needs to plan multi-step work with approval gates instead of letting a single automated agent roam unchecked.',
    question:'Which project is the local agent operating studio?',
    choices:[['Agentora','Agentora'],['FieldAtlas','FieldAtlas'],['CycleWeave','CycleWeave']],
    correct:'Agentora',visit:'Agentora',reward:'Guild Compass',xp:30,
    hint:'The agent operating studio includes plans, handoffs and guarded actions.',
    lesson:'Agentora explores local agent team orchestration, workflow traces and approval-gated actions. A quest reward does not grant any software execution permission.',
    sources:['Agentora']
  },
  {
    id:'combination-bookmap',kind:'combination',chapter:'The Combination Forge',
    title:'Book and Star Chart',scene:'One navigator needs reviewed project chapters; another needs a 3D way to explore the public repos. The two are complementary, but do not automatically share a runtime.',
    question:'Which pair best explains those two roles?',
    choices:[['FieldAtlas|FieldConstellation','FieldAtlas + FieldConstellation'],['PhiServe|BTM','PhiServe + BTM'],['Agentora|CycleWeave','Agentora + CycleWeave']],
    correct:'FieldAtlas|FieldConstellation',reward:'Navigator’s Alignment',xp:40,
    hint:'One is a living library; the other is the interactive repository map.',
    lesson:'FieldAtlas documents reviewed chapters; FieldConstellation maps public repository stars. Their roles complement each other. This choice does not establish operational integration.',
    sources:['FieldAtlas','FieldConstellation']
  },
  {
    id:'combination-mind',kind:'combination',chapter:'The Combination Forge',
    title:'Mind and Engine',scene:'You want a browser-local memory companion and, separately, an experimental local model-serving backend. Neither should silently obtain credentials or execution rights.',
    question:'Which pair describes the two distinct roles?',
    choices:[['PocketBrain|PhiServe','PocketBrain + PhiServe'],['LWG|ReelTheater','LWG + ReelTheater'],['BTM|CycleWeave','BTM + CycleWeave']],
    correct:'PocketBrain|PhiServe',reward:'Sovereign Circuit',xp:40,
    hint:'Think private browser memory plus an experimental server for separately installed models.',
    lesson:'PocketBrain supports local memory and optional bridges; PhiServe supervises an existing local llama.cpp backend. This puzzle models roles, not a tested product integration.',
    sources:['PocketBrain','PhiServe']
  },
  {
    id:'hidden-wrist',kind:'secret',chapter:'The Hidden World',
    title:'The Room Between Worlds',scene:'Three relics resonate. Behind an unmarked door is a tiny universal interface: it changes its controls to fit the world you enter. Discover the real project behind the fictional secret chamber.',
    question:'Which repository describes Universal Mode and host-registered World Mode?',
    choices:[['GenEWrist','GenEWrist'],['ReelTheater','ReelTheater'],['PhiSafe','PhiSafe']],
    correct:'GenEWrist',visit:'GenEWrist',reward:'World Key',xp:50,
    hint:'The wrist interface hosts a 3–6–9 console and contextual World Mode.',
    lesson:'Gen.E.Wrist is a local-first interface project with Universal Mode and trusted-host World Mode. Finding it in this game does not install it or give a host more permissions.',
    sources:['GenEWrist']
  },
  {
    id:'warden-safety',kind:'boss',chapter:'The Fracture Warden',phase:1,
    title:'Boss Phase I · The Panic Signal',
    scene:'The Fracture Warden blares fabricated disaster predictions. You need a practical offline household planning tool, not false certainty about future events.',
    question:'Choose the tool that helps plan without claiming to forecast hazards.',
    choices:[['PhiSafe','PhiSafe'],['PhiVine','PhiVine'],['BTM','BTM']],
    correct:'PhiSafe',reward:'Warden Shield I',xp:60,
    hint:'Organize preparedness checklists and transport, not predictions.',
    lesson:'PhiSafe offers manual household preparedness planning and does not monitor hazards or predict emergencies. The Warden’s powers are fictional.',
    sources:['PhiSafe']
  },
  {
    id:'warden-authority',kind:'boss',chapter:'The Fracture Warden',phase:2,
    title:'Boss Phase II · The Permission Trap',
    scene:'The Warden offers a magical “approved” token. Your defense requires a coordination contract where describing capability does not silently grant authority.',
    question:'Which repository expresses that explicit authority boundary?',
    choices:[['FieldAccord','FieldAccord'],['PhiServe','PhiServe'],['LWG','LWG']],
    correct:'FieldAccord',reward:'Warden Shield II',xp:60,
    hint:'Find the human–silicon coordination contract with no-authority assessments.',
    lesson:'FieldAccord describes collaboration intents, capabilities and bounded receipts, not blanket permission to act. The quest itself grants no authority.',
    sources:['FieldAccord']
  },
  {
    id:'warden-convergence',kind:'boss',chapter:'The Fracture Warden',phase:3,
    title:'Boss Phase III · The Living Constellation',
    scene:'The Warden tries to convince you that all 211 stars must secretly run together. Defeat it by keeping the project library, map and real evidence separate.',
    question:'Which statement best describes the ecosystem today?',
    choices:[['everything-live','Every public repository is already deployed and integrated'],['evidence-bound','Public stars are discoverable; reviewed links, deployment checks and integration proof remain separate'],['quest-grants','Completing the game authorizes agents and verified deployments']],
    correct:'evidence-bound',reward:'Spiral Cartographer',xp:60,
    hint:'Seeing a repo, a website and a working integration are three different kinds of evidence.',
    lesson:'The public inventory maps repositories, not verified running systems. Published HTML checks and reviewed relationships have their own timestamps and limits. The story is a metaphor, not a systems audit.',
    sources:['FieldConstellation','FieldAtlas']
  }
];

export const OUTER_MAX_XP=OUTER_STEPS.reduce((sum,step)=>sum+step.xp,0);
export const emptyOuter=()=>({schemaVersion:1,completedIds:[]});
const nameList=OUTER_STEPS.flatMap(step=>[...step.sources,...step.choices.filter(c=>/^[\w.-]+$/.test(c[0])).map(c=>c[0]),...(step.visit?[step.visit]:[])]);
export function availableOuter(repos){
  const byName=new Map(repos.filter(r=>r.visibility==='public').map(r=>[r.name.toLowerCase(),r]));
  // All nine gates require a complete, public project catalog. Never render
  // stale or private choices, and never collapse missing stages into unlocks.
  if(nameList.some(name=>!byName.has(name.toLowerCase())))return [];
  return OUTER_STEPS.map(step=>({...step,
    sourceRepos:step.sources.map(name=>byName.get(name.toLowerCase())),
    visitRepo:step.visit?byName.get(step.visit.toLowerCase()):null
  }));
}
export function sanitizeOuter(value,repos){
  if(!value||typeof value!=='object'||value.schemaVersion!==1)return emptyOuter();
  const available=availableOuter(repos);
  if(available.length!==OUTER_STEPS.length)return emptyOuter();
  const submitted=new Set(Array.isArray(value.completedIds)?value.completedIds.filter(x=>typeof x==='string') : []);
  const completedIds=[];
  for(const step of available){
    if(!submitted.has(step.id))break;
    completedIds.push(step.id);
  }
  return {schemaVersion:1,completedIds};
}
export function readOuter(raw,repos){
  try{
    if(typeof raw!=='string'||raw.length>2500)return emptyOuter();
    return sanitizeOuter(JSON.parse(raw),repos);
  }catch{return emptyOuter();}
}
export function outerProgress(repos,missionSave,outerSave){
  const campaign=missionProgress(repos,missionSave);
  const unlocked=campaign.finished&&campaign.total===9;
  const steps=availableOuter(repos);
  const available=steps.length===OUTER_STEPS.length;
  const save=sanitizeOuter(outerSave,repos);
  const completed=new Set(save.completedIds);
  const next=steps.find(step=>!completed.has(step.id))||null;
  const xp=steps.filter(step=>completed.has(step.id)).reduce((sum,step)=>sum+step.xp,0);
  const relics=steps.filter(step=>(step.kind==='artifact'||step.kind==='secret')&&completed.has(step.id)).map(step=>step.reward);
  const bossCleared=steps.filter(step=>step.kind==='boss'&&completed.has(step.id)).length;
  return {unlocked,available,steps,current:unlocked&&available?next:null,completedIds:save.completedIds,
    cleared:save.completedIds.length,xp,maximum:OUTER_MAX_XP,relics,bossCleared,bossHealth:3-bossCleared,
    secretOpen:save.completedIds.includes('combination-mind'),
    finished:unlocked&&available&&save.completedIds.length===steps.length};
}
export function attemptOuter(repos,missionSave,outerSave,quest,stepId,choiceId){
  const progress=outerProgress(repos,missionSave,outerSave),step=progress.current;
  const saved=sanitizeOuter(outerSave,repos);
  if(!step||step.id!==stepId||typeof choiceId!=='string'||!step.choices.some(c=>c[0]===choiceId)){
    return {accepted:false,correct:false,reason:'unavailable',save:saved};
  }
  if(choiceId!==step.correct)return {accepted:true,correct:false,reason:'wrong',step,save:saved};
  if(step.visitRepo&&!Array.isArray(quest?.discoveredIds)||step.visitRepo&&!quest.discoveredIds.includes(projectId(step.visitRepo))){
    return {accepted:true,correct:true,reason:'visit-required',step,visitRepo:step.visitRepo,save:saved};
  }
  return {accepted:true,correct:true,reason:'cleared',step,save:{schemaVersion:1,completedIds:[...saved.completedIds,step.id]}};
}
