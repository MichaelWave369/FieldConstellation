import {projectId,projectLink} from './project-links.js';
import {availableTrails} from './trails.js';

/**
 * Public, bounded URL contract: ?trail=<curated-id>&stop=<1-based-index>.
 * A matching ?repo=github:<id> may accompany it for ordinary project sharing.
 * Invalid, duplicate or inconsistent parameters never select a trail.
 */
export function readTrailLink(href,repos){
  try{
    const url=new URL(href);
    const ids=url.searchParams.getAll('trail');
    const stops=url.searchParams.getAll('stop');
    if(ids.length!==1||stops.length!==1||!/^[a-z][a-z0-9-]*$/.test(ids[0])||!/^([1-9]\d{0,2})$/.test(stops[0]))return null;
    const trail=availableTrails(repos).find(item=>item.id===ids[0]);
    const index=Number(stops[0])-1;
    if(!trail||!Number.isSafeInteger(index)||index>=trail.stops.length)return null;
    const repo=trail.stops[index];
    const repoIds=url.searchParams.getAll('repo');
    if(repoIds.length&&(repoIds.length!==1||repoIds[0]!==projectId(repo)))return null;
    return {trail,index,repo};
  }catch{return null;}
}

export function trailLink(href,trail,index){
  if(!trail?.stops||!Number.isInteger(index)||index<0||index>=trail.stops.length)throw Error('Invalid curated trail stop');
  const url=new URL(projectLink(href,trail.stops[index]));
  url.searchParams.set('trail',trail.id);
  url.searchParams.set('stop',String(index+1));
  return url.href;
}

export function withoutTrail(href){
  const url=new URL(href);
  url.searchParams.delete('trail');
  url.searchParams.delete('stop');
  return url.href;
}
