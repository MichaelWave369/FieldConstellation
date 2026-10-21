import {readFile,writeFile} from 'node:fs/promises';
import {normalizePublic} from '../src/model.js';
const path=new URL('../src/repos.json',import.meta.url);
const previous=JSON.parse(await readFile(path,'utf8'));
let repos=[];
for(let page=1;page<=100;page++){
  const response=await fetch('https://api.github.com/users/MichaelWave369/repos?per_page=100&sort=full_name&page='+page,{headers:{Accept:'application/vnd.github+json'}});
  if(!response.ok)throw Error('GitHub returned HTTP '+response.status+'; saved snapshot has not changed.');
  const batch=await response.json();
  if(!Array.isArray(batch)||!batch.every(r=>r.private===false&&r.owner?.login?.toLowerCase()==='michaelwave369'))throw Error('Unexpected public inventory; saved snapshot has not changed.');
  repos.push(...batch.map(normalizePublic));
  if(batch.length<100)break;
  if(page===100)throw Error('Pagination limit reached; saved snapshot has not changed.');
}
if(!repos.length||new Set(repos.map(r=>r.id)).size!==repos.length)throw Error('Incomplete or duplicated inventory; saved snapshot has not changed.');
const next={...previous,fetchedAt:new Date().toISOString(),source:'Fully paginated public GitHub REST repository listing',complete:true,scope:'public',repos:repos.sort((a,b)=>a.name.localeCompare(b.name))};
await writeFile(path,JSON.stringify(next,null,2)+'\n');
console.log('Saved '+repos.length+' public repositories.');
