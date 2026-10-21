import {readFile,writeFile,rename} from 'node:fs/promises';
import {fetchPublicInventory,parseSnapshot} from '../src/inventory.js';
const path=new URL('../src/repos.json',import.meta.url);
const previous=JSON.parse(await readFile(path,'utf8'));
const repos=await fetchPublicInventory();
const next=parseSnapshot({...previous,fetchedAt:new Date().toISOString(),source:'Fully paginated anonymous public GitHub REST repository listing',complete:true,scope:'public',repos:repos.sort((a,b)=>a.name.localeCompare(b.name))});
await writeFile(new URL(path.href+'.tmp'),JSON.stringify(next,null,2)+'\n');
await rename(new URL(path.href+'.tmp'),path);
console.log('Saved '+repos.length+' public repositories.');
