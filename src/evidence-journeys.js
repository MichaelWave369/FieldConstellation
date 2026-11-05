import {projectId} from './project-links.js';

/**
 * Breadth-first VISITOR WALK across already reviewed public source records.
 * Links are traversable in both directions for discovery, but their recorded
 * direction and scope are never altered. A walk is NOT a transitive integration.
 */
export function findEvidenceJourney(index,startId,endId,{grade='all',maxHops=6}={}){
  const projects=Array.isArray(index?.projects)?index.projects:[];
  const byId=new Map(projects.filter(r=>r?.visibility==='public').map(r=>[projectId(r),r]));
  if(!byId.has(startId)||!byId.has(endId))return null;
  const startRepo=byId.get(startId),endRepo=byId.get(endId);
  if(startId===endId)return {startRepo,endRepo,steps:[]};
  const bound=Number.isInteger(maxHops)?Math.max(0,Math.min(6,maxHops)):6;
  const adjacency=new Map([...byId.keys()].map(id=>[id,[]]));
  const relations=Array.isArray(index?.links)?index.links:[];
  for(const relation of relations){
    if(!relation||!['verified','documented'].includes(relation.status)||!Array.isArray(relation.evidence)||!relation.evidence.length||!['all','verified','documented'].includes(grade))continue;
    if(grade!=='all'&&grade!==relation.status)continue;
    if(!adjacency.has(relation.from)||!adjacency.has(relation.to))continue;
    adjacency.get(relation.from).push({relation,fromId:relation.from,toId:relation.to,reversed:false});
    adjacency.get(relation.to).push({relation,fromId:relation.to,toId:relation.from,reversed:relation.direction!=='undirected'});
  }
  // Prefer source-verified and forward reading when two equally short walks exist.
  for(const entries of adjacency.values())entries.sort((a,b)=>
    Number(a.relation.status!=='verified')-Number(b.relation.status!=='verified')||
    Number(a.reversed)-Number(b.reversed)||
    String(a.relation.id).localeCompare(String(b.relation.id))||
    a.toId.localeCompare(b.toId)
  );
  const visited=new Set([startId]),queue=[{id:startId,steps:[]}];
  for(let i=0;i<queue.length;i++){
    const next=queue[i];
    if(next.steps.length>=bound)continue;
    for(const entry of adjacency.get(next.id)||[]){
      if(visited.has(entry.toId))continue;
      const steps=[...next.steps,{
        fromRepo:byId.get(entry.fromId),
        toRepo:byId.get(entry.toId),
        relation:entry.relation,
        reversed:entry.reversed
      }];
      if(entry.toId===endId)return {startRepo,endRepo,steps};
      visited.add(entry.toId);
      queue.push({id:entry.toId,steps});
    }
  }
  return null; // No route in this bounded, source-reviewed ledger.
}
