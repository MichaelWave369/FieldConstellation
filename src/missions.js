import {projectId} from './project-links.js';

/**
 * A fictional learning adventure, grounded in the linked public README for
 * each correct project. The gameplay never asserts CI, deploy or integration
 * health. Missions are intentionally hand-reviewed, not AI-generated claims.
 */
export const MISSION_KEY='field-constellation-missions-v1';
export const MISSION_XP=30;
export const MISSIONS=[
  {
    id:'sanctuary-01',act:1,actTitle:'The Settlement Wakes',title:'The Evacuation Ledger',
    scene:'A storm threatens your settlement. There are people, animals, vehicles and supplies to account for. The scouts need an offline-capable planning tool.',
    prompt:'Which project belongs in the settlement toolkit?',
    options:['PhiSafe','PhiServe','BTM'],answer:'PhiSafe',
    hint:'Choose the household preparedness planner, not a model server or an FPS.',
    lesson:'PhiSafe helps organize evacuation checklists, people and animal counts, transport capacity and supplies. It does not monitor hazards or send emergency alerts.',
    reward:'Preparedness Cartographer'
  },
  {
    id:'sanctuary-02',act:1,actTitle:'The Settlement Wakes',title:'The Living Room Signal',
    scene:'The commons has a television and game controllers, but its residents want a simple, local-first entertainment interface rather than a maze of menus.',
    prompt:'Which project is the prototype for that room?',
    options:['ReelTheater','PhiVine','CycleWeave'],answer:'ReelTheater',
    hint:'Look for a TV interface designed for browser and controller navigation.',
    lesson:'REEL Theater is a local-first TV interface with controller navigation and an original arcade game. It is an early prototype, not a full Kodi replacement or unauthorized streaming marketplace.',
    reward:'Signal Keeper'
  },
  {
    id:'sanctuary-03',act:1,actTitle:'The Settlement Wakes',title:'The Pocket Portal',
    scene:'Your explorers need a touch-first window into the PhiOS idea when away from their desktops. They are not ready to replace a phone operating system.',
    prompt:'Which world should they examine?',
    options:['PhiOS-Mobile','PieceByPiece','LWG'],answer:'PhiOS-Mobile',
    hint:'The browser/PWA prototype extends PhiOS ideas to touch-first devices.',
    lesson:'PhiOS Mobile includes a browser/PWA prototype and a separate Android launcher experiment. It is not a flashable custom ROM or a fully qualified phone operating system.',
    reward:'Pocket Pathfinder'
  },
  {
    id:'forge-04',act:2,actTitle:'The Makers Forge',title:'Build the Gateway',
    scene:'A portal should feel like a place, with animated layers and visual composition. The team needs a local-first website studio.',
    prompt:'Which project is the design tool?',
    options:['LWG','PhiXRCommons','PhiSafe'],answer:'LWG',
    hint:'Its name stands for Living Website Generator.',
    lesson:'LWG is a local-first visual studio for composing animated, layered websites. Its design critic performs static checks, not a full browser accessibility certification.',
    reward:'World Painter'
  },
  {
    id:'forge-05',act:2,actTitle:'The Makers Forge',title:'Wake the Local Model',
    scene:'A workshop has an existing GGUF model and a separately installed llama.cpp server. It wants a sovereign, loopback serving layer.',
    prompt:'Which project handles that experiment?',
    options:['PhiServe','ReelTheater','PhiOS-Mobile'],answer:'PhiServe',
    hint:'Choose the experimental local model-serving project.',
    lesson:'PhiServe supervises an existing local llama.cpp backend and exposes local text-generation endpoints. It does not bundle model weights or offer complete Ollama compatibility.',
    reward:'Model Smith'
  },
  {
    id:'forge-06',act:2,actTitle:'The Makers Forge',title:'The Rhythm of Worlds',
    scene:'A research chamber wants to play with phase geometry and repeatable periodic patterns, not claim to have discovered an ancient supercomputer.',
    prompt:'Which mathematical laboratory should the explorer open?',
    options:['CycleWeave','PhiVine','PieceByPiece'],answer:'CycleWeave',
    hint:'Find the living cycles laboratory.',
    lesson:'CycleWeave is an original mathematical laboratory for periodic systems and phase geometry, with source-traceable historical inspiration. It does not claim ancient societies invented the same algorithms.',
    reward:'Cycle Reader'
  },
  {
    id:'frontier-07',act:3,actTitle:'Beyond the Known Map',title:'Build a City, Enter a City',
    scene:'A quiet tabletop holds building fragments. The player assembles them into a city, then explores the spaces they have shaped.',
    prompt:'Which project imagines this puzzle adventure?',
    options:['PieceByPiece','LWG','ReelTheater'],answer:'PieceByPiece',
    hint:'Think cozy architectural puzzles and city-building worlds.',
    lesson:'Piece by Piece is a planned cozy XR/VR architectural puzzle-adventure. Its long-term design includes portable city packs; a planned feature is not proof of a shipped multiplayer service.',
    reward:'City Weaver'
  },
  {
    id:'frontier-08',act:3,actTitle:'Beyond the Known Map',title:'Break the Signal',
    scene:'The defenders enter a retro first-person world with story sectors, arenas, and an optional self-hosted LAN CLAN multiplayer path.',
    prompt:'Which game are they entering?',
    options:['BTM','PhiVine','PhiSafe'],answer:'BTM',
    hint:'Find the retro shooter called Break the Matrix.',
    lesson:'Break the Matrix is a retro-inspired FPS with solo play and an optional self-hosted multiplayer candidate. Its multiplayer and physical-headset claims need their own acceptance evidence.',
    reward:'Frequency Runner'
  },
  {
    id:'frontier-09',act:3,actTitle:'Beyond the Known Map',title:'Two Headsets, One Porch',
    scene:'Two explorers want to meet in a browser-based shared XR hangout. They need a room and explicit consent before sharing any video.',
    prompt:'Which world is designed for the experiment?',
    options:['PhiXRCommons','PhiServe','PhiOS-Mobile'],answer:'PhiXRCommons',
    hint:'The XR commons explores two-person browser-based virtual hangouts.',
    lesson:'PhiXRCommons is an experimental two-person WebXR hangout. Its screen-sharing preview is app-canvas capture when supported, not general Quest system-screen capture.',
    reward:'Commons Voyager'
  }
];
export const emptyMissionSave=()=>({schemaVersion:1,completedIds:[]});

