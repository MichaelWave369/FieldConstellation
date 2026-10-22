import {projectId} from './project-links.js';

export const PASSPORT_KEY='field-constellation-passport-v1';
export const FAVORITES_KIND='field-constellation-public-favorites';
export const MAX_FAVORITES=200;
export const MAX_RECENT=20;
export const emptyPassport=()=>({schemaVersion:1,favoriteIds:[],recentIds:[]});

function knownPublic(repos){
  return new Set(repos.filter(r=>r.visibility==='public').map(projectId));
}
function validIdentity(value){return typeof value==='string'&&/^github:[1-9]\d{0,19}$/.test(value);}
function cleanIds(values,allowed,limit){
  if(!Array.isArray(values))return [];
  const result=[],seen=new Set();
  for(const id of values){
    if(!validIdentity(id)||!allowed.has(id)||seen.has(id))continue;
    seen.add(id);result.push(id);
    if(result.length===limit)break;
  }
  return result;
}
/** Only known public numeric GitHub IDs are stored. Never store repository names or URLs. */
export function sanitizePassport(value,repos){
  const allowed=knownPublic(repos);
  if(!value||value.schemaVersion!==1||typeof value!=='object')return emptyPassport();
  return {schemaVersion:1,
    favoriteIds:cleanIds(value.favoriteIds,allowed,MAX_FAVORITES),
    recentIds:cleanIds(value.recentIds,allowed,MAX_RECENT)};
}
export function parsePassport(raw,repos){
  try{
    if(typeof raw!=='string'||raw.length>20000)return emptyPassport();
    return sanitizePassport(JSON.parse(raw),repos);
  }catch{return emptyPassport();}
}
export function toggleFavorite(passport,repo,repos){
  const base=sanitizePassport(passport,repos),id=projectId(repo);
  if(!knownPublic(repos).has(id))return base;
  return {...base,favoriteIds:base.favoriteIds.includes(id)
    ?base.favoriteIds.filter(x=>x!==id)
    :[id,...base.favoriteIds].slice(0,MAX_FAVORITES)};
}
export function recordVisit(passport,repo,repos){
  const base=sanitizePassport(passport,repos),id=projectId(repo);
  if(!knownPublic(repos).has(id))return base;
  return {...base,recentIds:[id,...base.recentIds.filter(x=>x!==id)].slice(0,MAX_RECENT)};
}
export function clearPassportSection(passport,section,repos){
  const base=sanitizePassport(passport,repos);
  if(section!=='favoriteIds'&&section!=='recentIds')return base;
  return {...base,[section]:[]};
}
export function passportRepos(ids,repos){
  const byId=new Map(repos.filter(r=>r.visibility==='public').map(r=>[projectId(r),r]));
  return ids.map(id=>byId.get(id)).filter(Boolean);
}
export function exportFavorites(passport,repos){
  const safe=sanitizePassport(passport,repos);
  return JSON.stringify({schemaVersion:1,kind:FAVORITES_KIND,favoriteIds:safe.favoriteIds},null,2)+'\n';
}
export function importFavorites(passport,input,repos){
  if(typeof input!=='string'||input.length>32000)throw Error('Import must be a small Field Passport JSON file.');
  let data;
  try{data=JSON.parse(input);}catch{throw Error('Import is not valid JSON.');}
  if(!data||typeof data!=='object'||data.schemaVersion!==1||data.kind!==FAVORITES_KIND||!Array.isArray(data.favoriteIds)||data.favoriteIds.length>500)throw Error('This is not a supported Field Passport favorites file.');
  if(data.favoriteIds.some(id=>!validIdentity(id)))throw Error('The file contains invalid project identities.');
  const base=sanitizePassport(passport,repos);
  const allowed=knownPublic(repos);
  const incoming=cleanIds(data.favoriteIds,allowed,MAX_FAVORITES);
  return {passport:{...base,favoriteIds:[...base.favoriteIds,...incoming].filter((id,index,array)=>array.indexOf(id)===index).slice(0,MAX_FAVORITES)},imported:incoming.length,omitted:data.favoriteIds.length-incoming.length};
}
