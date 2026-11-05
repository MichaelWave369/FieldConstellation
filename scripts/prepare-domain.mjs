/**
 * LOCAL-ONLY staging adapter for a future apex-domain deployment.
 * Does not write DNS, GitHub Pages, Netlify settings, workflows or releases.
 * Run after npm run build: node scripts/prepare-domain.mjs
 * Output is dist-domain/ (never published automatically by this script).
 */
import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),source=new URL('dist/',root),target=new URL('dist-domain/',root);
await readFile(new URL('gateway/index.html',source),'utf8'); // fail closed if the gateway is missing
await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true});
await mkdir(new URL('phitarium/',target),{recursive:true});
for(const name of await readdir(source)){
  await cp(new URL(name,source),new URL('phitarium/'+name,target),{recursive:true});
}
let html=await readFile(new URL('gateway/index.html',source),'utf8');
for(const [before,after] of [
  ['../index.html','./phitarium/index.html'],
  ['../other-fields/','./other-fields/'],
  ['../icon.svg','./icon.svg'],
  ['href="./gateway.css"','href="./gateway/gateway.css"'],
  ['src="./overview.js"','src="./gateway/overview-domain.js"']
]){if(!html.includes(before))throw Error('Unexpected gateway HTML: missing '+before);html=html.replaceAll(before,after);}
await writeFile(new URL('index.html',target),html);
let overview=await readFile(new URL('gateway/overview.js',source),'utf8');
const oldRoute="const overviewUrl=repo=>'../index.html?repo=github:'+encodeURIComponent(repo.id);";
const newRoute="const overviewUrl=repo=>'./phitarium/index.html?repo=github:'+encodeURIComponent(repo.id);";
if(!overview.includes(oldRoute))throw Error('Unexpected overview routing, refusing domain staging');
overview=overview.replace(oldRoute,newRoute);
await writeFile(new URL('gateway/overview-domain.js',target),overview);

/* Preserve /gateway/ as a working alternate route in the future root preview. */
let aliasHtml=await readFile(new URL('gateway/index.html',source),'utf8');
aliasHtml=aliasHtml.replaceAll('../index.html','../phitarium/index.html');
aliasHtml=aliasHtml.replace('src="./overview.js"','src="./overview-domain-gateway.js"');
await writeFile(new URL('gateway/index.html',target),aliasHtml);
const gatewayRoute="const overviewUrl=repo=>'../phitarium/index.html?repo=github:'+encodeURIComponent(repo.id);";
const aliasOverview=(await readFile(new URL('gateway/overview.js',source),'utf8')).replace(oldRoute,gatewayRoute);
await writeFile(new URL('gateway/overview-domain-gateway.js',target),aliasOverview);

console.log('Prepared local dist-domain/ root gateway + /phitarium/ sky. No deployment or DNS changes.');
