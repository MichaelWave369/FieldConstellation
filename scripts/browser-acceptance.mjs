import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
import {MISSIONS} from '../src/missions.js';
import {OUTER_STEPS} from '../src/outer-field.js';

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
  // Acceptance must be deterministic even when the checked-in inventory grows older than 24 hours.
  const disableAuto=()=>{try{localStorage.setItem('field-constellation-auto-public-v1','off');}catch{}};
  const desktop=await browser.newContext({viewport:{width:1440,height:960}});
  await desktop.addInitScript(disableAuto);
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

  // Dossier navigation is a real project visit. Isolate this acceptance check
  // in its own browser context so it cannot seed the later Quest/Passport fixtures.
  log('desktop: optional expanded Planet Dossier and public neighbor navigation');
  const dossierContext=await browser.newContext({viewport:{width:1440,height:960}});
  await dossierContext.addInitScript(disableAuto);
  const dossierPage=await dossierContext.newPage();
  const dossierErrors=[];
  dossierPage.on('pageerror',error=>dossierErrors.push(error.message));
  await ready(dossierPage,base+'?repo='+encodeURIComponent(canonical(second)));
  assert.equal(await dossierPage.locator('#toggleDossier').getAttribute('aria-pressed'),'false');
  await dossierPage.locator('#toggleDossier').click();
  assert.equal(await dossierPage.locator('#inspector').evaluate(element=>element.classList.contains('dossier-open')),true);
  assert.equal(await dossierPage.locator('#toggleDossier').getAttribute('aria-pressed'),'true');
  assert.equal(await dossierPage.locator('#planetDossierTitle').textContent(),'Source & neighborhood');
  assert.match(await dossierPage.locator('.dossier-evidence').textContent(),/Reviewed connection coverage/);
  assert(await dossierPage.locator('[data-dossier-repo]').count()>0,'Public neighboring stars must be navigable');
  await capture(dossierPage,'desktop-planet-dossier');
  const dossierBefore=await dossierPage.locator('#inspector').getAttribute('data-repo');
  await dossierPage.locator('[data-dossier-repo]').first().click();
  assert.notEqual(await dossierPage.locator('#inspector').getAttribute('data-repo'),dossierBefore,'Neighbor opens normal inspector');
  await dossierPage.locator('#toggleDossier').click();
  assert.equal(await dossierPage.locator('#toggleDossier').getAttribute('aria-pressed'),'false');
  assert.equal(await dossierPage.locator('.planet-dossier').count(),0,'Compact inspector contains no expanded dossier');
  assert.deepEqual(dossierErrors,[],'Dossier navigation must not produce uncaught browser errors');
  await dossierContext.close();

  log('desktop: repository index sort controls and the public-only auto-check preference');
  assert.equal(await page.locator('#autoRefresh').count(),1,'Auto-check toggle exists.');
  await page.locator('#reposTab').click();
  assert.equal(await page.locator('#sortRepos').textContent(),'Sort: A → Z');
  await page.locator('#sortRepos').click();
  assert.equal(await page.locator('#sortRepos').textContent(),'Sort: Updated');
  await page.locator('#directoryButton').click();
  assert.equal(await page.locator('#directorySort').inputValue(),'updated','Directory and sidebar must share the sort mode.');
  await page.locator('#directoryDialog').evaluate(dialog=>dialog.close());
  await page.locator('#worldsTab').click();

  log('desktop: Solar Systems layout, data legend and opt-in orbital motion');
  await page.locator('[data-layout="solar"]').click();
  assert.equal(await page.locator('[data-layout="solar"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#solarLegend').isVisible(),true);
  assert.equal(await page.locator('#solarNavigator').isVisible(),true,'Solar navigator is available');
  assert.equal(await page.locator('#solarSystemReset').isDisabled(),true);
  await page.locator('#solarSystemSelect').selectOption('infrastructure');
  assert.equal(await page.locator('#solarSystemSelect').inputValue(),'infrastructure');
  assert.equal(await page.locator('[data-group="infrastructure"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#solarSystemStatus').textContent(),/matching planets/);
  assert(Number((await page.locator('#visibleCount').textContent()).split(' ')[0])>0,'Focused system has public planets');
  assert.equal(await page.locator('#solarDiscover').isDisabled(),false);
  await page.locator('#solarDiscover').click();
  assert.equal(await page.locator('#solarDiscoveryDialog').isVisible(),true);
  assert.equal(await page.locator('#solarDiscoveryFeatured .solar-discovery-item').count(),3);
  assert.equal(await page.locator('#solarDiscoveryNewest .solar-discovery-item').count(),3);
  assert.match(await page.locator('#solarTourProgress').textContent(),/^Stop 1 of/);
  await page.locator('#solarTourNext').click();
  assert.match(await page.locator('#solarTourProgress').textContent(),/^Stop 2 of/);
  await page.locator('#solarTourPrev').click();
  await page.locator('#solarDiscoveryClose').click();
  assert.equal(await page.locator('#solarDiscoveryDialog').isVisible(),false);
  await page.locator('#solarSystemReset').click();
  assert.equal(await page.locator('#solarSystemSelect').inputValue(),'');
  assert.equal(await page.locator('#solarSystemReset').isDisabled(),true,'Reset returns to all systems');
  assert.equal(await page.locator('#solarDiscover').isDisabled(),true,'Discovery requires one focused solar system');
    assert.equal(await page.locator('#solarMotion').isChecked(),false,'Moving planets must be opt-in');
  await page.locator('#solarMotion').check();
  assert.equal(await page.locator('#solarMotion').isChecked(),true);
  await capture(page,'desktop-solar-systems');
  await page.locator('#solarMotion').uncheck();
  await page.locator('[data-layout="constellation"]').click();
  assert.equal(await page.locator('#solarLegend').isVisible(),false);
  // Focusing a different category intentionally clears an out-of-system selection.
  // Restore the fixture before the next Dome Show's selected-project preservation checks.
  await ready(page,base+'?repo='+encodeURIComponent(canonical(second)));
  assert.equal(await page.locator('#inspector').isVisible(),true);

  log('desktop: Phitarium dome shell and opt-in, noncollecting projection show');
  assert.equal(await page.locator('body').getAttribute('class'),'phitarium');
  assert.equal(await page.locator('#domeOverlay').count(),1);
  assert.equal(await page.locator('.dome-rim').count(),1);
  assert.equal(await page.locator('.brand b').textContent(),'CONSTELLATION','The site brand is Field Constellation; the dome remains the Phitarium.');
  log('other fields: six independent houses and return navigation');
  const housesPage=await desktop.newPage();
  await ready(housesPage,base);
  await housesPage.locator('header.map-header a[href="./other-fields/index.html"]').click();
  assert.equal(new URL(housesPage.url()).pathname,'/FieldConstellation/other-fields/index.html');
  assert.equal(await housesPage.locator('article.house').count(),6,'Six Houses must be visible.');
  for(const name of ['ChipsHouse','XiHouse','OmegaHouse','WAREHouse','QuillHouse','QEFHouse']){
    assert.equal(await housesPage.getByRole('heading',{name,exact:true}).count(),1,'Missing House: '+name);
  }
  await housesPage.locator('header nav a[href="../index.html"]').click();
  await housesPage.waitForFunction(()=>document.getElementById('loading')?.hidden===true,{timeout:30000});
  assert.equal(new URL(housesPage.url()).pathname,'/FieldConstellation/index.html','Return to Phitarium must work under Pages subpath.');
  await housesPage.close();
  log('gateway: desktop destinations and explicit Directory deep link');
  const gatewayPage=await desktop.newPage();
  await gatewayPage.goto(base+'gateway/index.html',{waitUntil:'domcontentloaded'});
  assert.equal(await gatewayPage.getByRole('heading',{level:1}).count(),1);
  assert.equal(await gatewayPage.locator('article.system-card').count(),3);
  await capture(gatewayPage,'desktop-field-gateway');
  await gatewayPage.locator('a[href="../index.html?directory=1"]').click();
  await gatewayPage.waitForFunction(()=>document.getElementById('loading')?.hidden===true,{timeout:30000});
  assert.equal(await gatewayPage.locator('#directoryDialog').isVisible(),true,'Explicit directory route opens Directory');
  assert(Number((await gatewayPage.locator('#directoryCount').textContent()).split(' ')[0])>0);
  await gatewayPage.locator('#directoryDialog').evaluate(dialog=>dialog.close());
  await gatewayPage.locator('header.map-header a[href="./gateway/index.html"]').click();
  assert.equal(new URL(gatewayPage.url()).pathname,'/FieldConstellation/gateway/index.html');
  await gatewayPage.locator('a[href="../other-fields/index.html"]').first().click();
  assert.equal(await gatewayPage.locator('article.house').count(),6);
  await gatewayPage.close();
  const beforeShowQuest=await page.locator('#questCount').textContent();
  const beforeShowPassport=await page.locator('#passportCount').textContent();
  const beforeShowUrl=page.url();
  const beforeShowSelected=await page.locator('#inspector h2').textContent();
  await page.locator('#showtimeButton').click();
  assert.equal(await page.locator('#showtimeHud').isVisible(),true);
  assert.equal(await page.locator('#showtimeButton').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#showtimeName').textContent(),'FieldConstellation');
  assert.match(await page.locator('#showtimeCount').textContent(),/1 \/ 6/);
  await capture(page,'desktop-phitarium-dome-show');
  await page.locator('#showtimeNext').click();
  assert.equal(await page.locator('#showtimeName').textContent(),'FieldAtlas');
  assert.equal(await page.locator('#showtimeButton').getAttribute('aria-pressed'),'true');
  await page.locator('#showtimeStop').click();
  assert.equal(await page.locator('#showtimeHud').isVisible(),false);
  assert.equal(await page.locator('#showtimeButton').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#questCount').textContent(),beforeShowQuest,'Watching a show must not collect new stars.');
  assert.equal(await page.locator('#passportCount').textContent(),beforeShowPassport,'Watching a show must not touch saved bookmarks.');
  assert.equal(page.url(),beforeShowUrl,'Dome Show must preserve project deep links and navigation history.');
  assert.equal(await page.locator('#inspector h2').textContent(),beforeShowSelected,'Dome Show must preserve the selected repository.');
  assert.equal(await page.locator('#inspector').isVisible(),true,'Closing the show restores the previous project inspector.');
  await capture(page,'desktop-phitarium-observatory');

  log('desktop: Phitarium Immersive Mode is full-viewport, read-only until Explore and restores navigation');
  const immersivePreviousUrl=page.url();
  const immersivePreviousQuest=await page.locator('#questCount').textContent();
  const immersivePreviousPassport=await page.locator('#passportCount').textContent();
  await page.locator('#immersiveButton').click();
  assert.equal(await page.locator('#immersiveHud').isVisible(),true);
  assert.equal(await page.locator('body').evaluate(body=>body.classList.contains('immersive-mode')),true);
  assert.equal(await page.locator('.sidebar').isVisible(),false,'Immersive mode must hide the ordinary sidebar.');
  assert.equal(await page.locator('.map-header').isVisible(),false,'Immersive mode must hide map technical controls.');
  const mapBox=await page.locator('#map').boundingBox();
  assert(mapBox&&Math.abs(mapBox.x)<1&&mapBox.width>=1439,'Dome must fill the viewport.');
  assert.equal(await page.locator('#immersiveTitle').textContent(),'FieldConstellation');
  await capture(page,'desktop-phitarium-immersive');
  await page.locator('#immersiveNext').click();
  assert.equal(await page.locator('#immersiveTitle').textContent(),'FieldAtlas');
  assert.match(await page.locator('#immersiveReadme').getAttribute('href'),/github\.com\/MichaelWave369\/FieldAtlas#readme/);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#immersiveTitle').textContent(),'PhiOS');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#immersiveHud').isVisible(),false);
  assert.equal(await page.locator('.sidebar').isVisible(),true);
  assert.equal(await page.locator('#inspector').isVisible(),true);
  assert.equal(await page.locator('#questCount').textContent(),immersivePreviousQuest);
  assert.equal(await page.locator('#passportCount').textContent(),immersivePreviousPassport);
  assert.equal(page.url(),immersivePreviousUrl,'Presentation navigation must not rewrite repository deep links.');
  await page.locator('#immersiveButton').click();
  await page.locator('#immersiveQuest').click();
  assert.equal(await page.locator('#immersiveHud').isVisible(),false);
  assert.equal(await page.locator('#questDialog').isVisible(),true,'Immersive quest button opens the existing RPG.');
  await page.locator('#questDialog').evaluate(dialog=>dialog.close());


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

  log('desktop: RPG star collection, skill-tree navigation and independent reset');
  await page.locator('#postcardDialog').evaluate(dialog=>dialog.close());
  await page.locator('#questButton').click();
  assert.equal(await page.locator('#questDialog').isVisible(),true);
  assert.match(await page.locator('#questSummary').textContent(),/2 \/ \d+/,'Two earlier project visits count as local discoveries.');
  assert.equal(await page.locator('.quest-branch').count(),8,'All eight thematic branches must be present.');
  assert.equal(await page.locator('.quest-achievement').count(),8);
  await page.locator('#questLensButton').click();
  assert.equal(await page.locator('#colorLens').inputValue(),'quest','Quest color lens must update the actual map.');
  await capture(page,'desktop-rpg-quest-tree');
  await page.locator('[data-quest-repo]').first().click();
  assert.equal(await page.locator('#questDialog').isVisible(),false,'Selecting a quest star should return to the map.');
  assert.equal(await page.locator('#questCount').textContent(),'3','Exploring another public star should award a new discovery.');
  await page.locator('#questButton').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#questReset').click();
  assert.equal(await page.locator('#questCount').textContent(),'0');
  assert.match(await page.locator('#passportSummary').textContent(),/2 saved worlds/);
  await page.locator('#questDialog').evaluate(dialog=>dialog.close());
  // A repo deep link intentionally discovers that world again. Navigate to the
  // unselected home view to test persistence without a new visit.
  await ready(page,base);
  assert.equal(await page.locator('#questCount').textContent(),'0','Reset must persist without re-seeding from Passport.');
  assert.equal(await page.locator('#passportCount').textContent(),'2','RPG reset must not erase existing bookmarks.');
  log('desktop: Nine Gates playable missions, wrong-answer hints, victory reward and persistence');
  await page.locator('#questButton').click();
  assert.equal(await page.locator('#missionStart').isVisible(),true);
  await page.locator('#missionStart').click();
  assert.equal(await page.locator('#questDialog').isVisible(),false);
  assert.equal(await page.locator('#missionDialog').isVisible(),true);
  assert.match(await page.locator('#missionProgress').textContent(),/0 \/ 9/);
  assert.match(await page.locator('#missionEncounter').textContent(),/The Evacuation Ledger/);
  await page.locator('[data-mission-option="PhiServe"]').click();
  assert.match(await page.locator('#missionFeedback').textContent(),/Not quite/);
  assert.match(await page.locator('#missionProgress').textContent(),/0 XP/,'Wrong choice cannot earn mission XP.');
  await page.locator('[data-mission-option="PhiSafe"]').click();
  assert.match(await page.locator('#missionFeedback').textContent(),/Gate cleared!/);
  assert.match(await page.locator('#missionProgress').textContent(),/30 XP/);
  assert.equal(await page.locator('#missionTravel').isVisible(),true);
  assert.match(await page.locator('.mission-cleared a').getAttribute('href'),/github.com\/MichaelWave369\/PhiSafe#readme/);
  await page.locator('#missionNext').click();
  assert.match(await page.locator('#missionEncounter').textContent(),/The Living Room Signal/);
  await page.locator('[data-mission-option="ReelTheater"]').click();
  assert.match(await page.locator('#missionProgress').textContent(),/60 XP/);
  await capture(page,'desktop-nine-gates');
  await page.locator('#missionJournal').click();
  assert.match(await page.locator('#missionJournalStatus').textContent(),/2\/9 gates cleared/);
  await ready(page,base);
  await page.locator('#questButton').click();
  await page.locator('#missionStart').click();
  assert.match(await page.locator('#missionEncounter').textContent(),/The Pocket Portal/,'Story progress must survive a reload.');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#missionReset').click();
  assert.match(await page.locator('#missionProgress').textContent(),/0 \/ 9/);
  await page.locator('#missionDialog').evaluate(dialog=>dialog.close());
  assert.equal(await page.locator('#passportCount').textContent(),'2','Campaign restart must preserve Passport bookmarks.');
  assert.equal(await page.locator('#questCount').textContent(),'0','Campaign restart must preserve the existing Quest RPG journal.');

  log('desktop: Outer Field is locked until the full Nine Gates campaign is cleared');
  await page.locator('#questButton').click();
  await page.locator('#outerStart').click();
  assert.equal(await page.locator('#outerDialog').isVisible(),true);
  assert.match(await page.locator('#outerEncounter').textContent(),/The Outer Field is sealed/);
  await page.locator('#outerBackGates').click();
  for(let i=0;i<MISSIONS.length;i++){
    const mission=MISSIONS[i];
    await page.locator('[data-mission-option="'+mission.answer+'"]').click();
    await page.locator('#missionNext').click();
  }
  assert.match(await page.locator('#missionEncounter').textContent(),/All nine gates cleared/);
  assert.equal(await page.locator('#missionOuter').isVisible(),true,'Original victory must open the new adventure.');
  await page.locator('#missionOuter').click();
  assert.equal(await page.locator('#outerDialog').isVisible(),true);
  assert.match(await page.locator('#outerLedger').textContent(),/0\/9/);
  assert.equal(await page.locator('.outer-track-segment').count(),4);

  log('desktop: three true star hunts, two knowledge combinations, secret world and boss');
  for(let i=0;i<OUTER_STEPS.length;i++){
    const step=OUTER_STEPS[i];
    assert((await page.locator('#outerEncounter').textContent()).includes(step.title),'Expected current encounter '+step.id);
    if(step.visit){
      await page.locator('[data-outer-choice="'+step.correct+'"]').click();
      assert.match(await page.locator('#outerFeedback').textContent(),/Correct world/);
      assert.equal(await page.locator('#outerTravel').isVisible(),true);
      await page.locator('#outerTravel').click();
      assert.equal(await page.locator('#outerDialog').isVisible(),false);
      assert.match(new URL(page.url()).searchParams.get('repo')||'',/^github:/);
      await page.locator('#questButton').click();
      await page.locator('#outerStart').click();
      assert.equal(await page.locator('#outerClaim').isVisible(),true,'Discovering the real star should permit collecting the artifact.');
      await page.locator('#outerClaim').click();
    }else{
      await page.locator('[data-outer-choice="'+step.correct+'"]').click();
    }
    assert.match(await page.locator('#outerFeedback').textContent(),/Encounter cleared|Artifact attuned/i);
    assert.match(await page.locator('#outerEncounter').textContent(),/Read .* README/,'Completed encounter must link to real project documentation.');
    await page.locator('#outerNext').click();
    if(i===4)assert.match(await page.locator('#outerEncounter').textContent(),/Room Between Worlds/);
    if(i===5)assert.match(await page.locator('#outerEncounter').textContent(),/Boss Phase I/);
  }
  assert.match(await page.locator('#outerEncounter').textContent(),/The field was never broken/);
  assert.match(await page.locator('#outerLedger').textContent(),/400 \/ 400 XP/);
  assert.equal(await page.locator('#outerPortal').isVisible(),true);
  await capture(page,'desktop-outer-field-victory');
  await page.locator('#outerPortal').click();
  assert.equal(await page.locator('#outerDialog').isVisible(),false);
  assert.equal(await page.locator('#layoutLabel').textContent(),'GOLDEN-ANGLE TIMELINE');
  assert.equal(await page.locator('#spiralArrival').isVisible(),true,'Spiral portal must visually arrive in the real map.');
  await page.locator('#questButton').click();
  await page.locator('#outerStart').click();
  assert.match(await page.locator('#outerLedger').textContent(),/9\/9/,'Outer Field completion must persist.');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#outerReset').click();
  assert.match(await page.locator('#outerLedger').textContent(),/0\/9/,'Only the Outer Field campaign is reset.');
  await page.locator('#outerDialog').evaluate(dialog=>dialog.close());
  await ready(page,base);
  await page.locator('#questButton').click();
  assert.match(await page.locator('#missionJournalStatus').textContent(),/9\/9 gates cleared/);
  assert.match(await page.locator('#outerJournalStatus').textContent(),/0\/9 encounters/);
  assert(Number(await page.locator('#questCount').textContent())>=4,'Existing discovered stars must survive the Outer Field reset.');
  assert.equal(await page.locator('#passportCount').textContent(),'2','Passport bookmarks survive the whole adventure.');
  await page.locator('#questDialog').evaluate(dialog=>dialog.close());

  assert.deepEqual(errors,[],'Desktop app must have no uncaught JavaScript errors.');
  await desktop.close();

  log('independent immersive visitor: explicit Explore navigates and discovers one public star');
  const exhibitContext=await browser.newContext({viewport:{width:1300,height:850}});
  const exhibitPage=await exhibitContext.newPage();
  await ready(exhibitPage,base);
  const initialCount=Number(await exhibitPage.locator('#questCount').textContent());
  await exhibitPage.locator('#immersiveButton').click();
  await exhibitPage.locator('#immersiveNext').click();
  assert.equal(await exhibitPage.locator('#immersiveTitle').textContent(),'FieldAtlas');
  assert.equal(Number(await exhibitPage.locator('#questCount').textContent()),initialCount,'Merely viewing an exhibit must never add XP.');
  await exhibitPage.locator('#immersiveExplore').click();
  assert.equal(await exhibitPage.locator('#immersiveHud').isVisible(),false);
  assert.equal(await exhibitPage.locator('#inspector').isVisible(),true);
  assert.equal(new URL(exhibitPage.url()).searchParams.get('repo'),canonical(inventory.find(r=>r.name==='FieldAtlas')));
  assert.equal(Number(await exhibitPage.locator('#questCount').textContent()),initialCount+1,'Explicit Explore records one normal discovery.');
  await exhibitContext.close();


  log('anonymous recipient: preview and explicit opt-in without history sharing');
  const recipient=await browser.newContext({viewport:{width:1280,height:900}});
  await recipient.addInitScript(disableAuto);
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
  await mobile.addInitScript(disableAuto);
  const mobilePage=await mobile.newPage();
  await mobilePage.goto(postcardUrl,{waitUntil:'domcontentloaded'});
  await mobilePage.waitForFunction(()=>document.getElementById('loading')?.hidden===true);
  assert.equal(await mobilePage.locator('#postcardDialog').isVisible(),true);
  assert.equal(await mobilePage.locator('#postcardSave').isVisible(),true);
  await capture(mobilePage,'mobile-postcard-preview');
  await mobilePage.keyboard.press('Escape');
  assert.equal(await mobilePage.locator('#postcardDialog').isVisible(),false);
  await ready(mobilePage,base);
  assert.equal(await mobilePage.locator('#showtimeButton').isVisible(),true,'Mobile visitors must be able to start the Dome Show.');
  await capture(mobilePage,'mobile-phitarium-observatory');
  log('mobile: Planet Dossier remains readable and focusable');
  await ready(mobilePage,base+'?repo='+encodeURIComponent(canonical(first)));
  await mobilePage.locator('#toggleDossier').click();
  assert.equal(await mobilePage.locator('#planetDossierTitle').isVisible(),true);
  const mobileDossierRect=await mobilePage.locator('#inspector').boundingBox();
  assert(mobileDossierRect&&mobileDossierRect.width<=390,'Expanded inspector must fit mobile width');
  await capture(mobilePage,'mobile-planet-dossier');
  await ready(mobilePage,base);
  await mobilePage.locator('[data-layout="solar"]').click();
  assert.equal(await mobilePage.locator('#solarNavigator').isVisible(),true);
  await mobilePage.locator('#solarSystemSelect').selectOption('creative');
  assert.match(await mobilePage.locator('#solarSystemStatus').textContent(),/matching planets/);
  await mobilePage.locator('#solarDiscover').click();
  assert.equal(await mobilePage.locator('#solarDiscoveryDialog').isVisible(),true);
  assert.equal(await mobilePage.locator('#solarDiscoveryNewest .solar-discovery-item').count(),3);
  await capture(mobilePage,'mobile-solar-discovery');
  await mobilePage.locator('#solarDiscoveryClose').click();
  await mobilePage.locator('#solarSystemReset').click();
    assert.equal(await mobilePage.locator('#solarLegend').isVisible(),true,'Solar legend must be shown on mobile');
  await capture(mobilePage,'mobile-solar-systems');
  await mobilePage.locator('[data-layout="constellation"]').click();

  await mobilePage.locator('#immersiveButton').click();
  assert.equal(await mobilePage.locator('#immersiveHud').isVisible(),true);
  const mobileMapBox=await mobilePage.locator('#map').boundingBox();
  assert(mobileMapBox&&Math.abs(mobileMapBox.x)<1,'Immersive map must fill mobile viewport.');
  await capture(mobilePage,'mobile-phitarium-immersive');
  await mobilePage.locator('#immersiveNext').click();
  assert.equal(await mobilePage.locator('#immersiveTitle').textContent(),'FieldAtlas');
  await mobilePage.locator('#immersiveExit').click();
  assert.equal(await mobilePage.locator('#immersiveHud').isVisible(),false);

  await mobilePage.locator('#showtimeButton').click();
  assert.equal(await mobilePage.locator('#showtimeHud').isVisible(),true,'Mobile Dome Show must display its controls.');
  await capture(mobilePage,'mobile-phitarium-dome-show');
  await mobilePage.locator('#showtimeStop').click();
  assert.equal(await mobilePage.locator('#showtimeHud').isVisible(),false);
  log('mobile: gateway layout and links remain in the viewport');
  await mobilePage.goto(base+'gateway/index.html',{waitUntil:'domcontentloaded'});
  assert.equal(await mobilePage.locator('article.system-card').count(),3);
  const gatewayWidth=await mobilePage.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert(gatewayWidth.scroll<=gatewayWidth.width+2,'Gateway overflows 390px mobile viewport');
  await capture(mobilePage,'mobile-field-gateway');
  await mobile.close();

  log('graphics fallback: canvas renderer and public directory are usable without WebGL2');
  const fallbackContext=await browser.newContext({viewport:{width:1280,height:800}});
  await fallbackContext.addInitScript(disableAuto);
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
  assert.equal(await fallbackPage.locator('#inspector').isVisible(),true);
  await fallbackPage.locator('#toggleDossier').click();
  assert.equal(await fallbackPage.locator('#planetDossierTitle').isVisible(),true,'Dossier works in Canvas fallback');
  await fallbackPage.locator('#toggleDossier').click();
  await fallbackPage.locator('#directoryButton').click();
  assert.equal(await fallbackPage.locator('#directoryDialog').isVisible(),true,'Directory must stay accessible without WebGL2.');
  assert.equal(await fallbackPage.locator('#domeOverlay').count(),1,'Planetarium frame remains visible with Canvas fallback.');
  assert.equal(await fallbackPage.locator('#showtimeButton').count(),1,'Dome Show remains accessible in Canvas fallback.');
  await fallbackPage.locator('#directoryDialog').evaluate(dialog=>dialog.close());
  await fallbackPage.locator('[data-layout="solar"]').click();
    assert.equal(await fallbackPage.locator('[data-layout="solar"]').getAttribute('aria-pressed'),'true','Canvas fallback supports Solar Systems mode');
  await fallbackPage.locator('#solarSystemSelect').selectOption('research');
  assert.match(await fallbackPage.locator('#solarSystemStatus').textContent(),/matching planets/);
  await fallbackPage.locator('#solarDiscover').click();
  assert.equal(await fallbackPage.locator('#solarDiscoveryDialog').isVisible(),true);
  await fallbackPage.locator('#solarTourVisit').click();
  assert.equal(await fallbackPage.locator('#solarDiscoveryDialog').isVisible(),false);
  assert.equal(await fallbackPage.locator('#inspector').isVisible(),true,'Inspect planet opens existing public inspector');
  await fallbackPage.locator('#solarSystemReset').click();
  await capture(fallbackPage,'canvas-solar-systems');
  await fallbackPage.locator('[data-layout="constellation"]').click();
  await fallbackPage.locator('#immersiveButton').click();
  assert.equal(await fallbackPage.locator('#immersiveHud').isVisible(),true,'Canvas fallback supports the same immersive exhibit UI.');
  await fallbackPage.locator('#immersiveExit').click();
  assert.equal(await fallbackPage.locator('#immersiveHud').isVisible(),false);
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
