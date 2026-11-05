import {readFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../dist-domain/',import.meta.url);
async function exists(path){assert((await stat(new URL(path,root))).isFile(),'Missing domain preview file: '+path);}
const html=await readFile(new URL('index.html',root),'utf8');
const sky=await readFile(new URL('phitarium/index.html',root),'utf8');
const overview=await readFile(new URL('gateway/overview-domain.js',root),'utf8');
for(const p of ['index.html','gateway/gateway.css','gateway/overview-domain.js','phitarium/index.html','phitarium/repos.json','phitarium/app.js','phitarium/vendor/three.module.js','repos.json','other-fields/index.html'])await exists(p);
assert.match(html,/id="gatewayCount"/);
assert.match(html,/href="\.\/phitarium\/index\.html"/);
assert.match(html,/src="\.\/gateway\/overview-domain\.js"/);
assert.match(html,/href="\.\/gateway\/gateway\.css"/);
assert.match(overview,/\.\/phitarium\/index\.html\?repo=github:/);
assert.match(sky,/src="\.\/app.js"/);
assert(!html.includes('href="../index.html"'),'Root gateway must not loop to itself');
console.log('Verified isolated domain-root gateway, Phitarium deep links, catalog assets, and Six Houses. No deployment performed.');
