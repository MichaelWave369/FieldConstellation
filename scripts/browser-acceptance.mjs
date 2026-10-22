import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

/**
 * Real-browser visitor acceptance. All inputs are served from the checked-in
 * public-only build; tests neither modify production nor use authenticated APIs.
 */
const origin='http://127.0.0.1:4179';
const base=origin+'/FieldConstellation/';
const artifactPath='artifacts/browser-acceptance';
const inventory=JSON.parse(await readFile(new URL('../src/repos.json',import.meta.url),'utf8')).repos;
const first=inventory.find(r=>r.name==='Domistika'&&r.visibility==='public');
const second=inventory.find(r=>r.name==='SuperPhiVessel'&&r.visibility==='public');
assert(first&&second,'Public acceptance fixtures must resolve to displayed repos.');
const canonical=repo=>'github:'+repo.id;
let server,browser;

const log=(message)=>process.stdout.write('[browser acceptance] '+message+'\n');
async function waitForServer(){
  for(let i=0;i<100;i++){
    if(server.exitCode!==null)throw Error('Preview server exited before acceptance started.');
    try{
      const response=await fetch(base,{signal:AbortSignal.timeout(1200)});
      if(response.ok)return;
    }catch{}
    await delay(200);
  }
  throw Error('Preview server did not start.');
}
async function ready(page,href){
  await page.goto(href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('loading')?.hidden===true,{timeout:30000});
  const count=await page.locator('#totalCount').textContent();
  assert(Number(count)>0,'Public project inventory should render.');
  assert.equal(await page.locator('#postcardDialog').isVisible(),false,'No unsolicited modal without a postcard link.');
}
async function saveFavorite(page,repo){
  await ready(page,base+'?repo='+encodeURIComponent(canonical(repo)));
  const inspector=page.locator('#inspector');
  assert.equal(await inspector.isVisible(),true,'Project link should hydrate the inspector.');
  await page.locator('#passportToggle').click();
  assert.equal(await page.locator('#passportToggle').getAttribute('aria-pressed'),'true','Save toggle must respond to a click.');
}
async function capture(page,name){
  await page.screenshot({path:artifactPath+'/'+name+'.png',animations:'disabled'});
}

