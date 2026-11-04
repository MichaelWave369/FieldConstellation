import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../src/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const page=await read('gateway/index.html');
const css=await read('gateway/gateway.css');
const map=await read('index.html');
const app=await read('app.js');
const houses=await read('other-fields/index.html');
const inventory=JSON.parse(await read('repos.json')).repos;
const repoIds=new Map(inventory.map(r=>[String(r.id),r.name]));

test('Field Gateway offers three working internal entrance routes',()=>{
  for(const link of ['../index.html','../index.html?directory=1','../other-fields/index.html'])
    assert(page.includes('href="'+link+'"'),'Gateway missing: '+link);
  assert(map.includes('href="./gateway/index.html"'));
  assert(houses.includes('href="../gateway/index.html"'));
  assert(app.includes("searchParams.get('directory')==='1'"));
});

test('PhiOS and both ecosystem neighbors use verified public GitHub IDs',()=>{
  const expected=[['PhiOS','1173855223'],['Infinite-Porch','1188495091'],['Infinite-Commons','1188481881'],['PhiOS-Mobile','1440994397'],['PhiOS-XR','1429113142']];
  for(const [name,id] of expected){
    assert.equal(repoIds.get(id),name,'Catalog identity missing: '+name);
    assert(page.includes('href="../index.html?repo=github:'+id+'"'),'Project star link missing: '+name);
  }
  assert.equal((page.match(/class="system-card /g)||[]).length,3);
});

test('Static public gateway has no remote scripts or invented installations',()=>{
  assert(!/<script\b/i.test(page));
  assert(!/<iframe\b/i.test(page));
  assert(!/<img\b/i.test(page));
  assert(!/https?:\/\/(?!phi-field\.com\/)/i.test(page));
  assert(page.includes('not a qualified native install'));
  assert(page.includes('Skip to gateway'));
  assert(css.includes('prefers-reduced-motion'));
  assert(page.includes('viewport'));
});
