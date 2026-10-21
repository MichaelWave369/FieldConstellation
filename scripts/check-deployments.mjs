import {readFile,writeFile,rename} from 'node:fs/promises';
import {parseSnapshot} from '../src/inventory.js';
import {destinationCandidate,probeDestination} from '../src/destinations.js';

const file=new URL('../src/deployments.json',import.meta.url);
const snapshot=parseSnapshot(JSON.parse(await readFile(new URL('../src/repos.json',import.meta.url),'utf8')));
const candidates=snapshot.repos.filter(r=>destinationCandidate(r)),checks=[];
let cursor=0;
async function worker(){while(cursor<candidates.length){const repo=candidates[cursor++];checks.push(await probeDestination(repo));}}
await Promise.all(Array.from({length:6},worker));
checks.sort((a,b)=>a.projectId.localeCompare(b.projectId));
const result={schemaVersion:1,owner:'MichaelWave369',checkedAt:new Date().toISOString(),method:'Bounded anonymous HTTPS GET; success requires 2xx text/html and an HTML document marker within 8 KiB. At most five redirects. No application actions, login, or iframe checks.',checks};
await writeFile(new URL(file.href+'.tmp'),JSON.stringify(result,null,2)+'\n');
await rename(new URL(file.href+'.tmp'),file);
console.log(JSON.stringify({checked:checks.length,reachable:checks.filter(c=>c.status==='reachable').length,unavailable:checks.filter(c=>c.status==='unavailable').length,inconclusive:checks.filter(c=>c.status==='inconclusive').length}));
