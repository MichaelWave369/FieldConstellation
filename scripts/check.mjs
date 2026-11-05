import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

async function checkTree(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory()){await checkTree(path);continue;}
    if(!entry.isFile()||!/\.(m?js)$/.test(entry.name))continue;
    const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});
    if(result.status!==0)process.exit(result.status||1);
  }
}
for(const directory of ['src','scripts','tests'])await checkTree(directory);
console.log('JavaScript syntax checks passed, including nested gateway modules.');