try{
  await mkdir(artifactPath,{recursive:true});
  server=spawn(process.execPath,['scripts/serve.mjs'],{
    env:{...process.env,PORT:'4179'},stdio:['ignore','pipe','pipe']
  });
  server.stdout.on('data',buf=>log('preview: '+buf.toString().trim()));
  server.stderr.on('data',buf=>process.stderr.write(buf));
  await waitForServer();
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
  const desktop=await browser.newContext({viewport:{width:1440,height:960}});
  // Exercise the selectable link fallback independent of system clipboard permissions.
  await desktop.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{
    configurable:true,get:()=>undefined
  }));
  const page=await desktop.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));

  log('desktop: stable project selection, Passport saves and persistence');
  await saveFavorite(page,first);
  await saveFavorite(page,second);
  await page.locator('#passportButton').click();
  assert.equal(await page.locator('#passportDialog').isVisible(),true);
  assert.match(await page.locator('#passportSummary').textContent(),/2 saved worlds/);
  await page.locator('#postcardComposer').click();
  assert.equal(await page.locator('#postcardDialog').isVisible(),true);
  assert.match(await page.locator('#postcardCount').textContent(),/2 of 8/);
  await page.locator('#postcardCopy').click();
  const fallback=page.locator('#postcardUrlFallback');
  assert.equal(await fallback.isVisible(),true,'Clipboard-denied mode must expose a selectable link.');
  const postcardUrl=await fallback.inputValue();
  const shared=new URL(postcardUrl);
  assert.equal(shared.pathname,'/FieldConstellation/');
  assert.equal(shared.searchParams.getAll('postcard').length,1);
  assert.equal(shared.searchParams.size,1,'Postcards must strip unrelated query parameters.');
  assert.deepEqual(shared.searchParams.get('postcard').split(','),[canonical(second),canonical(first)]);
  await capture(page,'desktop-postcard-composer');
  assert.deepEqual(errors,[],'Desktop app must have no uncaught JavaScript errors.');
  await desktop.close();

  log('anonymous recipient: preview and explicit opt-in without history sharing');
  const recipient=await browser.newContext({viewport:{width:1280,height:900}});
  const recvPage=await recipient.newPage();
  const recipientErrors=[];
  recvPage.on('pageerror',e=>recipientErrors.push(e.message));
  await recvPage.goto(postcardUrl,{waitUntil:'domcontentloaded'});
  await recvPage.waitForFunction(()=>document.getElementById('loading')?.hidden===true);
  assert.equal(await recvPage.locator('#postcardDialog').isVisible(),true,'Valid postcard must open a preview.');
  assert.match(await recvPage.locator('#postcardCount').textContent(),/2 public worlds/);
  const before=await recvPage.evaluate(()=>localStorage.getItem('field-constellation-passport-v1'));
  assert(!before||JSON.parse(before).favoriteIds.length===0,'Viewing a postcard must not import favorites.');
  await capture(recvPage,'desktop-postcard-preview');
  await recvPage.locator('#postcardSave').click();
  const saved=await recvPage.evaluate(()=>JSON.parse(localStorage.getItem('field-constellation-passport-v1')));
  assert.equal(saved.favoriteIds.length,2,'Explicit save must add the selected public favorites.');
  assert.deepEqual(saved.recentIds,[],'Saving a postcard must not forge recent visits.');
  await recvPage.locator('[data-postcard-world]').first().click();
  assert.equal(await recvPage.locator('#postcardDialog').isVisible(),false);
  assert.equal(new URL(recvPage.url()).searchParams.has('postcard'),false,'Opening a world should clear postcard URL state.');
  assert.equal(new URL(recvPage.url()).searchParams.get('repo'),canonical(second));
  assert.match(await recvPage.locator('#inspectorContent').textContent(),new RegExp(second.name));
  assert.deepEqual(recipientErrors,[],'Recipient UI must have no uncaught JavaScript errors.');
  await recipient.close();

  log('mobile: preview remains accessible and a link can be dismissed by Escape');
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const mobilePage=await mobile.newPage();
  await mobilePage.goto(postcardUrl,{waitUntil:'domcontentloaded'});
  await mobilePage.waitForFunction(()=>document.getElementById('loading')?.hidden===true);
  assert.equal(await mobilePage.locator('#postcardDialog').isVisible(),true);
  assert.equal(await mobilePage.locator('#postcardSave').isVisible(),true);
  await capture(mobilePage,'mobile-postcard-preview');
  await mobilePage.keyboard.press('Escape');
  assert.equal(await mobilePage.locator('#postcardDialog').isVisible(),false);
  await mobile.close();

  log('graphics fallback: canvas renderer and public directory are usable without WebGL2');
  const fallbackContext=await browser.newContext({viewport:{width:1280,height:800}});
  await fallbackContext.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,...args){
      if(kind==='webgl2')return null;
      return original.call(this,kind,...args);
    };
  });
  const fallbackPage=await fallbackContext.newPage();
  const fallbackErrors=[];
  fallbackPage.on('pageerror',e=>fallbackErrors.push(e.message));
  await ready(fallbackPage,base);
  await fallbackPage.locator('#directoryButton').click();
  assert.equal(await fallbackPage.locator('#directoryDialog').isVisible(),true,'Directory must stay accessible without WebGL2.');
  assert(Number((await fallbackPage.locator('#directoryCount').textContent()).match(/\d+/)?.[0])>0);
  await capture(fallbackPage,'canvas-directory-fallback');
  assert.deepEqual(fallbackErrors,[],'Canvas fallback should not produce uncaught JavaScript errors.');
  await fallbackContext.close();

  log('PASS: desktop, anonymous recipient, mobile, and non-WebGL2 directory flows.');
}finally{
  if(browser)await browser.close();
  if(server){
    server.kill('SIGTERM');
    await new Promise(resolve=>{
      if(server.exitCode!==null)return resolve();
      server.once('exit',resolve);
      setTimeout(resolve,2000);
    });
  }
}
