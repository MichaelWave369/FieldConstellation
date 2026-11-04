/**
 * Solar Discovery is an editorial route through *public* repos in one category.
 * Public stars and creation/push dates are used for ordering, not health ratings.
 * Never inspect private repos, invent dependency links, or fetch external data.
 */
const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'})||String(a.id).localeCompare(String(b.id));
const numeric=value=>Math.max(0,Number(value)||0);
const time=value=>{const parsed=Date.parse(value||'');return Number.isFinite(parsed)?parsed:0;};
const unique=(records,count)=>{
  const seen=new Set(),result=[];
  for(const repo of records){if(seen.has(String(repo.id)))continue;seen.add(String(repo.id));result.push(repo);if(result.length>=count)break;}
  return result;
};
export function solarDiscoveryFor(repos,groupId,visibleIds=null){
  const accepted=Array.isArray(repos)?repos.filter(repo=>repo.visibility==='public'&&repo.group===groupId&&(!visibleIds||visibleIds.has(repo.id))):[];
  const byStars=[...accepted].sort((a,b)=>numeric(b.stars)-numeric(a.stars)||byName(a,b));
  const byCreated=[...accepted].sort((a,b)=>time(b.created)-time(a.created)||byName(a,b));
  const byUpdated=[...accepted].sort((a,b)=>time(b.updated)-time(a.updated)||byName(a,b));
  const featured=byStars.slice(0,3);
  const newest=byCreated.slice(0,3);
  // A deliberately mixed 5-stop visitor route, rather than a false dependency path.
  const route=unique([
    ...byStars.slice(0,2),
    ...byCreated.slice(0,2),
    ...byUpdated.slice(0,2),
    ...byStars,
    ...byCreated
  ],Math.min(5,accepted.length));
  return{count:accepted.length,featured,newest,route};
}
