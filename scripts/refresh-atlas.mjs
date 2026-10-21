import {readFile,writeFile,rename} from 'node:fs/promises';
import {parseSnapshot} from '../src/inventory.js';
import {projectId} from '../src/project-links.js';
const path=new URL('../src/atlas.json',import.meta.url);
const previous=JSON.parse(await readFile(path,'utf8'));
const snapshot=parseSnapshot(JSON.parse(await readFile(new URL('../src/repos.json',import.meta.url),'utf8')));
const byName=new Map(snapshot.repos.map(r=>[r.name.toLowerCase(),r]));
const source='https://michaelwave369.github.io/FieldAtlas/pages-discovered.json';
const response=await fetch(source,{signal:AbortSignal.timeout(15000)});
if(!response.ok)throw Error('Atlas manifest unavailable; chapter map is unchanged.');
const manifest=await response.json();
if(manifest.schema_version!==1||manifest.owner!=='MichaelWave369'||!Array.isArray(manifest.pages)||!Number.isFinite(Date.parse(manifest.generated_at)))throw Error('Unexpected Atlas manifest; chapter map is unchanged.');
const chapters=[];
for(const page of manifest.pages){
  const repo=byName.get(String(page.repo).toLowerCase());
  if(repo&&page.verified===true&&page.published===true&&page.id==='gh-'+repo.id)chapters.push(projectId(repo));
}
if(!chapters.length||new Set(chapters).size!==chapters.length)throw Error('Empty or duplicated Atlas manifest; chapter map is unchanged.');
const next={...previous,chapterManifestAt:manifest.generated_at,chapters:chapters.sort()};
await writeFile(new URL(path.href+'.tmp'),JSON.stringify(next,null,2)+'\n');await rename(new URL(path.href+'.tmp'),path);
console.log('Mapped '+chapters.length+' public Atlas chapters. Destination check dates remain separate.');