export function availableMissions(repos){
  const byName=new Map(repos.filter(r=>r.visibility==='public').map(r=>[r.name.toLowerCase(),r]));
  return MISSIONS.map(m=>{
    const options=m.options.map(name=>byName.get(name.toLowerCase()));
    if(options.some(x=>!x)||new Set(options.map(projectId)).size!==options.length)return null;
    const answer=byName.get(m.answer.toLowerCase());
    if(!answer)return null;
    return {...m,optionRepos:options,answerRepo:answer};
  }).filter(Boolean);
}
export function sanitizeMissionSave(value,repos){
  const allowed=new Set(availableMissions(repos).map(m=>m.id));
  if(!value||typeof value!=='object'||value.schemaVersion!==1)return emptyMissionSave();
  const seen=new Set(),completedIds=[];
  if(Array.isArray(value.completedIds))for(const id of value.completedIds){
    if(typeof id!=='string'||!allowed.has(id)||seen.has(id))continue;
    seen.add(id);completedIds.push(id);
    if(completedIds.length>=MISSIONS.length)break;
  }
  // Restore only the contiguous story prefix, so forged out-of-order saves
  // cannot bypass chapter gates.
  const order=availableMissions(repos).map(m=>m.id);
  const prefix=[];
  for(const id of order){if(!seen.has(id))break;prefix.push(id);}
  return {schemaVersion:1,completedIds:prefix};
}
export function readMissionSave(raw,repos){
  try{
    if(typeof raw!=='string'||raw.length>2048)return emptyMissionSave();
    return sanitizeMissionSave(JSON.parse(raw),repos);
  }catch{return emptyMissionSave();}
}
export function missionProgress(repos,save){
  const missions=availableMissions(repos),safe=sanitizeMissionSave(save,repos);
  const done=new Set(safe.completedIds),nextIndex=missions.findIndex(m=>!done.has(m.id));
  const current=nextIndex<0?null:missions[nextIndex];
  const chapters=[1,2,3].map(act=>{
    const list=missions.filter(m=>m.act===act);
    return {act,title:list[0]?.actTitle||'',total:list.length,cleared:list.filter(m=>done.has(m.id)).length};
  });
  return {missions,completedIds:safe.completedIds,total:missions.length,cleared:done.size,
    xp:done.size*MISSION_XP,current,chapters,finished:missions.length>0&&done.size===missions.length};
}
export function attemptMission(repos,save,id,selectedName){
  const current=missionProgress(repos,save);
  const mission=current.current;
  if(!mission||mission.id!==id||typeof selectedName!=='string'||!mission.optionRepos.some(r=>r.name===selectedName)){
    return {correct:false,accepted:false,save:sanitizeMissionSave(save,repos),mission:null};
  }
  if(selectedName!==mission.answer){
    return {correct:false,accepted:true,save:sanitizeMissionSave(save,repos),mission};
  }
  return {correct:true,accepted:true,mission,
    save:{schemaVersion:1,completedIds:[...current.completedIds,mission.id]}};
}
