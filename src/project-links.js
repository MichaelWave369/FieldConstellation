export function projectId(repo){return 'github:'+String(repo.id);}

export function readProjectLink(href,repos){
  try{
    const url=new URL(href),ids=url.searchParams.getAll('repo');
    if(ids.length!==1||!/^github:[1-9]\d*$/.test(ids[0]))return null;
    return repos.find(repo=>repo.visibility==='public'&&projectId(repo)===ids[0])||null;
  }catch{return null;}
}

export function projectLink(href,repo){
  const url=new URL(href);
  if(repo)url.searchParams.set('repo',projectId(repo));else url.searchParams.delete('repo');
  return url.href;
}

/** Atlas chapters are a reviewed subset, not every Pages-enabled repository. */
export function atlasLink(atlas,repo){
  if(!atlas||atlas.url!=='https://michaelwave369.github.io/FieldAtlas/')return null;
  const url=new URL(atlas.url);
  if(repo&&atlas.chapters?.includes(projectId(repo)))url.searchParams.set('chapter',repo.name);
  return url.href;
}
