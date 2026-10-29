import {projectId} from './project-links.js';
import {ATLAS_URL} from './atlas-lens.js';

export const ATLAS_PUBLISHED_SOURCE=ATLAS_URL+'pages-discovered.json';

/**
 * Dated snapshot of the Atlas public Pages manifest, independent from its
 * curator-reviewed chapter list. This is NOT a live-site check on each load.
 */
export function publishedAtlasRecords(snapshot,repos){
  if(!snapshot||snapshot.schemaVersion!==1||snapshot.owner!=='MichaelWave369'||
    snapshot.sourceUrl!==ATLAS_PUBLISHED_SOURCE||!Number.isFinite(Date.parse(snapshot.sourceGeneratedAt))||
    !Array.isArray(snapshot.pages)||snapshot.pages.length!==snapshot.verifiedCount||
    snapshot.pages.length>1000)return new Map();
  const byId=new Map(repos.filter(r=>r.visibility==='public').map(r=>[projectId(r),r]));
  const seenIds=new Set(),seenNames=new Set(),resolved=new Map();
  for(const row of snapshot.pages){
    if(!row||typeof row.projectId!=='string'||!/^github:[1-9]\d{0,19}$/.test(row.projectId)||
      typeof row.repo!=='string'||!/^[\w.-]{1,100}$/.test(row.repo)||
      typeof row.url!=='string'||row.url.length>2000||
      seenIds.has(row.projectId)||seenNames.has(row.repo.toLowerCase()))return new Map();
    seenIds.add(row.projectId);seenNames.add(row.repo.toLowerCase());
    let url;
    try{url=new URL(row.url);}catch{return new Map();}
    if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)return new Map();
    const current=byId.get(row.projectId);
    // Repository names must also agree. A stale rename is not proof of alias.
    if(current&&current.name.toLowerCase()===row.repo.toLowerCase())resolved.set(row.projectId,row);
  }
  return resolved;
}
export function publishedAtlasIds(snapshot,repos){
  return new Set(publishedAtlasRecords(snapshot,repos).keys());
}
export function publishedAtlasLabel(snapshot,repos){
  const items=publishedAtlasRecords(snapshot,repos);
  if(!snapshot||!items.size)return 'Atlas published inventory unavailable';
  const total=snapshot.verifiedCount;
  const date=new Date(snapshot.sourceGeneratedAt).toISOString().slice(0,10);
  return items.size+' of '+total+' Atlas-verified published sites in this public repo snapshot · observed '+date;
}
/** A dated Atlas-verified HTML destination, not a live app certification. */
export function publishedAtlasWebsite(snapshot,repos,repo){
  if(!repo || repo.visibility!=='public')return null;
  return publishedAtlasRecords(snapshot,repos).get(projectId(repo))?.url || null;
}
export function publishedAtlasLink(snapshot,repos,repo){
  const item=publishedAtlasRecords(snapshot,repos).get(projectId(repo));
  if(!item)return null;
  const url=new URL(ATLAS_URL);
  url.searchParams.set('project',projectId(repo));
  return url.href;
}
