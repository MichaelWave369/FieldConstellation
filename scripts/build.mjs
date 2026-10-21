import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const target=new URL('dist/',root);
await rm(target,{recursive:true,force:true});
await cp(new URL('src/',root),target,{recursive:true});
await mkdir(new URL('vendor/',target),{recursive:true});
for(const [source,name] of [
  ['build/three.module.js','three.module.js'],
  ['build/three.core.js','three.core.js'],
  ['examples/jsm/controls/OrbitControls.js','OrbitControls.js'],
  ['LICENSE','THREE-LICENSE.txt']
]) await cp(new URL('node_modules/three/'+source,root),new URL('vendor/'+name,target));
await writeFile(new URL('.nojekyll',target),'');
console.log('Built dist/ with locally bundled Three.js, fonts, and public repository snapshot.');
