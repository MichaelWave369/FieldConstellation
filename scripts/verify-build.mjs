import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {parseSnapshot} from '../src/inventory.js';
import {validateRelationship} from '../src/relationships.js';
import {projectId} from '../src/project-links.js';
import {publicDestination} from '../src/destinations.js';
const root=resolve('dist'),base='https://example.invalid/FieldConstellation/';
const html=await readFile(resolve(root,'index.html'),'utf8');
const map=JSON.parse(html.match(/<script type="importmap">([^<]+)<\/script>/)[1]).imports;
async function exists(path){assert((await stat(path)).isFile(),'Missing built asset: '+path);}
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)){
  if(match[1]==='./')continue;
  const url=new URL(match[1],base);assert(url.pathname.startsWith('/FieldConstellation/'));
  await exists(resolve(root,url.pathname.slice('/FieldConstellation/'.length)));
}
async function walk(path){const result=[];for(const entry of await readdir(path,{withFileTypes:true})){const file=resolve(path,entry.name);result.push(...entry.isDirectory()?await walk(file):[file]);}return result;}
for(const file of await walk(root)){
  if(file.endsWith('.js'))for(const match of (await readFile(file,'utf8')).replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/from\s*['"]([^'"]+)['"]/g)){
    const dependency=match[1];
    if(dependency.startsWith('./')||dependency.startsWith('../'))await exists(resolve(dirname(file),dependency));
    else if(dependency==='three')await exists(resolve(root,map.three));
    else assert.fail('Unresolved bare module: '+dependency);
  }
  if(file.endsWith('.css'))for(const match of (await readFile(file,'utf8')).matchAll(/url\(['"]?(\.\/[^)'";]+)['"]?\)/g))await exists(resolve(dirname(file),match[1]));
}
const snapshot=parseSnapshot(JSON.parse(await readFile(resolve(root,'repos.json'),'utf8')));
const ledger=JSON.parse(await readFile(resolve(root,'relationships.json'),'utf8'));
assert(ledger.relationships.every(r=>validateRelationship(r,snapshot.repos)),'Invalid public relationship evidence');
const ids=new Set(snapshot.repos.map(projectId));
const checks=JSON.parse(await readFile(resolve(root,'deployments.json'),'utf8'));
assert(checks.schemaVersion===1&&checks.owner==='MichaelWave369'&&Array.isArray(checks.checks),'Invalid destination observation format');
assert.equal(new Set(checks.checks.map(c=>c.projectId)).size,checks.checks.length,'Duplicate destination identities');
assert(checks.checks.every(c=>ids.has(c.projectId)&&publicDestination(c.candidateUrl)&&Number.isFinite(Date.parse(c.checkedAt))&&['reachable','unavailable','inconclusive'].includes(c.status)),'Invalid/non-public destination observation');
const atlas=JSON.parse(await readFile(resolve(root,'atlas.json'),'utf8'));
assert(atlas.owner==='MichaelWave369'&&atlas.url==='https://michaelwave369.github.io/FieldAtlas/'&&Array.isArray(atlas.chapters)&&atlas.chapters.every(id=>ids.has(id)),'Invalid/non-public Atlas chapter map');
for(const name of ['deployments.json','atlas.json','vendor/THREE-LICENSE.txt','fonts/OFL.txt'])await exists(resolve(root,name));
console.log('Verified Pages subpath assets, module imports, local fonts/licenses, '+snapshot.repos.length+' public records and '+ledger.relationships.length+' sourced relationships.');
