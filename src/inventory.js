import {normalizePublic} from './model.js';

export const OWNER='MichaelWave369';
export const CACHE_KEY='field-constellation-public-v3';
const namePattern=/^[\w.-]+$/;
const idPattern=/^[1-9]\d*$/;
const fields=['id','name','description','url','homepage','language','topics','stars','forks','size','created','updated','visibility','archived','fork','branch','license','pages','issues'];

/** All-or-nothing validation at the snapshot, cache, and refresh boundaries. */
export function validatePublicRepos(repos){
  if(!Array.isArray(repos)||!repos.length||repos.length>10000)throw Error('The public inventory is empty or incomplete.');
  const ids=new Set(),names=new Set();
  return repos.map(repo=>{
    if(!repo||repo.visibility!=='public'||!idPattern.test(String(repo.id))||typeof repo.name!=='string'||!namePattern.test(repo.name)||repo.url!==`https://github.com/${OWNER}/${repo.name}`||!Array.isArray(repo.topics)||!repo.topics.every(t=>typeof t==='string')||!['stars','forks','size'].every(k=>Number.isFinite(repo[k])&&repo[k]>=0)||typeof repo.archived!=='boolean'||typeof repo.fork!=='boolean'||typeof repo.pages!=='boolean'||typeof repo.created!=='string'||typeof repo.updated!=='string'||!Number.isFinite(Date.parse(repo.created))||!Number.isFinite(Date.parse(repo.updated)))throw Error('The inventory contains an invalid or non-public repository.');
    const id=String(repo.id),name=repo.name.toLowerCase();
    if(ids.has(id)||names.has(name))throw Error('GitHub returned duplicate repositories; the saved inventory is unchanged.');
    ids.add(id);names.add(name);
    const result=Object.fromEntries(fields.map(key=>[key,repo[key]]));
    result.id=id;
    result.description=String(repo.description||'').slice(0,2000);
    result.language=String(repo.language||'Not specified');
    result.homepage=typeof repo.homepage==='string'?repo.homepage:'';
    result.branch=String(repo.branch||'main');
    result.license=typeof repo.license==='string'?repo.license:null;
    result.issues=Number.isFinite(repo.issues)&&repo.issues>=0?repo.issues:null;
    return result;
  });
}

export function parseSnapshot(data){
  if(!data||data.owner!==OWNER||data.scope!=='public'||data.complete!==true||!Number.isFinite(Date.parse(data.fetchedAt)))throw Error('A complete, dated public repository snapshot is required.');
  return {...data,repos:validatePublicRepos(data.repos)};
}

export function newerPublicCache(value,snapshot,now=Date.now()){
  try{
    const candidate=parseSnapshot(JSON.parse(value));
    const at=Date.parse(candidate.fetchedAt);
    return at>Date.parse(snapshot.fetchedAt)&&at<=now+60000?candidate:null;
  }catch{return null;}
}

export async function fetchPublicInventory(fetcher=fetch,{maxPages=100,onProgress=()=>{}}={}){
  const repos=[];
  for(let page=1;page<=maxPages;page++){
    const response=await fetcher(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=full_name&page=${page}`,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
    if(!response.ok){
      if(response.status===403||response.status===429)throw Error('GitHub’s public API rate limit was reached. Try again later; your saved inventory is unchanged.');
      throw Error('GitHub could not return the complete public inventory.');
    }
    const batch=await response.json();
    if(!Array.isArray(batch)||!batch.every(r=>r.private===false&&r.owner?.login?.toLowerCase()===OWNER.toLowerCase()))throw Error('GitHub returned unexpected or non-public records.');
    repos.push(...batch.map(normalizePublic));onProgress(repos.length);
    if(batch.length<100)return validatePublicRepos(repos);
  }
  throw Error('Pagination did not finish; your saved inventory is unchanged.');
}
