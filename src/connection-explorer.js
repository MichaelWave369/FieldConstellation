import {projectId} from './project-links.js';

const sourceGrades=new Set(['verified','documented']);
const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'})||String(a.id).localeCompare(String(b.id));
const reviewedTime=entry=>{const n=Date.parse(entry.reviewedAt||'');return Number.isFinite(n)?n:0;};

/**
 * Strictly read-only index of the already resolved, source-validated public
 * relationship ledger. Never create edges from proximity or shared categories.
 */
export function connectionExplorerIndex(repos,relationships){
  const publicRepos=new Map((Array.isArray(repos)?repos:[])
    .filter(repo=>repo?.visibility==='public')
    .map(repo=>[projectId(repo),repo]));
  const unique=new Set();
  const links=[];
  for(const relation of Array.isArray(relationships)?relationships:[]){
    if(!relation||!sourceGrades.has(relation.status)||typeof relation.id!=='string'||unique.has(relation.id))continue;
    const from=publicRepos.get(relation.from),to=publicRepos.get(relation.to);
    if(!from||!to||from===to||!Array.isArray(relation.evidence)||!relation.evidence.length)continue;
    unique.add(relation.id);
    links.push({...relation,fromRepo:from,toRepo:to});
  }
  links.sort((a,b)=>reviewedTime(b)-reviewedTime(a)||a.id.localeCompare(b.id));
  const endpoints=new Map();
  for(const relation of links){
    endpoints.set(projectId(relation.fromRepo),relation.fromRepo);
    endpoints.set(projectId(relation.toRepo),relation.toRepo);
  }
  const projects=[...endpoints.values()].sort(byName);
  return{
    links,projects,
    counts:{
      total:links.length,
      verified:links.filter(x=>x.status==='verified').length,
      documented:links.filter(x=>x.status==='documented').length
    }
  };
}

/** Public, date-scoped, deterministic discovery filters. */
export function filterConnections(links,{status='all',project='all',query=''}={}){
  const needle=String(query||'').trim().toLowerCase();
  return (Array.isArray(links)?links:[]).filter(r=>{
    if(!r||!sourceGrades.has(r.status))return false;
    if(status!=='all'&&r.status!==status)return false;
    if(project!=='all'&&r.from!==project&&r.to!==project)return false;
    if(!needle)return true;
    const haystack=[
      r.id,r.fromRepo?.name,r.toRepo?.name,r.summary,r.scope,
      r.kind,r.library, ...((r.evidence||[]).map(e=>e.claim))
    ].map(value=>String(value||'').toLowerCase()).join(' ');
    return haystack.includes(needle);
  });
}
