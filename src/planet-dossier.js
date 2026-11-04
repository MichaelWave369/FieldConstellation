import {projectId} from './project-links.js';

/**
 * A public-only, editorial dossier index. A shared curated category or language
 * is NOT a sourced integration, and repository metadata does not certify app health.
 */
export function planetDossierFor(repos,selected,relationships=[],visibleIds=null,inventoryAt=null){
  if(!selected||selected.visibility!=='public')return null;
  const publicRepos=Array.isArray(repos)?repos.filter(repo=>repo?.visibility==='public'):[];
  if(!publicRepos.some(repo=>String(repo.id)===String(selected.id)))return null;
  const id=projectId(selected);
  const related=Array.isArray(relationships)?relationships.filter(relation=>
    (relation.from===id||relation.to===id)&&
    (relation.status==='verified'||relation.status==='documented')
  ):[];
  const counts={
    verified:related.filter(relation=>relation.status==='verified').length,
    documented:related.filter(relation=>relation.status==='documented').length
  };
  const reviewedTimes=related.map(relation=>Date.parse(relation.reviewedAt||'')).filter(Number.isFinite);
  const reviewedAt=reviewedTimes.length?new Date(Math.max(...reviewedTimes)).toISOString():null;
  const nearby=publicRepos.filter(repo=>
    repo.group===selected.group &&
    String(repo.id)!==String(selected.id) &&
    (!visibleIds||visibleIds.has(repo.id))
  ).sort((a,b)=>{
    const langA=a.language===selected.language?1:0,langB=b.language===selected.language?1:0;
    const tA=Date.parse(a.updated||''),tB=Date.parse(b.updated||'');
    return langB-langA ||
      (Number.isFinite(tB)?tB:0)-(Number.isFinite(tA)?tA:0) ||
      a.name.localeCompare(b.name,undefined,{sensitivity:'base'}) ||
      String(a.id).localeCompare(String(b.id));
  }).slice(0,3);
  const parsed=Date.parse(inventoryAt||'');
  return{
    sourceCount:related.length,
    counts,
    reviewedAt,
    nearby,
    inventoryAt:Number.isFinite(parsed)?new Date(parsed).toISOString():null
  };
}
