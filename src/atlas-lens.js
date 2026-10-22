import {projectId} from './project-links.js';

export const ATLAS_URL='https://michaelwave369.github.io/FieldAtlas/';

/**
 * The Atlas manifest is a dated, reviewed public subset, not live inventory.
 * Never show or fetch an unknown chapter or a private repository by its ID.
 */
export function reviewedAtlasIds(atlas,repos){
  if(!atlas||atlas.schemaVersion!==1||atlas.owner!=='MichaelWave369'||atlas.url!==ATLAS_URL||!Array.isArray(atlas.chapters))return new Set();
  const publicIds=new Set(repos.filter(repo=>repo.visibility==='public').map(projectId));
  const reviewed=new Set();
  for(const id of atlas.chapters){
    if(typeof id==='string'&&/^github:[1-9]\d*$/.test(id)&&publicIds.has(id))reviewed.add(id);
  }
  return reviewed;
}
export function atlasLensRepos(repos,atlas){
  const reviewed=reviewedAtlasIds(atlas,repos);
  return repos.filter(repo=>repo.visibility==='public'&&reviewed.has(projectId(repo)));
}
export function atlasManifestLabel(atlas,repos){
  const count=reviewedAtlasIds(atlas,repos).size;
  if(!count||!Number.isFinite(Date.parse(atlas?.checkedAt)))return 'Atlas chapter map unavailable';
  const date=new Date(atlas.checkedAt).toISOString().slice(0,10);
  return count+' reviewed public Atlas chapters · map checked '+date;
}
