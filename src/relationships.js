import {projectId} from './project-links.js';

export const RELATIONSHIP_STYLES={
  verified:{label:'Verified in source',color:'#82d9bd'},
  documented:{label:'Documented contract',color:'#e6bc78'},
  conceptual:{label:'Thematic association',color:'#b7a0db'}
};
export const RELATIONSHIP_KINDS={
  'code-bridge':'Code bridge',navigation:'Navigation link','shared-library':'Shared library','documented-integration':'Integration contract',thematic:'Same curated world'
};

export function validEvidence(evidence,publicNames){
  try{
    const url=new URL(evidence.url),parts=url.pathname.split('/');
    return url.protocol==='https:'&&url.hostname==='github.com'&&!url.username&&!url.password&&!url.search&&parts[1]==='MichaelWave369'&&publicNames.has(parts[2]?.toLowerCase())&&parts[3]==='blob'&&/^[a-f0-9]{40}$/.test(parts[4])&&parts.length>5&&/^#L[1-9]\d*(?:-L[1-9]\d*)?$/.test(url.hash)&&typeof evidence.claim==='string'&&evidence.claim.length>0;
  }catch{return false;}
}

export function validateRelationship(entry,repos){
  if(!entry||!/^[a-z0-9][a-z0-9-]{0,100}$/.test(entry.id)||!['verified','documented'].includes(entry.status)||!RELATIONSHIP_KINDS[entry.kind]||entry.kind==='thematic'||!['directed','undirected'].includes(entry.direction)||typeof entry.summary!=='string'||!entry.summary||typeof entry.scope!=='string'||!entry.scope||!Number.isFinite(Date.parse(entry.reviewedAt))||!Array.isArray(entry.evidence)||!entry.evidence.length)return false;
  const byId=new Map(repos.filter(r=>r.visibility==='public').map(r=>[projectId(r),r]));
  if(!byId.has(entry.from)||!byId.has(entry.to)||entry.from===entry.to)return false;
  const publicNames=new Set([...byId.values()].map(r=>r.name.toLowerCase()));
  if(!entry.evidence.every(e=>validEvidence(e,publicNames)))return false;
  if(entry.status==='verified'&&!entry.evidence.some(e=>/\/(?:src\/|package\.json#)/.test(e.url)))return false;
  if(entry.kind==='shared-library'){
    const owners=new Set(entry.evidence.filter(e=>/\/package\.json#/.test(e.url)).map(e=>new URL(e.url).pathname.split('/')[2].toLowerCase()));
    if(!entry.library||!owners.has(byId.get(entry.from).name.toLowerCase())||!owners.has(byId.get(entry.to).name.toLowerCase()))return false;
  }
  return true;
}

/** Unknown/removed endpoints never become hidden or phantom nodes. */
export function resolveRelationships(repos,ledger){
  if(ledger?.schemaVersion!==1||ledger.owner!=='MichaelWave369'||!Array.isArray(ledger.relationships))throw Error('Unexpected relationship ledger.');
  const byId=new Map(repos.map((repo,index)=>[projectId(repo),{repo,index}])),seen=new Set(),result=[];
  for(const entry of ledger.relationships){
    if(seen.has(entry.id)||!validateRelationship(entry,repos))continue;
    seen.add(entry.id);
    result.push({...entry,fromRepo:byId.get(entry.from).repo,toRepo:byId.get(entry.to).repo,a:byId.get(entry.from).index,b:byId.get(entry.to).index});
  }
  return result;
}

export function relationshipEdges(repos,relationships,includeThematic=false){
  const result=relationships.map(r=>[r.a,r.b,r.status,r.id]);
  if(includeThematic){
    const seen=new Set(result.map(([a,b])=>[a,b].sort((a,b)=>a-b).join(':'))),groups=new Map();
    repos.forEach((repo,index)=>{if(!groups.has(repo.group))groups.set(repo.group,[]);groups.get(repo.group).push(index);});
    for(const list of groups.values())for(let i=1;i<list.length;i++){
      const a=list[i-1],b=list[i],key=[a,b].sort((a,b)=>a-b).join(':');
      if(!seen.has(key)){result.push([a,b,'conceptual','theme:'+key]);seen.add(key);}
    }
  }
  return result;
}

export function neighborhood(selectedId,repos,edges){
  const result=new Set([selectedId]),index=repos.findIndex(r=>r.id===selectedId);
  for(const [a,b]of edges){if(a===index)result.add(repos[b].id);if(b===index)result.add(repos[a].id);}
  return result;
}

export function relatedProjects(repo,relationships){
  const id=projectId(repo),result=[];
  for(const relation of relationships){
    const outbound=relation.from===id,inbound=relation.to===id;
    if(outbound||inbound)result.push({relation,repo:outbound?relation.toRepo:relation.fromRepo,direction:relation.direction==='undirected'?'Shared':outbound?'Outgoing':'Incoming'});
  }
  return result;
}
