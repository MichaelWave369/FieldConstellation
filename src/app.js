import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CanvasFieldRenderer} from './canvas-renderer.js';
import {installDome,resolveShowtimeStops,SHOWTIME_INTERVAL_MS} from './phitarium.js';
import {resolveImmersiveExhibits,recentCheckSummary} from './immersive.js';
import {GROUPS,ageInDays,hash,prepareRepos,layoutPositions,solarSystemPositions,layoutEdges,languageOrbits,languageColor,colorFor,activityWeight,filterRepos,safeUrl,normalizePublic} from './model.js';

import {parseSnapshot,newerPublicCache,fetchPublicInventory,CACHE_KEY,AUTO_REFRESH_KEY,AUTO_CHECK_KEY,autoRefreshDue} from './inventory.js';
import {SORT_MODES,normalizeSortMode,sortRepositoryList} from './sort.js';
import {resolveRelationships,relationshipEdges,neighborhood,relatedProjects,RELATIONSHIP_STYLES,RELATIONSHIP_KINDS} from './relationships.js';
import {destinationStatus} from './destinations.js';
import {projectId,readProjectLink,projectLink,atlasLink} from './project-links.js';
import {availableTrails} from './trails.js';
import {readTrailLink,trailLink,withoutTrail} from './trail-links.js';
import {PASSPORT_KEY,emptyPassport,parsePassport,sanitizePassport,toggleFavorite,recordVisit,clearPassportSection,passportRepos,exportFavorites,importFavorites} from './passport.js';
import {QUEST_KEY,emptyQuest,readQuest,sanitizeQuest,discover,questProgress} from './quest.js';
import {MISSION_KEY,emptyMissionSave,readMissionSave,sanitizeMissionSave,missionProgress,attemptMission} from './missions.js';
import {OUTER_KEY,emptyOuter,readOuter,sanitizeOuter,outerProgress,attemptOuter} from './outer-field.js';
import {reviewedAtlasIds,atlasManifestLabel} from './atlas-lens.js';
import {publishedAtlasIds,publishedAtlasLabel,publishedAtlasLink,publishedAtlasWebsite} from './atlas-published.js';
import {atlasCoverageAudit,atlasCoverageReceipt} from './atlas-audit.js';
import {MAX_POSTCARD_WORLDS,readPostcardLink,buildPostcardLink,withoutPostcard,savePostcardFavorites} from './postcards.js';

const $=id=>document.getElementById(id);
const svg=id=>`<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={repos:[],query:'',group:null,language:'',visibility:'',pagesOnly:false,hideForks:false,atlasOnly:false,atlasPublishedOnly:false,lens:'world',theme:'field',sidebarMode:'worlds',sortMode:'name',autoRefresh:true,activityNow:Date.now(),layout:'constellation',solarMotion:false,selected:null,hovered:null,orbit:!reducedMotion,links:true,labels:true,visible:new Set(),snapshot:null,publicUpdated:null,architecture:false,includeThematic:false,relationshipLedger:null,relationships:[],deployments:null,atlas:null,atlasPublished:null,neighbors:new Set(),trail:null,trailStop:0,passport:emptyPassport(),quest:emptyQuest(),missionSave:emptyMissionSave(),missionReview:null,missionFeedback:'',outerSave:emptyOuter(),outerReview:null,outerFeedback:'',outerNeedVisit:null,postcardView:null,postcardDraft:[]};
let autoRefreshTimer=null,solarPhase=0,solarSuns=[];
let renderer,scene,camera,controls,instanced,glowPoints,lineMesh,selectionRing,core,coreGlow,starfield,dome=null,groupHalos=[],orbitLines=[],layoutGuides=[],positions=[],targets=[],edges=[],labelNodes=[],clusterLabels=[],centerLabel,frame=0,fitDistance=105,flight=null,toastTimeout,lastHover=0,lastTime=0,sceneReady=false,contextLost=false;
let showtimeIndex=-1,showtimeTimer=null,showtimeStops=[],showtimeWasOrbit=false,showtimeInspectorWasVisible=false;
let immersiveActive=false,immersiveStops=[],immersiveIndex=0,immersiveRestore=null;
const tempMatrix=new THREE.Matrix4(),tempScale=new THREE.Vector3(),tempColor=new THREE.Color(),tempProjection=new THREE.Vector3();
const groupMap=new Map(GROUPS.map(g=>[g.id,g]));
const featured=['BTM','SparkTheSubstrate','EchoesOfTheNine','TweedleVerse','LENZ','FieldStoryForge','BackyardProductionCompany','GenEWrist','SuperPhiVessel','BrainC','PhiLearn','Agentora','Domistika','SiliconLouvre','FramefieldStudio','RastaPhi','PhiCade','GitPorch','FieldAtlas','Pulse369','MoreBounceLabs','NestedBubbleGear','MRIPHI','RegenerationAtlas','Phithon','Vibe','WhiteHatLedger369','PhiOS','CommonTable','FamilyVault','FieldAccord','axiomforge-ledger','Infinite-Commons'];
const repoTint=repo=>state.lens==='quest'?(state.quest.discoveredIds.includes(projectId(repo))?'#d0f29b':'#66736a'):colorFor(repo,state.lens,state.activityNow);
const repoGlow=repo=>{
  if(state.layout!=='solar')return activityWeight(repo,state.activityNow);
  const attention=Math.log1p(Math.max(0,(repo.stars||0)+(repo.forks||0)));
  return Math.min(1.18,.52+.28*Math.exp(-ageInDays(repo,state.activityNow)/200)+attention*.12);
};
const nodeActive=id=>state.visible.has(id)&&(!state.architecture||!state.selected||state.neighbors.has(id)||(showtimeIndex>=0&&state.hovered===id));
const chronological=()=>state.layout==='helix'||state.layout==='spiral';

async function boot(){
  try{
    try{state.autoRefresh=localStorage.getItem(AUTO_REFRESH_KEY)!=='off';state.sortMode=normalizeSortMode(localStorage.getItem('field-constellation-repo-sort-v1'));}catch{}
    let saved=null;try{saved=localStorage.getItem(CACHE_KEY);}catch{}
    try{
      const response=await fetch('./repos.json',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Inventory unavailable');
      state.snapshot=parseSnapshot(await response.json());
    }catch(error){
      try{state.snapshot=parseSnapshot(JSON.parse(saved));state.publicUpdated=state.snapshot.fetchedAt;}catch{throw error;}
    }
    const cache=newerPublicCache(saved,state.snapshot);
    if(cache){state.snapshot=cache;state.publicUpdated=cache.fetchedAt;}
    state.repos=prepareRepos(state.snapshot.repos);
    try{state.passport=parsePassport(localStorage.getItem(PASSPORT_KEY),state.repos);}catch{state.passport=emptyPassport();}
    try{state.quest=readQuest(localStorage.getItem(QUEST_KEY),state.repos,state.passport);saveQuest(false);}catch{state.quest=emptyQuest();}
    try{state.missionSave=readMissionSave(localStorage.getItem(MISSION_KEY),state.repos);}catch{state.missionSave=emptyMissionSave();}
    try{state.outerSave=readOuter(localStorage.getItem(OUTER_KEY),state.repos);}catch{state.outerSave=emptyOuter();}
    const extras=await Promise.allSettled(['relationships','deployments','atlas','atlas-published'].map(async name=>{const r=await fetch('./'+name+'.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(name+' unavailable');return r.json();}));
    try{state.relationshipLedger=extras[0].status==='fulfilled'?extras[0].value:null;state.relationships=resolveRelationships(state.repos,state.relationshipLedger);}catch{state.relationshipLedger=null;}
    state.deployments=extras[1].status==='fulfilled'?extras[1].value:null;
    state.atlas=extras[2].status==='fulfilled'?extras[2].value:null;
    state.atlasPublished=extras[3].status==='fulfilled'?extras[3].value:null;
    bindUI();renderTrails();updatePassportCount();updateInventoryUI();applyFilters();updateRelationshipUI();
    try{initScene();sceneReady=true;buildField();animate(0);}catch(error){console.error('3D initialization failed',error);$('map').classList.add('webgl-unavailable');$('orbitToggle').disabled=true;$('loading').hidden=true;toast('3D is unavailable here. Every public repo is still in the directory.');}
    const sharedPostcard=readPostcardLink(location.href,state.repos);
    const sharedTrail=readTrailLink(location.href,state.repos);
    if(sharedTrail){state.trail=sharedTrail.trail;state.trailStop=sharedTrail.index;}
    const linked=sharedTrail?.repo||readProjectLink(location.href,state.repos);
    if(linked)selectRepo(linked.id,true,false);
    else{
      const spotlight=state.repos.find(r=>r.name==='PhiOS')||state.repos[0];if(spotlight)showInspector(spotlight,true);
      if(new URL(location.href).searchParams.has('trail'))toast('This shared journey is no longer available in the current public inventory.');
      else if(new URL(location.href).searchParams.has('repo'))toast('This shared project is not in the current public inventory.');
      if(innerWidth<761)$('inspector').hidden=true;
    }
    setCameraOffset();$('loading').hidden=true;
    if(new URL(location.href).searchParams.get('directory')==='1'){renderDirectory();$('directoryDialog').showModal();}
    if(sharedPostcard){state.postcardView=sharedPostcard;renderPostcard();$('postcardDialog').showModal();}
    else if(new URL(location.href).searchParams.has('postcard'))toast('This Field Postcard contains no available public worlds.');
    if(!state.relationshipLedger)toast('Relationship evidence is unavailable. The five layouts and directory remain usable.');
    scheduleAutoRefresh();
  }catch(error){console.error(error);$('loading').innerHTML=`<span class="loader-orbit">✳</span><p>Your public inventory could not load.</p><button class="primary-button" id="retryLoad">Try again</button><a href="https://github.com/MichaelWave369?tab=repositories" target="_blank" rel="noopener noreferrer">Browse on GitHub ↗</a>`;$('retryLoad').onclick=()=>location.reload();}
}

function bindUI(){
  $('search').addEventListener('input',event=>{state.query=event.target.value.trim().toLowerCase();if(state.query)setSidebarMode('repos');applyFilters();});
  $('language').addEventListener('change',event=>{state.language=event.target.value;applyFilters();});
  $('visibility').addEventListener('change',event=>{state.visibility=event.target.value;applyFilters();});
  $('resetFilters').onclick=resetFilters;$('emptyReset').onclick=resetFilters;
  $('worldsTab').onclick=()=>setSidebarMode('worlds');$('reposTab').onclick=()=>setSidebarMode('repos');
  [$('worldsTab'),$('reposTab')].forEach(tab=>tab.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const next=tab.id==='worldsTab'?$('reposTab'):$('worldsTab');setSidebarMode(next.id==='reposTab'?'repos':'worlds');next.focus();}}));
  $('colorLens').onchange=event=>setLens(event.target.value);
  $('themeToggle').onclick=()=>setTheme(state.theme==='field'?'lattice':'field');
  $('pagesOnly').onclick=()=>{state.pagesOnly=!state.pagesOnly;applyFilters();};$('hideForks').onclick=()=>{state.hideForks=!state.hideForks;applyFilters();};
  $('atlasOnly').onclick=()=>{if(!reviewedAtlasIds(state.atlas,state.repos).size)return;state.atlasOnly=!state.atlasOnly;if(state.atlasOnly)state.atlasPublishedOnly=false;applyFilters();if(sceneReady)fitMatches();};
  $('atlasPublishedOnly').onclick=()=>{if(!publishedAtlasIds(state.atlasPublished,state.repos).size)return;state.atlasPublishedOnly=!state.atlasPublishedOnly;if(state.atlasPublishedOnly)state.atlasOnly=false;applyFilters();if(sceneReady)fitMatches();};
  $('atlasAuditButton').onclick=()=>{renderAtlasAudit();$('atlasAuditDialog').showModal();};
  $('atlasAuditExport').onclick=downloadAtlasAudit;
  $('atlasAuditRefresh').onclick=async()=>{const button=$('atlasAuditRefresh');button.disabled=true;try{await refreshPublic();renderAtlasAudit();}finally{button.disabled=false;}};
  $('fitMatches').onclick=fitMatches;
  document.querySelectorAll('[data-layout]').forEach(button=>button.onclick=()=>setLayout(button.dataset.layout));
  $('solarMotion').onchange=event=>{state.solarMotion=event.target.checked&&!reducedMotion;};
  $('solarMotion').disabled=reducedMotion;
  $('solarMotion').title=reducedMotion?'Animation disabled by reduced-motion preference':'Animate repository orbits in Solar Systems view';
  $('linksToggle').onchange=event=>{state.links=event.target.checked;if(lineMesh)lineMesh.visible=state.links;if(sceneReady)updateAppearance();};
  $('labelsToggle').onchange=event=>{state.labels=event.target.checked;$('labels').style.display=state.labels?'':'none';};
  $('orbitToggle').onclick=()=>setOrbit(!state.orbit);
  $('resetView').onclick=()=>fitField(true);$('zoomIn').onclick=()=>zoom(.78);$('zoomOut').onclick=()=>zoom(1.26);
  $('closeInspector').onclick=clearSelection;
  $('directoryButton').onclick=()=>{renderDirectory();$('directoryDialog').showModal();};
  $('trailsButton').onclick=()=>{renderTrails();$('trailsDialog').showModal();};
  $('showtimeButton').onclick=()=>showtimeIndex>=0?stopShowtime():startShowtime();
  $('immersiveButton').onclick=()=>immersiveActive?exitImmersive():enterImmersive();
  $('immersiveExit').onclick=()=>exitImmersive();
  $('immersivePrev').onclick=()=>moveImmersive(-1);
  $('immersiveNext').onclick=()=>moveImmersive(1);
  $('immersiveExplore').onclick=()=>{
    const repo=immersiveStops[immersiveIndex];
    exitImmersive(false);
    if(repo)selectRepo(repo.id,true);
  };
  $('immersiveQuest').onclick=()=>{exitImmersive();renderQuest();$('questDialog').showModal();};
  $('showtimeStop').onclick=()=>stopShowtime();
  $('showtimeNext').onclick=advanceShowtime;
  $('showtimeExplore').onclick=()=>{const repo=showtimeStops[showtimeIndex];stopShowtime(false);if(repo){resetFilters();selectRepo(repo.id,true);}};
  $('passportButton').onclick=()=>{renderPassport();$('passportDialog').showModal();};
  $('questButton').onclick=()=>{renderQuest();$('questDialog').showModal();};
  $('questReset').onclick=()=>{if(!confirm('Reset all Quest RPG discoveries in this browser? Your Passport will not change.'))return;state.quest=emptyQuest();saveQuest();updateQuestCount();renderQuest();if(state.lens==='quest'){renderLensLegend();renderSidebarIndex();if(sceneReady)updateAppearance();}};
  $('questLensButton').onclick=()=>{setLens(state.lens==='quest'?'world':'quest');renderQuest();};
  $('missionStart').onclick=()=>{state.missionReview=null;state.missionFeedback='';$('questDialog').close();renderMissions();$('missionDialog').showModal();};
  $('outerStart').onclick=()=>openOuter('questDialog');
  $('outerJournal').onclick=()=>{$('outerDialog').close();renderQuest();$('questDialog').showModal();};
  $('outerNext').onclick=()=>{state.outerReview=null;state.outerFeedback='';state.outerNeedVisit=null;renderOuter();};
  $('outerReset').onclick=()=>{if(!confirm('Restart The Outer Field? Your Nine Gates progress, discovered stars and Field Passport stay unchanged.'))return;state.outerSave=emptyOuter();saveOuter();state.outerReview=null;state.outerFeedback='';state.outerNeedVisit=null;renderOuter();};
  $('missionJournal').onclick=()=>{$('missionDialog').close();renderQuest();$('questDialog').showModal();};
  $('missionNext').onclick=()=>{state.missionReview=null;state.missionFeedback='';renderMissions();};
  $('missionReset').onclick=()=>{
    if(!confirm('Restart The Nine Gates in this browser? Collected stars and the Field Passport will remain unchanged.'))return;
    state.missionSave=emptyMissionSave();saveMissionProgress();state.missionReview=null;state.missionFeedback='';renderMissions();
  };
  $('postcardComposer').onclick=()=>{
    if(!state.passport.favoriteIds.length)return;
    state.postcardView=null;state.postcardDraft=state.passport.favoriteIds.slice(0,MAX_POSTCARD_WORLDS);
    $('passportDialog').close();renderPostcard();$('postcardDialog').showModal();
  };
  $('postcardCopy').onclick=copyPostcard;
  $('postcardSave').onclick=saveReceivedPostcard;
  $('passportExport').onclick=downloadPassport;
  $('passportImportButton').onclick=()=>$('passportImport').click();
  $('passportImport').onchange=importPassportFile;
  $('passportClearRecent').onclick=()=>clearPassport('recentIds');
  $('passportClearFavorites').onclick=()=>clearPassport('favoriteIds');
  $('trailPrev').onclick=()=>moveTrail(-1);
  $('trailNext').onclick=()=>moveTrail(1);
  $('trailExit').onclick=stopTrail;
  $('trailShare').onclick=copyTrailLink;
  $('sortRepos').onclick=()=>setRepoSort(SORT_MODES[(SORT_MODES.findIndex(option=>option.id===state.sortMode)+1)%SORT_MODES.length].id);
  $('directorySort').onchange=event=>setRepoSort(event.target.value);
  $('autoRefresh').checked=state.autoRefresh;
  $('autoRefresh').onchange=event=>{state.autoRefresh=event.target.checked;try{localStorage.setItem(AUTO_REFRESH_KEY,state.autoRefresh?'on':'off');}catch{}if(state.autoRefresh)scheduleAutoRefresh();else if(autoRefreshTimer!==null){clearTimeout(autoRefreshTimer);autoRefreshTimer=null;}};
  updateSortControls();
  $('aboutButton').onclick=()=>$('aboutDialog').showModal();
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  $('refresh').onclick=()=>refreshPublic();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleAutoRefresh();});
  document.addEventListener('visibilitychange',()=>{if(showtimeIndex<0)return;if(document.hidden){clearTimeout(showtimeTimer);showtimeTimer=null;}else scheduleShowtime();});
  $('architectureToggle').onclick=()=>setArchitecture(!state.architecture);
  $('fitConnections').onclick=fitConnections;
  $('includeThematic').onchange=event=>{state.includeThematic=event.target.checked;if(sceneReady)buildEdges();else edges=relationshipEdges(state.repos,state.relationships,state.includeThematic);refreshNeighborhood();updateRelationshipUI();if(state.selected)showInspector(state.repos.find(r=>r.id===state.selected),false);};
  window.addEventListener('popstate',()=>{
    if(immersiveActive)exitImmersive(false);
    const shared=readTrailLink(location.href,state.repos);
    const repo=shared?.repo||readProjectLink(location.href,state.repos);
    resetFilters();
    if(shared){state.trail=shared.trail;state.trailStop=shared.index;}
    if(repo)selectRepo(repo.id,true,false);
  });
  $('mobileMenu').onclick=()=>setSidebar(!$('sidebar').classList.contains('open'));
  $('closeMobileMenu').onclick=()=>setSidebar(false);
  $('map').addEventListener('pointerdown',event=>{if(!event.target.closest('#mobileMenu'))setSidebar(false);});
  document.addEventListener('keydown',event=>{
    const editing=event.target.matches('input,textarea,select');
    if(event.key==='/'&&!editing&&!document.querySelector('dialog[open]')){event.preventDefault();if(innerWidth<761)setSidebar(true);$('search').focus();}
    if(event.key==='Escape'&&!document.querySelector('dialog[open]')){
      if(immersiveActive){event.preventDefault();exitImmersive();return;}
      if(state.query){$('search').value='';state.query='';applyFilters();}else clearSelection();setSidebar(false);
    }
    if(immersiveActive&&!editing&&!document.querySelector('dialog[open]')){
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();moveImmersive(event.key==='ArrowRight'?1:-1);return;}
      if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();return;}
    }
    if(!editing&&event.target.tagName!=='CANVAS'&&!document.querySelector('dialog[open]')&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();cycleRepo(event.key==='ArrowDown'?1:-1);}
  });
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
  setOrbit(state.orbit);
}

function updateInventoryUI(){
  const freshness=recentCheckSummary(state.repos,state.deployments);
  $('liveCount').textContent=freshness.count===null?'—':String(freshness.count);
  $('liveCount').title=freshness.detail;
  $('liveCountLabel').textContent=freshness.label;
  $('liveCountLabel').title=freshness.detail;
  $('totalCount').textContent=state.repos.length;$('groupCount').textContent=GROUPS.length;
  $('indexTotal').textContent=state.repos.length;$('inventoryFacts').textContent=`${state.repos.reduce((n,r)=>n+r.stars,0)} stars · ${state.repos.filter(r=>r.pages).length} Pages flags · ${state.repos.filter(r=>r.fork).length} forks`;
  const options=['',...new Set(state.repos.map(r=>r.language))].sort((a,b)=>!a?-1:!b?1:a.localeCompare(b));
  $('language').innerHTML=options.map(x=>`<option value="${escape(x)}">${escape(x||'All languages')}</option>`).join('');$('language').value=state.language;
  const at=state.publicUpdated||state.snapshot.fetchedAt,date=new Date(at).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  $('snapshotStatus').textContent=(state.publicUpdated?'Public repos refreshed · ':'GitHub snapshot · ')+date;
  $('aboutInventory').textContent=`${state.repos.length} public repositories owned by MichaelWave369. Displayed inventory fetched ${new Date(at).toLocaleString()}. Source: ${state.snapshot.source}. Counts follow this displayed dataset; private records are not loaded.`;
  $('snapshotStatus').title=new Date(at).toLocaleString()+' · Complete public GitHub listing';
  const checked=state.deployments?.checkedAt;
  $('aboutDestinations').textContent=checked?`Destination checks: ${new Date(checked).toLocaleString()}. “HTML checked” counts eligible HTTPS destinations that returned 2xx text/html within seven days. It does not certify application features or iframe support. Timeouts and access restrictions are inconclusive; old checks become stale.`:'Destination checks could not load. Homepage and Pages metadata are unverified.';
  const atlas=atlasLink(state.atlas);$('atlasNav').hidden=!atlas;if(atlas)$('atlasNav').href=atlas;
  const atlasIds=reviewedAtlasIds(state.atlas,state.repos);
  $('atlasOnly').disabled=atlasIds.size===0;
  $('atlasOnly').title=atlasIds.size?'Show only public repos in the reviewed, dated Atlas map':'Reviewed Atlas chapter map unavailable';
  $('atlasCount').textContent=String(atlasIds.size);
  $('atlasCoverage').textContent=atlasManifestLabel(state.atlas,state.repos)+'. '+publishedAtlasLabel(state.atlasPublished,state.repos)+'. Neither is a live-chapter count.';
  const publishedIds=publishedAtlasIds(state.atlasPublished,state.repos);
  $('atlasPublishedOnly').disabled=publishedIds.size===0;
  $('atlasPublishedOnly').title=publishedIds.size?'Show sites in the separate dated verified Atlas public Pages inventory':'Published Atlas inventory unavailable';
  $('atlasPublishedCount').textContent=String(publishedIds.size);
  $('aboutAtlasPublished').textContent=publishedIds.size?publishedAtlasLabel(state.atlasPublished,state.repos)+'. This is a public Pages manifest, not an audited chapter list or proof a website works today. The Constellation public repository snapshot may be older.':'No usable dated public Atlas Pages inventory is available.';
  if($('atlasAuditDialog').open)renderAtlasAudit();
  $('aboutAtlasLens').textContent=atlasIds.size?'Atlas Lens shows '+atlasIds.size+' public projects in this independently dated reviewed chapter map. It does not claim the live Atlas is complete or up-to-date. Only reviewed public chapter links are opened.':'Atlas Lens is unavailable because its reviewed public chapter map could not be validated.';

  $('categories').innerHTML=GROUPS.map(g=>`<button class="category${state.group===g.id?' selected':''}" style="--category:${g.color}" data-group="${g.id}" aria-pressed="${state.group===g.id}"><span class="category-dot"></span><span>${g.name}</span><span class="category-count">${state.repos.filter(r=>r.group===g.id).length}</span></button>`).join('');
  document.querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>{state.group=state.group===button.dataset.group?null:button.dataset.group;applyFilters();});
  renderLensLegend();renderSidebarIndex();
}

function applyFilters(){
  const atlasIds=state.atlasOnly?reviewedAtlasIds(state.atlas,state.repos):state.atlasPublishedOnly?publishedAtlasIds(state.atlasPublished,state.repos):null;
  state.visible=new Set(filterRepos(state.repos,state).filter(r=>!atlasIds||atlasIds.has(projectId(r))).map(r=>r.id));
  $('visibleCount').textContent=`${state.visible.size} / ${state.repos.length} worlds`;
  $('emptyState').hidden=state.visible.size!==0;
  document.querySelectorAll('[data-group]').forEach(b=>{const selected=state.group===b.dataset.group;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  if(state.selected&&!state.visible.has(state.selected))clearSelection();
  if($('inspector').dataset.repo&&!state.visible.has($('inspector').dataset.repo))$('inspector').hidden=true;
  if(state.query&&state.visible.size===1&&state.selected!==[...state.visible][0])selectRepo([...state.visible][0],true,false);
  if(sceneReady)updateAppearance();
  if($('directoryDialog').open)renderDirectory();
  $('pagesOnly').setAttribute('aria-pressed',String(state.pagesOnly));$('hideForks').setAttribute('aria-pressed',String(state.hideForks));$('atlasOnly').setAttribute('aria-pressed',String(state.atlasOnly));$('atlasPublishedOnly').setAttribute('aria-pressed',String(state.atlasPublishedOnly));renderSidebarIndex();renderLensLegend();
  $('tooltip').hidden=true;updateRelationshipUI();
}
function resetFilters(){state.query='';state.group=null;state.language='';state.visibility='';state.pagesOnly=false;state.hideForks=false;state.atlasOnly=false;state.atlasPublishedOnly=false;$('search').value='';$('language').value='';$('visibility').value='';clearSelection();applyFilters();if(sceneReady)fitField(true);}
function setSidebarMode(mode){state.sidebarMode=mode;$('worldPanel').hidden=mode!=='worlds';$('repoPanel').hidden=mode!=='repos';$('worldsTab').setAttribute('aria-selected',String(mode==='worlds'));$('reposTab').setAttribute('aria-selected',String(mode==='repos'));$('worldsTab').tabIndex=mode==='worlds'?0:-1;$('reposTab').tabIndex=mode==='repos'?0:-1;$('browseHeading').textContent=mode==='worlds'?'CONSTELLATIONS':'REPOSITORIES';if(mode==='repos')renderSidebarIndex();}
function sortedVisibleRepos(){return sortRepositoryList(state.repos.filter(repo=>state.visible.has(repo.id)),state.sortMode);}
function updateSortControls(){
  const option=SORT_MODES.find(entry=>entry.id===state.sortMode)||SORT_MODES[0];
  const button=$('sortRepos');
  button.textContent='Sort: '+option.label;
  button.title='Current ordering: '+option.description+'. Click for the next sort mode.';
  button.setAttribute('aria-label','Sort repository index, currently '+option.description+'. Activate for the next order.');
  $('directorySort').value=option.id;
}
function setRepoSort(value){
  state.sortMode=normalizeSortMode(value);
  try{localStorage.setItem('field-constellation-repo-sort-v1',state.sortMode);}catch{}
  updateSortControls();renderSidebarIndex();
  if($('directoryDialog').open)renderDirectory();
}
function scheduleAutoRefresh(){
  if(!state.autoRefresh||autoRefreshTimer!==null||!state.snapshot||document.hidden)return;
  let attempted=null;try{attempted=localStorage.getItem(AUTO_CHECK_KEY);}catch{}
  if(!autoRefreshDue(state.autoRefresh,attempted,state.snapshot.fetchedAt))return;
  autoRefreshTimer=setTimeout(()=>{
    autoRefreshTimer=null;
    if(state.autoRefresh&&!document.hidden&&!$('refresh').disabled)void refreshPublic({automatic:true});
  },1500);
}
function renderSidebarIndex(){
  const previousScroll=$('repoIndex').scrollTop;
  const visible=sortedVisibleRepos();$('indexCount').textContent=`${visible.length} in view`;
  $('repoIndex').innerHTML=visible.length?visible.map(r=>`<button class="index-row${r.id===state.selected?' selected':''}${state.architecture&&state.selected&&!nodeActive(r.id)?' context-muted':''}" data-index-repo="${escape(r.id)}" title="${escape(r.description||r.name)}" aria-label="Explore ${escape(r.name)}"><i style="background:${repoTint(r)}"></i><span>${escape(r.name)}</span></button>`).join(''):'<p class="index-empty">No matching worlds. Try Show all.</p>';
  document.querySelectorAll('[data-index-repo]').forEach(button=>{button.onclick=()=>selectRepo(button.dataset.indexRepo,true);button.onmouseenter=()=>{state.hovered=button.dataset.indexRepo;$('tooltip').hidden=true;if(sceneReady)updateAppearance();};button.onmouseleave=()=>{if(state.hovered===button.dataset.indexRepo)state.hovered=null;if(sceneReady)updateAppearance();};});
  $('repoIndex').scrollTop=previousScroll;
}
function cycleRepo(direction){const visible=sortedVisibleRepos();if(!visible.length)return;const index=visible.findIndex(r=>r.id===state.selected),next=index<0?(direction>0?0:visible.length-1):(index+direction+visible.length)%visible.length;selectRepo(visible[next].id,true,false);if(state.sidebarMode==='repos'){const row=document.querySelector(`[data-index-repo="${visible[next].id}"]`);row?.focus({preventScroll:true});row?.scrollIntoView({block:'nearest'});}}
function setLens(lens){state.lens=lens;state.activityNow=Date.now();$('colorLens').value=lens;renderLensLegend();renderSidebarIndex();if(sceneReady)updateAppearance();if(!$('inspector').hidden){const r=state.repos.find(r=>r.id===$('inspector').dataset.repo);if(r)showInspector(r,!state.selected);}}
function renderLensLegend(){
  const visible=state.repos.filter(r=>state.visible.has(r.id));
  if(state.lens==='language'){const counts=new Map();for(const r of visible)counts.set(r.language,(counts.get(r.language)||0)+1);$('lensLegend').innerHTML=[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([language,count])=>`<button class="legend-language" data-key-language="${escape(language)}" title="${escape(language)} · ${count} matching repositories" aria-label="Filter ${escape(language)}"><i style="background:${languageColor(language)}"></i><span>${escape(language)}</span></button>`).join('');document.querySelectorAll('[data-key-language]').forEach(button=>button.onclick=()=>{state.language=state.language===button.dataset.keyLanguage?'':button.dataset.keyLanguage;$('language').value=state.language;applyFilters();});}
  else if(state.lens==='quest')$('lensLegend').innerHTML='<span><i style="background:#d0f29b"></i>Discovered</span><span><i style="background:#66736a"></i>Undiscovered</span><span>Exploration, not build status</span>';
  else if(state.lens==='activity')$('lensLegend').innerHTML='<span title="Age of the last code push"><i style="background:#f5d68b"></i>≤7d</span><span><i style="background:#d7a866"></i>30d</span><span><i style="background:#8ba58b"></i>90d</span><span><i style="background:#6d7884"></i>Older</span>';
  else $('lensLegend').innerHTML='<span>COLOR: WORLD</span><span class="legend-dots">'+GROUPS.map(g=>`<i style="background:${g.color}" title="${g.name}"></i>`).join('')+'</span>';
}
/**
 * Phitarium Immersive Mode is an opt-in visual visitor walk-through.
 * Focus/move = read-only projection. Only Explore invokes selectRepo.
 * This does not create relationships, CI claims or visitor tracking.
 */
function enterImmersive(){
  if(immersiveActive)return;
  if(showtimeIndex>=0)stopShowtime(false);
  const options=resolveImmersiveExhibits(state.repos).filter(repo=>state.visible.has(repo.id));
  if(options.length<2){
    toast('Immersive Dome needs at least two visible public exhibits. Select Show all first.');
    return;
  }
  immersiveStops=options;
  immersiveIndex=Math.max(0,options.findIndex(repo=>repo.id===state.selected));
  immersiveRestore={
    orbit:state.orbit,
    inspectorVisible:!$('inspector').hidden,
    position:camera?.position.clone()||null,
    target:controls?.target.clone()||null
  };
  setSidebar(false);
  immersiveActive=true;
  document.body.classList.add('immersive-mode');
  $('immersiveHud').hidden=false;
  $('immersiveButton').setAttribute('aria-pressed','true');
  $('immersiveButton').setAttribute('aria-label','Exit immersive Phitarium dome');
  $('inspector').hidden=true;
  setOrbit(false);
  if(renderer)resize();
  showImmersiveExhibit();
  $('immersiveExit').focus({preventScroll:true});
}
function exitImmersive(restoreCamera=true){
  if(!immersiveActive)return;
  const previous=immersiveRestore;
  immersiveActive=false;immersiveStops=[];immersiveRestore=null;
  document.body.classList.remove('immersive-mode');
  $('immersiveHud').hidden=true;
  $('immersiveButton').setAttribute('aria-pressed','false');
  $('immersiveButton').setAttribute('aria-label','Enter immersive Phitarium dome');
  $('inspector').hidden=!previous?.inspectorVisible;
  state.hovered=null;
  if(sceneReady){
    resize();
    if(restoreCamera&&previous?.position&&previous?.target)
      flyTo(previous.position,previous.target);
    updateAppearance();
  }
  setOrbit(previous?.orbit||false);
  if(restoreCamera)$('immersiveButton').focus({preventScroll:true});
}
function moveImmersive(direction){
  if(!immersiveActive||!immersiveStops.length)return;
  immersiveIndex=(immersiveIndex+direction+immersiveStops.length)%immersiveStops.length;
  showImmersiveExhibit();
}
function showImmersiveExhibit(){
  if(!immersiveActive)return;
  const repo=immersiveStops[immersiveIndex];
  if(!repo)return;
  const group=groupMap.get(repo.group);
  $('immersiveTitle').textContent=repo.name;
  $('immersiveGroup').textContent=(group?.name||'Public repository')+' · EXHIBIT '+String(immersiveIndex+1).padStart(2,'0');
  $('immersiveDescription').textContent=repo.description?.trim()||'A public project in the Field Constellation. Read its repository documentation to discover what is currently implemented.';
  $('immersiveCounter').textContent=(immersiveIndex+1)+' / '+immersiveStops.length;
  const github=safeUrl(repo.url);
  $('immersiveReadme').href=github&&new URL(github).hostname.toLowerCase()==='github.com'?github.replace(/\/$/,'')+'#readme':'https://github.com/MichaelWave369';
  state.hovered=repo.id;
  if(sceneReady){
    updateAppearance();
    const index=state.repos.findIndex(r=>r.id===repo.id);
    const point=positions[index];
    if(point){
      const offset=camera.position.clone().sub(controls.target);
      if(offset.lengthSq()<.01)offset.set(0,20,110);
      const distance=innerWidth<761?72:51;
      flyTo(point.clone().add(offset.normalize().multiplyScalar(distance)),point.clone());
    }
  }
}

/** Optional theater presentation. Public repository data only.
 * It never calls selectRepo until a visitor explicitly requests Explore,
 * so simply watching never awards discovery XP or changes visit history.
 */
function startShowtime(){
  // Honor the viewer's active filters, selection, URL and map layout. A
  // projection is a read-only presentation, not a navigation or history event.
  const stops=resolveShowtimeStops(state.repos).filter(repo=>state.visible.has(repo.id));
  if(stops.length<2){toast('Dome Show needs two visible public stars. Choose Show all to see the full tour.');return;}
  showtimeStops=stops;
  showtimeWasOrbit=state.orbit;
  showtimeInspectorWasVisible=!$('inspector').hidden;
  $('inspector').hidden=true;
  setOrbit(false);
  showtimeIndex=0;
  $('map').classList.add('showtime-active');
  $('showtimeHud').hidden=false;
  $('showtimeButton').setAttribute('aria-pressed','true');
  $('showtimeButton').setAttribute('aria-label','End planetarium dome show');
  $('showtimeButton').title='End the Phitarium dome show';
  updateShowtime();
}
function stopShowtime(restoreOrbit=true){
  if(showtimeIndex<0)return;
  clearTimeout(showtimeTimer);showtimeTimer=null;
  showtimeIndex=-1;showtimeStops=[];
  $('map').classList.remove('showtime-active');
  $('showtimeHud').hidden=true;
  $('showtimeButton').setAttribute('aria-pressed','false');
  $('showtimeButton').setAttribute('aria-label','Start planetarium dome show');
  $('showtimeButton').title='Start the Phitarium guided dome show';
  if(showtimeInspectorWasVisible&&state.selected)$('inspector').hidden=false;
  state.hovered=null;
  if(sceneReady)updateAppearance();
  setOrbit(restoreOrbit&&showtimeWasOrbit);
}
function scheduleShowtime(){
  clearTimeout(showtimeTimer);showtimeTimer=null;
  if(showtimeIndex<0||reducedMotion||document.hidden)return;
  showtimeTimer=setTimeout(advanceShowtime,SHOWTIME_INTERVAL_MS);
}
function advanceShowtime(){
  if(showtimeIndex<0)return;
  if(showtimeIndex===showtimeStops.length-1){stopShowtime();return;}
  showtimeIndex++;
  updateShowtime();
}
function updateShowtime(){
  if(showtimeIndex<0)return;
  const repo=showtimeStops[showtimeIndex];
  $('showtimeName').textContent=repo.name;
  $('showtimeDescription').textContent=repo.description?.trim()||'Explore this public repository and its story in the living Field.';
  $('showtimeCount').textContent=(showtimeIndex+1)+' / '+showtimeStops.length;
  $('showtimeProgress').max=showtimeStops.length;
  $('showtimeProgress').value=showtimeIndex+1;
  $('showtimeNext').textContent=showtimeIndex===showtimeStops.length-1?'End show':'Next star';
  state.hovered=repo.id;
  if(sceneReady){
    updateAppearance();
    const index=state.repos.findIndex(r=>r.id===repo.id),point=positions[index];
    if(point){
      const offset=camera.position.clone().sub(controls.target).normalize()
        .multiplyScalar(innerWidth<761?52:38);
      flyTo(point.clone().add(offset),point.clone());
    }
  }
  scheduleShowtime();
}

function setTheme(theme){state.theme=theme;document.body.classList.toggle('lattice-theme',theme==='lattice');$('themeToggle').setAttribute('aria-pressed',String(theme==='lattice'));document.querySelector('meta[name="theme-color"]').content=theme==='lattice'?'#15101c':'#050a15';if(scene){scene.background.set(theme==='lattice'?'#15101c':'#060d1f');scene.fog.color.copy(scene.background);dome?.setPalette(theme==='lattice');for(const child of core.children)if(child.material?.color)child.material.color.set(theme==='lattice'?'#e0b15a':'#a5d9f6');}}
function setSidebar(open){$('sidebar').classList.toggle('open',open);$('sidebar').inert=innerWidth<761&&!open;$('mobileMenu').setAttribute('aria-expanded',String(open));}
function setOrbit(value){state.orbit=value;if(controls)controls.autoRotate=value;$('orbitToggle').classList.toggle('active',value);$('orbitToggle').setAttribute('aria-pressed',String(value));}
function setLayout(mode){
  if(showtimeIndex>=0)stopShowtime(false);
  if(state.layout===mode)return;
  if(state.layout==='solar'){state.solarMotion=false;$('solarMotion').checked=false;}
  state.layout=mode;
  document.querySelectorAll('[data-layout]').forEach(b=>{b.classList.toggle('selected',b.dataset.layout===mode);b.setAttribute('aria-pressed',String(b.dataset.layout===mode));});
  $('layoutLabel').textContent={constellation:'CONSTELLATION SPACE',helix:'CHRONOLOGICAL HELIX',sphere:'FIBONACCI SPHERE',orbits:'LANGUAGE ORBITS',spiral:'GOLDEN-ANGLE TIMELINE',solar:'CATEGORY SOLAR SYSTEMS'}[mode];
  $('viewDescription').textContent={constellation:'Eight worlds of ideas. One shared field.',helix:'Follow the order in which your projects began.',sphere:'Every world, a place on the same Fibonacci shell.',orbits:'One orbit per programming language. Inspired by Grok’s Field Lattice.',spiral:'A widening golden-angle spiral, ordered by creation. From Grok’s Field Lattice.',solar:'Eight suns. Every public repository is a planet. Distance represents last push, not project health.'}[mode];
  $('linksCaption').textContent=chronological()?'Creation thread':mode==='orbits'?'Orbit links':mode==='solar'?'Orbit guides':'World links';
  $('solarMotionControl').hidden=mode!=='solar';
  $('solarLegend').hidden=mode!=='solar';
  if(mode==='orbits')setLens('language');
  if(mode==='solar'){solarPhase=0;setLens('world');}
  updateRelationshipUI();
  if(sceneReady){targets=layoutPositions(state.repos,mode).map(p=>new THREE.Vector3(...p));if(reducedMotion)positions=targets.map(p=>p.clone());buildEdges();refreshGuides();buildLabels();fitField(true);}
}

function initScene(){
  const host=$('scene');scene=new THREE.Scene();scene.background=new THREE.Color('#060d1f');scene.fog=new THREE.FogExp2('#060d1f',.0035);dome=installDome(THREE,scene);
  const renderCanvas=document.createElement('canvas');let webglContext=null;try{webglContext=renderCanvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});}catch{}
  renderer=webglContext?new THREE.WebGLRenderer({canvas:renderCanvas,context:webglContext,antialias:true,alpha:false}):new CanvasFieldRenderer({getField:()=>({state,positions,edges,starfield,orbitLines,layoutGuides,domeGuides:dome?.guides||[],core,groupMap,repoTint,repoGlow,nodeActive})});renderer.domElement.dataset.renderer=webglContext?'webgl':'canvas';renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D repository map. Use the Directory button to explore all repositories with the keyboard.');
  camera=new THREE.PerspectiveCamera(46,host.clientWidth/host.clientHeight,.1,650);camera.position.set(0,20,105);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.autoRotate=state.orbit;controls.autoRotateSpeed=.22;controls.minDistance=8;controls.maxDistance=230;controls.enablePan=true;controls.target.set(0,0,0);controls.addEventListener('start',()=>{flight=null;if(showtimeIndex>=0)stopShowtime(false);setOrbit(false);});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;$('map').classList.add('webgl-unavailable');toast('The 3D context was interrupted. The directory remains available.');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  const dotCanvas=document.createElement('canvas');dotCanvas.width=dotCanvas.height=128;const ctx=dotCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.1,'rgba(255,255,255,.8)');gradient.addColorStop(.28,'rgba(255,255,255,.19)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(dotCanvas);
  core=new THREE.Group();const coreMesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,2),new THREE.MeshBasicMaterial({color:'#a5d9f6',wireframe:true,transparent:true,opacity:.35}));core.add(coreMesh);const innerCore=new THREE.Mesh(new THREE.SphereGeometry(.85,20,16),new THREE.MeshBasicMaterial({color:'#d3f1ff'}));core.add(innerCore);coreGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#87c9ff',transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));coreGlow.scale.set(16,16,1);core.add(coreGlow);scene.add(core);
  for(const g of GROUPS){const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:g.color,opacity:.055,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.set(...g.center);halo.scale.set(27,27,1);scene.add(halo);groupHalos.push(halo);}
  // Decorative category suns, not repository nodes or verified connections.
  for(const g of GROUPS){
    const sun=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,10),new THREE.MeshBasicMaterial({color:g.color,transparent:true,opacity:.95,depthWrite:false}));
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:g.color,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false}));
    sun.position.set(...g.center);glow.position.set(...g.center);glow.scale.set(9,9,1);
    sun.visible=glow.visible=false;scene.add(sun,glow);solarSuns.push({sun,glow,group:g});
  }
  for(let ringIndex=0;ringIndex<3;ringIndex++){
    const radius=ringIndex===0?43:ringIndex===1?51:57,points=[];for(let i=0;i<=240;i++){const angle=i/240*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius));}
    const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#829fda',transparent:true,opacity:ringIndex===0?.13:.065,depthWrite:false}));ring.rotation.set((ringIndex-1)*.29,0,ringIndex===1?.43:-.12);ring.position.y=-3;scene.add(ring);orbitLines.push(ring);
  }
  const tickPositions=[];for(let i=0;i<100;i++){const a=i/100*Math.PI*2,r=52;tickPositions.push(Math.cos(a)*r,-3,Math.sin(a)*r,Math.cos(a)*(r+(i%5===0?.9:.35)),-3,Math.sin(a)*(r+(i%5===0?.9:.35)));}const tickGeo=new THREE.BufferGeometry();tickGeo.setAttribute('position',new THREE.Float32BufferAttribute(tickPositions,3));const ticks=new THREE.LineSegments(tickGeo,new THREE.LineBasicMaterial({color:'#829fda',transparent:true,opacity:.13}));ticks.rotation.z=.43;scene.add(ticks);orbitLines.push(ticks);
  const dust=[];for(let i=0;i<1100;i++){const a=hash('a'+i)*Math.PI*2,y=(hash('y'+i)-.5)*220,r=65+hash('r'+i)*160;dust.push(Math.cos(a)*r,y,Math.sin(a)*r);}const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));starfield=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#a5c9f9',size:.19,transparent:true,opacity:.3,sizeAttenuation:true,depthWrite:false}));scene.add(starfield);
  const selectionGeo=new THREE.RingGeometry(.9,1.0,48);selectionRing=new THREE.Mesh(selectionGeo,new THREE.MeshBasicMaterial({color:'#c9efff',side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));selectionRing.visible=false;scene.add(selectionRing);
  let down=null;
  host.addEventListener('pointerdown',event=>{if(showtimeIndex>=0)stopShowtime(false);down={x:event.clientX,y:event.clientY,time:performance.now()};});
  host.addEventListener('pointerup',event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<6&&performance.now()-down.time<650){const repo=pickRepo(event);if(repo)selectRepo(repo.id,false);else clearSelection();}down=null;});
  host.addEventListener('pointermove',event=>{if(performance.now()-lastHover<35||down)return;lastHover=performance.now();const repo=pickRepo(event);if(state.hovered!==(repo?.id||null)){state.hovered=repo?.id||null;updateAppearance();}host.style.cursor=repo?'pointer':'grab';if(repo){const rect=host.getBoundingClientRect();$('tooltip').innerHTML=`<strong>${escape(repo.name)}</strong><span>${escape(groupMap.get(repo.group).name)} · ${escape(repo.language)}</span>`;$('tooltip').hidden=false;$('tooltip').style.left=Math.max(5,Math.min(rect.width-230,event.clientX-rect.left+16))+'px';$('tooltip').style.top=Math.max(65,Math.min(rect.height-90,event.clientY-rect.top+16))+'px';}else $('tooltip').hidden=true;});
  host.addEventListener('pointerleave',()=>{state.hovered=null;$('tooltip').hidden=true;updateAppearance();});
  renderer.domElement.addEventListener('keydown',event=>{if(['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();flight=null;setOrbit(false);if(event.key==='Home')fitField(true);else if(event.key==='+'||event.key==='=')zoom(.85);else if(event.key==='-')zoom(1.18);else{const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')s.theta-=.12;if(event.key==='ArrowRight')s.theta+=.12;if(event.key==='ArrowUp')s.phi=Math.max(.08,s.phi-.12);if(event.key==='ArrowDown')s.phi=Math.min(Math.PI-.08,s.phi+.12);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();}}});
  resize();
}

function buildField(){
  if(instanced){scene.remove(instanced,glowPoints,lineMesh);instanced.geometry.dispose();instanced.material.dispose();glowPoints.geometry.dispose();glowPoints.material.dispose();lineMesh.geometry.dispose();lineMesh.material.dispose();}
  targets=layoutPositions(state.repos,state.layout).map(p=>new THREE.Vector3(...p));positions=targets.map(p=>p.clone());
  instanced=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshBasicMaterial({color:0xffffff}),state.repos.length);instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);instanced.frustumCulled=false;scene.add(instanced);
  const glowGeo=new THREE.BufferGeometry();glowGeo.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(state.repos.length*3),3));glowGeo.setAttribute('aColor',new THREE.Float32BufferAttribute(new Float32Array(state.repos.length*3),3));glowGeo.setAttribute('aSize',new THREE.Float32BufferAttribute(new Float32Array(state.repos.length),1));
  glowPoints=new THREE.Points(glowGeo,new THREE.ShaderMaterial({uniforms:{uScale:{value:$('scene').clientHeight*.65*renderer.getPixelRatio()}},vertexShader:'attribute vec3 aColor; attribute float aSize; varying vec3 vColor; uniform float uScale; void main(){vColor=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(140.,aSize*uScale/max(1.,-mv.z));}',fragmentShader:'varying vec3 vColor;void main(){float d=length(gl_PointCoord-vec2(.5))*2.;if(d>1.)discard;float a=exp(-d*d*8.)*.55;gl_FragColor=vec4(vColor,a);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glowPoints.frustumCulled=false;scene.add(glowPoints);
  lineMesh=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.43,depthWrite:false}));lineMesh.frustumCulled=false;scene.add(lineMesh);buildEdges();refreshGuides();buildLabels();updateAppearance();updateGeometry();
}
function buildEdges(){
  edges=state.architecture?relationshipEdges(state.repos,state.relationships,state.includeThematic):layoutEdges(state.repos,targets.map(p=>p.toArray()),state.layout);refreshNeighborhood();updateRelationshipUI();
  lineMesh.geometry.dispose();lineMesh.geometry=new THREE.BufferGeometry();lineMesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(edges.length*6),3));lineMesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(edges.length*6),3));lineMesh.visible=state.links;updateAppearance();
}
function refreshGuides(){
  for(const guide of layoutGuides){scene.remove(guide);guide.geometry.dispose();guide.material.dispose();}layoutGuides=[];
  orbitLines.forEach(line=>line.visible=state.layout==='constellation');
  if(state.layout==='orbits')for(const ring of languageOrbits(state.repos)){const points=[];for(let i=0;i<=180;i++){const angle=i/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*ring.radius,ring.y,Math.sin(angle)*ring.radius));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:ring.color,transparent:true,opacity:.23,depthWrite:false}));line.userData.language=ring.language;scene.add(line);layoutGuides.push(line);}
  if(state.layout==='solar'){
    for(const group of GROUPS)for(const radius of [4.5,8.5,13]){
      const points=[];for(let i=0;i<=96;i++){const angle=i/96*Math.PI*2;points.push(new THREE.Vector3(group.center[0]+Math.cos(angle)*radius,group.center[1],group.center[2]+Math.sin(angle)*radius));}
      const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:group.color,transparent:true,opacity:.17,depthWrite:false}));
      ring.userData.solarGroup=group.id;scene.add(ring);layoutGuides.push(ring);
    }
  }
  if(state.layout==='sphere'){const base=new THREE.IcosahedronGeometry(40,1),geometry=new THREE.EdgesGeometry(base);base.dispose();const cage=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#c5b581',transparent:true,opacity:.1,depthWrite:false}));scene.add(cage);layoutGuides.push(cage);}
  updateAppearance();
}
function updateAppearance(){
  if(!instanced)return;
  const colors=glowPoints.geometry.attributes.aColor,sizes=glowPoints.geometry.attributes.aSize;
  state.repos.forEach((r,i)=>{const visible=nodeActive(r.id),selected=r.id===state.selected,hovered=r.id===state.hovered;tempColor.set(repoTint(r));tempColor.multiplyScalar(visible?(selected||hovered?1.4:repoGlow(r)):.065);instanced.setColorAt(i,tempColor);colors.setXYZ(i,tempColor.r,tempColor.g,tempColor.b);sizes.setX(i,(selected||hovered?14:9)*r.radius*(visible?1:.3));});
  instanced.instanceColor.needsUpdate=true;colors.needsUpdate=true;sizes.needsUpdate=true;
  if(lineMesh?.geometry.attributes.color){const arr=lineMesh.geometry.attributes.color;edges.forEach(([a,b],i)=>{const ra=state.repos[a],rb=state.repos[b],visible=nodeActive(ra.id)&&nodeActive(rb.id),selected=ra.id===state.selected||rb.id===state.selected;tempColor.set(state.architecture?RELATIONSHIP_STYLES[edges[i][2]].color:chronological()?'#dfb86d':repoTint(ra)).multiplyScalar(visible?(selected?1:state.architecture?.8:chronological()?.47:.34):.012);arr.setXYZ(i*2,tempColor.r,tempColor.g,tempColor.b);arr.setXYZ(i*2+1,tempColor.r,tempColor.g,tempColor.b);});arr.needsUpdate=true;}
  groupHalos.forEach((h,i)=>{h.material.opacity=state.layout==='constellation'&&(!state.group||state.group===GROUPS[i].id)?.045:0;});
  solarSuns.forEach(({sun,glow,group})=>{const visible=state.layout==='solar'&&state.repos.some(repo=>repo.group===group.id&&state.visible.has(repo.id));sun.visible=glow.visible=visible;});
  layoutGuides.forEach(g=>{if(g.userData.language)g.material.opacity=state.repos.some(r=>r.language===g.userData.language&&state.visible.has(r.id))?.23:.025;if(g.userData.solarGroup)g.visible=state.links&&state.repos.some(r=>r.group===g.userData.solarGroup&&state.visible.has(r.id));});
}
function updateGeometry(){
  const points=glowPoints.geometry.attributes.position,lines=lineMesh.geometry.attributes.position;
  positions.forEach((p,i)=>{const r=state.repos[i],scale=r.radius*(state.visible.has(r.id)?1:.5)*(r.id===state.selected?1.35:1)*(nodeActive(r.id)?1:.65);tempScale.setScalar(scale);tempMatrix.compose(p,new THREE.Quaternion(),tempScale);instanced.setMatrixAt(i,tempMatrix);points.setXYZ(i,p.x,p.y,p.z);});instanced.instanceMatrix.needsUpdate=true;points.needsUpdate=true;
  edges.forEach(([a,b],i)=>{lines.setXYZ(i*2,positions[a].x,positions[a].y,positions[a].z);lines.setXYZ(i*2+1,positions[b].x,positions[b].y,positions[b].z);});lines.needsUpdate=true;
}

function buildLabels(){
  $('labels').replaceChildren();labelNodes=state.repos.map(r=>{const el=document.createElement('div');el.className='node-label'+(featured.includes(r.name)?' featured':'');el.textContent=r.name;$('labels').append(el);return{el,repo:r};});
  const groups=state.layout==='orbits'?languageOrbits(state.repos).map((ring,i)=>{const angle=-2.5+i*.25;return{id:'language-'+ring.language,name:ring.language,short:`${ring.language.toUpperCase()} · ${ring.count}`,color:ring.color,center:[Math.cos(angle)*ring.radius,ring.y-8,Math.sin(angle)*ring.radius],language:ring.language};}):GROUPS;
  clusterLabels=groups.map(g=>{const el=document.createElement('div');el.className='cluster-label';el.textContent=g.short;el.style.color=g.color;$('labels').append(el);return{el,group:g};});
  centerLabel=document.createElement('div');centerLabel.className='center-label';centerLabel.innerHTML='<b>THE FIELD</b>Φ369';$('labels').append(centerLabel);
}
function updateLabels(){
  if(!state.labels)return;
  const w=$('scene').clientWidth,h=$('scene').clientHeight,occupied=[],inspectorVisible=!$('inspector').hidden,inspectorRect=$('inspector').getBoundingClientRect(),sceneRect=$('scene').getBoundingClientRect();
  const caption=document.querySelector('.map-caption').getBoundingClientRect();
  const blocked=(x,y,width)=>y<86||y>h-143||x<60||x+width>w-15||(x+width>caption.left-sceneRect.left-10&&x<caption.right-sceneRect.left+10&&y+14>caption.top-sceneRect.top-10&&y<caption.bottom-sceneRect.top+12)||(inspectorVisible&&x+width>inspectorRect.left-sceneRect.left-12&&x<inspectorRect.right-sceneRect.left+12&&y>inspectorRect.top-sceneRect.top-15&&y<inspectorRect.bottom-sceneRect.top+15);
  const ordered=labelNodes.map((l,i)=>({...l,i,priority:l.repo.id===state.selected?0:l.repo.id===state.hovered?1:state.architecture&&state.selected&&state.neighbors.has(l.repo.id)?2:featured.includes(l.repo.name)?2:3})).sort((a,b)=>a.priority-b.priority);let count=0;
  for(const label of ordered){const {el,repo,i}=label;el.style.display='none';if(!nodeActive(repo.id))continue;const allow=label.priority<3||state.query||state.visible.size<50||camera.position.distanceTo(positions[i])<48;if(!allow||count>42)continue;tempProjection.copy(positions[i]).project(camera);if(tempProjection.z>1||tempProjection.z<-1)continue;const x=(tempProjection.x*.5+.5)*w+9,y=(-tempProjection.y*.5+.5)*h-5,width=repo.name.length*(label.priority===0?6:5.4);if(blocked(x,y,width))continue;const box={x,y,w:width,h:14};if(occupied.some(o=>x<o.x+o.w+10&&x+width>o.x-10&&y<o.y+o.h+5&&y+14>o.y-5))continue;occupied.push(box);el.style.display='';el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;el.classList.toggle('selected',repo.id===state.selected);el.style.color=repo.id===state.selected?'':state.lens==='world'?'':repoTint(repo);count++;}
  for(const {el,group}of clusterLabels){el.style.display='none';if(group.language){if(state.layout!=='orbits'||!state.repos.some(r=>r.language===group.language&&state.visible.has(r.id)))continue;}else if(!['constellation','solar'].includes(state.layout)||(state.group&&state.group!==group.id)||!state.repos.some(r=>r.group===group.id&&state.visible.has(r.id)))continue;tempProjection.set(group.center[0],group.center[1]+(state.layout==='solar'?3.5:11),group.center[2]).project(camera);const x=(tempProjection.x*.5+.5)*w,y=(-tempProjection.y*.5+.5)*h,width=group.short.length*5.5;if(tempProjection.z>1||blocked(x-width/2,y,width)||occupied.some(o=>x-width/2<o.x+o.w+8&&x+width/2>o.x-8&&y<o.y+o.h+14&&y+10>o.y-8))continue;el.style.display='';el.style.left=x+'px';el.style.top=y+'px';occupied.push({x:x-width/2,y,w:width,h:14});}
  tempProjection.set(0,-2,0).project(camera);centerLabel.style.left=((tempProjection.x*.5+.5)*w)+'px';centerLabel.style.top=((-tempProjection.y*.5+.5)*h+12)+'px';centerLabel.style.display=state.selected||state.query||state.group?'none':'';
}

function animate(now){
  requestAnimationFrame(animate);if(document.hidden||contextLost)return;const delta=Math.min(.05,lastTime?(now-lastTime)/1000:.016);lastTime=now;frame++;
  if(flight){const t=reducedMotion?1:Math.min(1,(now-flight.start)/950),e=1-Math.pow(1-t,3);camera.position.lerpVectors(flight.from,flight.to,e);controls.target.lerpVectors(flight.fromTarget,flight.toTarget,e);if(t===1)flight=null;}
  if(state.layout==='solar'&&state.solarMotion&&!reducedMotion&&frame%3===0){
    solarPhase+=delta*2.25;
    const next=solarSystemPositions(state.repos,solarPhase,state.activityNow);
    next.forEach((p,i)=>targets[i].set(...p));
  }
  let changing=false;for(let i=0;i<positions.length;i++)if(positions[i].distanceToSquared(targets[i])>.0001){positions[i].lerp(targets[i],reducedMotion?1:Math.min(1,delta*5));changing=true;}
  if(changing||frame<3||frame%10===0)updateGeometry();
  controls.update(delta);core.rotation.y+=reducedMotion?0:delta*.1;coreGlow.material.opacity=.35+(reducedMotion?0:Math.sin(now*.0006)*.045);
  const index=state.repos.findIndex(r=>r.id===state.selected);selectionRing.visible=index>=0&&state.visible.has(state.selected);if(selectionRing.visible){selectionRing.position.copy(positions[index]);selectionRing.quaternion.copy(camera.quaternion);selectionRing.scale.setScalar(1+(reducedMotion?0:Math.sin(now*.003)*.08));}
  if(frame%3===0)updateLabels();renderer.render(scene,camera);
}
function resize(){
  setSidebar($('sidebar').classList.contains('open'));if(!renderer)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;setCameraOffset();if(glowPoints)glowPoints.material.uniforms.uScale.value=h*.65*renderer.getPixelRatio();
  fitDistance=Math.max(108,98/Math.min(1,w/h));controls.maxDistance=innerWidth<761?340:230;
  if(frame<3)fitField(false);
}
function setCameraOffset(){if(!camera)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;camera.clearViewOffset();if(immersiveActive){camera.updateProjectionMatrix();return;}if(innerWidth<761&&!$('inspector').hidden)camera.setViewOffset(w,h,0,h*(state.architecture?.17:.27),w,h);else if(w>720)camera.setViewOffset(w,h,70,0,w,h);camera.updateProjectionMatrix();}
function fitField(smooth){if(!camera)return;const target=new THREE.Vector3(0,0,0),destination=state.layout==='orbits'||state.layout==='solar'?new THREE.Vector3(0,fitDistance*.72,fitDistance*.98):state.layout==='spiral'?new THREE.Vector3(fitDistance*.24,fitDistance*.16,fitDistance):new THREE.Vector3(0,state.layout==='helix'?6:20,fitDistance);if(smooth&&!reducedMotion)flyTo(destination,target);else{camera.position.copy(destination);controls.target.copy(target);controls.update();}}
function fitMatches(){if(!camera||!state.visible.size)return;setOrbit(false);const points=targets.filter((p,i)=>state.visible.has(state.repos[i].id)),box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),radius=Math.max(3,...points.map(p=>p.distanceTo(center))),distance=THREE.MathUtils.clamp(radius/(Math.sin(camera.fov*Math.PI/360)*Math.min(1,camera.aspect)) * 1.25,20,controls.maxDistance),offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);flyTo(center.clone().add(offset),center);setSidebar(false);}
function flyTo(to,toTarget){if(!camera)return;if(reducedMotion){camera.position.copy(to);controls.target.copy(toTarget);controls.update();return;}flight={from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget,start:performance.now()};}
function zoom(factor){if(!camera)return;setOrbit(false);const offset=camera.position.clone().sub(controls.target),distance=THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);flyTo(controls.target.clone().add(offset.normalize().multiplyScalar(distance)),controls.target.clone());}
function pickRepo(event){if(!camera)return null;const rect=$('scene').getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let best=null,distance=14;for(let i=0;i<state.repos.length;i++){const repo=state.repos[i];if(!state.visible.has(repo.id))continue;tempProjection.copy(positions[i]).project(camera);if(tempProjection.z>1||tempProjection.z<-1)continue;const px=(tempProjection.x*.5+.5)*rect.width,py=(-tempProjection.y*.5+.5)*rect.height,d=Math.hypot(x-px,y-py);if(d<distance){distance=d;best=repo;}}return best;}
function selectRepo(id,focus=true,closeMenu=true){if(immersiveActive)exitImmersive(false);if(showtimeIndex>=0)stopShowtime(false);const repo=state.repos.find(r=>r.id===id);if(!repo)return;if(state.trail&&state.trail.stops[state.trailStop]?.id!==id)stopTrail();state.selected=id;const before=state.quest.discoveredIds.length;state.quest=discover(state.quest,repo,state.repos);if(state.quest.discoveredIds.length!==before){saveQuest(false);if(state.lens==='quest'&&sceneReady)updateAppearance();}state.passport=recordVisit(state.passport,repo,state.repos);savePassport(false);updatePassportCount();if($('questDialog').open)renderQuest();refreshNeighborhood();updateRelationshipUI();try{history.replaceState(null,'',withoutPostcard(state.trail?trailLink(location.href,state.trail,state.trailStop):withoutTrail(projectLink(location.href,repo))));}catch{}$('inspector').hidden=false;showInspector(repo,false);updateTrailHud();updateAppearance();renderSidebarIndex();if(sceneReady&&focus){setOrbit(false);const p=targets[state.repos.indexOf(repo)],offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(innerWidth<761?48:34);flyTo(p.clone().add(offset),p.clone());}if(sceneReady&&focus&&state.architecture&&state.neighbors.size>1)fitConnections();if(innerWidth<761&&closeMenu)setSidebar(false);}
function clearSelection(){stopTrail();state.selected=null;refreshNeighborhood();updateRelationshipUI();try{history.replaceState(null,'',withoutPostcard(withoutTrail(projectLink(location.href,null))));}catch{}$('inspector').hidden=true;setCameraOffset();if(sceneReady)updateAppearance();renderSidebarIndex();}

/**
 * Curated trails are visitor tours only. They are deliberately independent of
 * the sourced Relationships layer and never imply code dependencies.
 */
function renderTrails(){
  const trails=availableTrails(state.repos);
  $('trailChoices').innerHTML=trails.length?trails.map(t=>`<button class="trail-choice" data-trail="${escape(t.id)}"><strong>${escape(t.title)}</strong><span>${escape(t.description)}</span><small>${t.stops.length} public stops · ${escape(t.stops.map(r=>r.name).join(' → '))}</small></button>`).join(''):'<p>No curated trails are available in the current public snapshot. The regular directory is still usable.</p>';
  document.querySelectorAll('[data-trail]').forEach(button=>button.onclick=()=>startTrail(button.dataset.trail));
}
function startTrail(id){
  const trail=availableTrails(state.repos).find(t=>t.id===id);
  if(!trail)return;
  $('trailsDialog').close();
  resetFilters();
  state.trail=trail;state.trailStop=0;
  try{history.pushState(null,'',trailLink(location.href,trail,0));}catch{}
  selectRepo(trail.stops[0].id,true);
  updateTrailHud();
}
function moveTrail(offset){
  if(!state.trail)return;
  const next=state.trailStop+offset;
  if(next<0||next>=state.trail.stops.length)return;
  try{history.pushState(null,'',trailLink(location.href,state.trail,next));}catch{}
  state.trailStop=next;
  selectRepo(state.trail.stops[next].id,true);
}
function stopTrail(){
  state.trail=null;state.trailStop=0;
  document.body.classList.remove('trail-on');
  $('trailHud').hidden=true;
  $('trailShareFallback').hidden=true;
  try{
    const url=new URL(location.href);
    if(url.searchParams.has('trail')||url.searchParams.has('stop'))history.replaceState(null,'',withoutTrail(location.href));
  }catch{}
}
async function copyTrailLink(){
  if(!state.trail)return;
  const href=trailLink(location.href,state.trail,state.trailStop);
  try{await navigator.clipboard.writeText(href);toast('Journey stop link copied.');}
  catch{
    const fallback=$('trailShareFallback');
    fallback.value=href;fallback.hidden=false;fallback.focus();fallback.select();
    toast('Copy the selected journey link.');
  }
}
function updateTrailHud(){
  const trail=state.trail;
  $('trailHud').hidden=!trail;
  document.body.classList.toggle('trail-on',!!trail);
  if(!trail)return;
  const stop=trail.stops[state.trailStop];
  $('trailTitle').textContent=trail.title;
  $('trailProgress').textContent=`${state.trailStop+1} of ${trail.stops.length}`;
  $('trailStopName').textContent=stop.name;
  $('trailShareFallback').hidden=true;
  $('trailPrev').disabled=state.trailStop===0;
  $('trailNext').disabled=state.trailStop===trail.stops.length-1;
}

function relationshipCards(repo){
  if(!state.relationshipLedger)return '<section class="related-projects"><h3>Related worlds</h3><p class="discovery-note">Relationship evidence could not load. Reload the page to review sourced connections; the public repository directory remains available.</p></section>';
  const related=relatedProjects(repo,state.relationships);
  let content=related.map(({relation:r,repo:other,direction})=>`<section class="relation-card"><div class="relation-heading"><button data-related="${escape(other.id)}">${escape(other.name)} ↗</button><span class="relation-status ${r.status}">${RELATIONSHIP_STYLES[r.status].label}</span></div><small>${direction} · ${RELATIONSHIP_KINDS[r.kind]}</small><p>${escape(r.summary)}</p><details><summary>Evidence & scope</summary><p>${escape(r.scope)}</p>${r.evidence.map((e,i)=>`<a href="${escape(e.url)}" target="_blank" rel="noopener noreferrer">Source ${i+1}: ${escape(e.claim)} ↗</a>`).join('')}<small>Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}</small></details></section>`).join('');
  if(!related.length)content='<p class="discovery-note">No sourced connections are recorded for this project in this milestone. This is a scoped review, not proof of no connections.</p>';
  if(state.architecture&&state.includeThematic){
    const index=state.repos.findIndex(r=>r.id===repo.id),peers=edges.filter(e=>e[2]==='conceptual'&&(e[0]===index||e[1]===index)).map(e=>state.repos[e[0]===index?e[1]:e[0]]);
    content+=peers.map(other=>`<section class="relation-card conceptual"><button data-related="${escape(other.id)}">${escape(other.name)} ↗</button><span class="relation-status conceptual">Thematic association</span><p>Same curated world, neighboring names in the browse order. Editorial navigation only; no code dependency is claimed.</p></section>`).join('');
  }
  return `<section class="related-projects"><h3>Related worlds <span>${related.length} sourced</span></h3>${content}</section>`;
}
function showInspector(repo,spotlight){
  if(!repo)return;const changed=$('inspector').dataset.repo!==repo.id;$('inspector').dataset.repo=repo.id;
  const g=groupMap.get(repo.group),url=safeUrl(repo.url),destination=destinationStatus(repo,state.deployments),updated=repo.updated?new Date(repo.updated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Not available',created=repo.created?new Date(repo.created).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Not available',size=repo.size<1024?repo.size.toLocaleString()+' KB':(repo.size/1024).toFixed(1)+' MB',days=Math.floor(ageInDays(repo)),atlas=atlasLink(state.atlas,repo),hasChapter=state.atlas?.chapters?.includes(projectId(repo)),published=publishedAtlasLink(state.atlasPublished,state.repos,repo),publishedSite=publishedAtlasWebsite(state.atlasPublished,state.repos,repo);
  $('inspectorCaption').textContent=spotlight?'IN THE SPOTLIGHT':'A POINT IN THE FIELD';
  $('inspectorContent').innerHTML=`<div class="inspector-body" style="--repo-color:${repoTint(repo)}"><div class="repo-orb" aria-hidden="true"></div><div class="repo-category"><i></i>${escape(g.name)}</div><h2>${escape(repo.name)}</h2><p class="repo-description" title="${escape(repo.description)}">${escape(repo.description||'No description has been added on GitHub yet. Explore the repository to see what is taking shape.')}</p><div class="repo-tags"><span>${escape(repo.language)}</span><span>Public</span>${repo.pages?'<span>Pages enabled</span>':''}${repo.fork?'<span>Fork</span>':''}${state.quest.discoveredIds.includes(projectId(repo))?'<span>Quest: discovered</span>':''}${repo.archived?'<span class="archived-badge">Archived</span>':''}${hasChapter?'<span class="atlas-reviewed-tag">In reviewed Atlas</span>':''}${published?'<span class="atlas-published-tag">Atlas public Pages inventory</span>':''}</div>${repo.topics.length?`<div class="repo-topics" aria-label="Repository topics">${repo.topics.slice(0,16).map(t=>`<span>${escape(t)}</span>`).join('')}</div>`:''}${relatedProjects(repo,state.relationships).length?'<button id="traceProject" class="trace-project" title="Clears search and filters to show directly connected projects">Trace this world’s connections ↗</button>':''}<dl class="repo-meta"><div><dt>Stars</dt><dd>${repo.stars.toLocaleString()}</dd></div><div><dt>License</dt><dd>${escape(repo.license&&repo.license!=='NOASSERTION'?repo.license:'Not specified')}</dd></div><div><dt>Repository size</dt><dd>${size}</dd></div><div><dt>Forks</dt><dd>${repo.forks.toLocaleString()}</dd></div><div class="wide"><dt>Last code push</dt><dd>${updated} · ${Number.isFinite(days)?days===0?'today':days+'d ago':'date unavailable'}</dd></div></dl><section class="destination-state ${destination.state}"><b>${destination.label}</b><p>${escape(destination.detail)}</p>${destination.check?.checkedAt?`<small>Checked ${new Date(destination.check.checkedAt).toLocaleString()}</small>`:''}</section><div class="repo-links">${destination.url?`<a href="${escape(destination.url)}" target="_blank" rel="noopener noreferrer">Explore This World ${svg('arrow')}</a>`:''}${!destination.url&&publishedSite?`<a href="${escape(publishedSite)}" target="_blank" rel="noopener noreferrer" title="Published HTML verified by the dated Field Atlas manifest; app controls and VR are not tested">Open Atlas-listed website ${svg('arrow')}</a>`:''}${url?`<a class="secondary" href="${escape(url)}" target="_blank" rel="noopener noreferrer"><span>View on GitHub</span>${svg('github')}</a>`:''}${atlas?`<a class="secondary" href="${escape(hasChapter?atlas:published||atlas)}" target="_blank" rel="noopener noreferrer">${hasChapter?'Read in Field Atlas':published?'Find published Atlas project':'Visit Field Atlas'} ${svg('arrow')}</a>`:''}<button class="secondary" id="passportToggle" aria-pressed="${state.passport.favoriteIds.includes(projectId(repo))}">${state.passport.favoriteIds.includes(projectId(repo))?'★ Saved in Passport':'☆ Save to Passport'}</button><button class="secondary" id="shareProject">Copy project link ${svg('arrow')}</button><input id="shareFallback" class="share-fallback" aria-label="Project permalink" readonly hidden value="${escape(projectLink(location.href,repo))}"></div>${destination.candidate&&!destination.url?`<a class="unverified-link" href="${escape(destination.candidate)}" target="_blank" rel="noopener noreferrer">Declared destination · unverified ↗</a>`:''}<details class="repo-facts"><summary>Repository facts & documentation <span>+</span></summary><dl><div><dt>Created</dt><dd>${created}</dd></div><div><dt>Open issues / PRs</dt><dd>${repo.issues==null?'Not available':repo.issues.toLocaleString()}</dd></div><div><dt>GitHub Pages flag</dt><dd>${repo.pages?'Enabled; availability checked separately':'Not enabled'}</dd></div><div><dt>Default branch</dt><dd>${escape(repo.branch)}</dd></div></dl><a href="${escape(repo.url+'#readme')}" target="_blank" rel="noopener noreferrer">Repository README ↗</a><p class="project-identity">${escape(projectId(repo))}</p><small>Repository facts: public GitHub snapshot, ${new Date(state.publicUpdated||state.snapshot.fetchedAt).toLocaleString()}.</small></details>${relationshipCards(repo)}</div><div class="inspector-footer"><span>${spotlight?'ONE OF '+state.repos.length+' PUBLIC WORLDS':'KEEP EXPLORING'}</span><button id="surprise">Another world ↗</button></div>`;
  if(changed)$('inspector').scrollTop=0;
  $('surprise').onclick=()=>{const available=state.repos.filter(r=>state.visible.has(r.id)&&r.id!==repo.id);if(available.length)selectRepo(available[Math.floor(Math.random()*available.length)].id,true);else toast('This is the only world matching your filters.');};
  if($('traceProject'))$('traceProject').onclick=()=>{resetFilters();setArchitecture(true);selectRepo(repo.id,true,false);};
  $('passportToggle').onclick=()=>{state.passport=toggleFavorite(state.passport,repo,state.repos);savePassport();updatePassportCount();showInspector(repo,spotlight);};
  $('shareProject').onclick=async()=>{try{await navigator.clipboard.writeText(projectLink(location.href,repo));toast('Project link copied.');}catch{$('shareFallback').hidden=false;$('shareFallback').focus();$('shareFallback').select();toast('Copy the selected project link.');}};
  document.querySelectorAll('[data-related]').forEach(button=>button.onclick=()=>{resetFilters();setArchitecture(true);selectRepo(button.dataset.related,true);});
  setCameraOffset();
}


/** Visitor-owned, local-first favorites; only known public GitHub IDs are stored. */
function savePassport(notify=true){
  try{localStorage.setItem(PASSPORT_KEY,JSON.stringify(state.passport));return true;}
  catch{if(notify)toast('Browser storage is unavailable. Passport changes last only until this page closes.');return false;}
}
function updatePassportCount(){
  $('passportCount').textContent=String(state.passport.favoriteIds.length);
  updateQuestCount();
  $('passportButton').setAttribute('aria-label','Open Field Passport: '+state.passport.favoriteIds.length+' saved worlds');
}

/** Local-first game state, intentionally unrelated to builds or merge authority. */
function saveQuest(notify=true){
  try{localStorage.setItem(QUEST_KEY,JSON.stringify(state.quest));return true;}
  catch{if(notify)toast('Quest progress is session-only: browser storage is unavailable.');return false;}
}
function updateQuestCount(){
  const n=state.quest.discoveredIds.length;
  $('questCount').textContent=String(n);
  $('questButton').setAttribute('aria-label','Open Infinite Tinkerer Quest RPG: '+n+' discoveries');
}
function renderQuest(){
  const p=questProgress(state.repos,state.quest,state.passport,state.relationships);
  $('questSummary').innerHTML=
    '<div class="quest-stat"><strong>'+p.total+' / '+p.available+'</strong><span>Discovered public worlds</span></div>'+
    '<div class="quest-stat"><strong>'+p.experience+' XP</strong><span>Exploration XP (game only)</span></div>'+
    '<div class="quest-stat"><strong>'+p.rank.name+'</strong><span>Current quest title</span></div>'+
    '<div class="quest-stat"><strong>'+p.saved+'</strong><span>Passport bookmarks</span></div>'+
    '<div class="quest-rank-progress"><div><span>Next milestone</span><b>'+(p.next?p.next.at+' worlds · '+escape(p.next.name):'All ranks discovered')+'</b></div>'+
    '<progress max="'+(p.next?p.next.at:Math.max(1,p.total))+'" value="'+p.total+'"></progress></div>';
  $('questLensButton').textContent=state.lens==='quest'?'Return to world colors':'Show discoveries on map';
  const ms=missionProgress(state.repos,state.missionSave);
  $('missionJournalStatus').textContent='THE NINE GATES · '+ms.cleared+'/'+ms.total+' gates cleared · '+ms.xp+' mission XP. Challenge choices teach what public repositories really do, and what they cannot yet do.';
  const outer=outerProgress(state.repos,state.missionSave,state.outerSave);
  $('outerJournalStatus').textContent=outer.unlocked?'THE OUTER FIELD · '+outer.cleared+'/9 encounters · '+outer.xp+' game XP · '+(outer.finished?'Infinite Spiral unlocked':'Artifact hunts, combinations, hidden worlds and boss phases'):'THE OUTER FIELD · Locked until all nine original gates are cleared.';
  $('questTree').innerHTML=GROUPS.map(group=>{
    const b=p.branches.find(branch=>branch.group===group.id)||{total:0,discovered:0,saved:0,next:null};
    const full=b.total>0&&b.discovered===b.total;
    return '<section class="quest-branch'+(full?' complete':'')+'" style="--quest-color:'+group.color+'">'+
      '<div class="quest-branch-title"><i aria-hidden="true"></i><strong>'+escape(group.name)+'</strong><span>'+b.discovered+' / '+b.total+'</span></div>'+
      '<progress max="'+Math.max(1,b.total)+'" value="'+b.discovered+'" aria-label="'+escape(group.name)+' discovery progress"></progress>'+
      '<p>'+b.saved+' bookmarked · '+(full?'Branch explored':'More stars await')+'</p>'+
      (b.next?'<button type="button" data-quest-repo="'+escape(b.next.id)+'">Discover '+escape(b.next.name)+' →</button>':'<span class="quest-complete">All available stars discovered</span>')+'</section>';
  }).join('');
  $('questAchievements').innerHTML=p.achievements.map(a=>
    '<div class="quest-achievement'+(a.unlocked?' unlocked':'')+'"><span aria-hidden="true">'+(a.unlocked?'✦':'◇')+'</span><div><strong>'+escape(a.name)+'</strong><small>'+escape(a.detail)+'</small></div><b>'+(a.unlocked?'Unlocked':'Locked')+'</b></div>'
  ).join('');
  document.querySelectorAll('[data-quest-repo]').forEach(button=>button.onclick=()=>{
    $('questDialog').close();resetFilters();selectRepo(button.dataset.questRepo,true);
  });
}


/** The Nine Gates stores only reviewed mission identifiers in this browser. */
function saveMissionProgress(notify=true){
  try{localStorage.setItem(MISSION_KEY,JSON.stringify(state.missionSave));return true;}
  catch{if(notify)toast('Mission save is session-only: browser storage is unavailable.');return false;}
}
function renderMissions(){
  const progress=missionProgress(state.repos,state.missionSave);
  const reviewed=progress.missions.find(m=>m.id===state.missionReview&&progress.completedIds.includes(m.id));
  const current=reviewed||progress.current;
  $('missionProgress').innerHTML='<div><strong>'+progress.cleared+' / '+progress.total+'</strong><span>Gates cleared</span></div>'+
    '<div><strong>'+progress.xp+' XP</strong><span>Mission XP · game only</span></div>'+
    '<div><strong>'+escape(progress.finished?'The Field Awaits':current?.actTitle||'No gates')+'</strong><span>'+(progress.finished?'All available gates cleared':'Current chapter')+'</span></div>';
  $('missionChapters').innerHTML=progress.chapters.map(chapter=>'<div class="mission-chapter'+(chapter.total>0&&chapter.cleared===chapter.total?' cleared':'')+'"><small>ACT '+chapter.act+'</small><strong>'+escape(chapter.title||'Unavailable')+'</strong><span>'+chapter.cleared+' / '+chapter.total+' gates</span></div>').join('');
  $('missionNext').hidden=!reviewed;
  $('missionNext').textContent=progress.current?'Continue to gate '+(progress.cleared+1)+' →':'See your victory →';
  $('missionFeedback').textContent=state.missionFeedback;
  $('missionFeedback').classList.toggle('success',!!reviewed);
  if(!current){
    $('missionEncounter').innerHTML='<div class="mission-victory"><h3>All nine gates cleared.</h3><p>You have explored nine real project ideas across three chapters. A new adventure now waits beyond the constellation.</p><div class="outer-portal-graphic" aria-hidden="true"><span>Φ</span></div><button id="missionOuter" class="outer-portal-button" type="button">Enter The Outer Field →</button><button id="missionMapReturn" type="button">Return to the living map</button></div>';
    $('missionMapReturn').onclick=()=>{$('missionDialog').close();};
    $('missionOuter').onclick=()=>openOuter('missionDialog');
    return;
  }
  const isDone=progress.completedIds.includes(current.id);
  const answer=current.answerRepo;
  $('missionEncounter').innerHTML='<p class="mission-kicker">ACT '+current.act+' · '+escape(current.actTitle)+' · GATE '+(progress.missions.indexOf(current)+1)+' OF '+progress.total+'</p>'+
    '<h3>'+escape(current.title)+'</h3><p class="mission-scene">'+escape(current.scene)+'</p><strong class="mission-question">'+escape(current.prompt)+'</strong>'+
    (isDone?'<div class="mission-cleared"><strong>GATE CLEARED · '+escape(current.reward)+'</strong><p>'+escape(current.lesson)+'</p>'+
      '<div class="mission-cleared-actions"><a href="'+escape(answer.url+'#readme')+'" target="_blank" rel="noopener noreferrer">Read '+escape(answer.name)+' on GitHub ↗</a><button id="missionTravel" data-mission-travel="'+escape(answer.id)+'" type="button">Travel to '+escape(answer.name)+' in the Field →</button></div></div>':
      '<div class="mission-options" role="group" aria-label="Choose a project for this mission">'+current.optionRepos.map(repo=>
        '<button type="button" data-mission-option="'+escape(repo.name)+'">'+escape(repo.name)+'<span aria-hidden="true">→</span></button>').join('')+'</div>'+
      '<p class="mission-help">Explore a real project choice. Wrong answers give a hint without losing XP.</p>');
  if(isDone){
    $('missionTravel').onclick=()=>{$('missionDialog').close();resetFilters();selectRepo(answer.id,true);};
  }else{
    document.querySelectorAll('[data-mission-option]').forEach(button=>button.onclick=()=>{
      const result=attemptMission(state.repos,state.missionSave,current.id,button.dataset.missionOption);
      if(!result.accepted)return;
      if(result.correct){
        state.missionSave=result.save;saveMissionProgress();state.missionReview=current.id;
        state.missionFeedback='Gate cleared! +30 mission XP. '+current.reward+' unlocked.';
      }else state.missionFeedback='Not quite. '+current.hint;
      renderMissions();
    });
  }
}

/** Read-only fiction with local, whitelisted progress. Never software authority. */
function saveOuter(notify=true){
  try{localStorage.setItem(OUTER_KEY,JSON.stringify(state.outerSave));return true;}
  catch{if(notify)toast('Outer Field progress is session-only because browser storage is unavailable.');return false;}
}
function openOuter(fromDialog){
  $(fromDialog).close();
  state.outerReview=null;state.outerFeedback='';
  renderOuter();
  $('outerDialog').showModal();
}
function enterInfiniteSpiral(){
  $('outerDialog').close();
  resetFilters();
  setLayout('spiral');
  const home=state.repos.find(repo=>repo.name==='FieldConstellation'&&repo.visibility==='public');
  if(home)selectRepo(home.id,true);
  const arrival=$('spiralArrival');arrival.hidden=false;
  setTimeout(()=>{arrival.hidden=true;},2800);
  toast('The Infinite Spiral awaits. Revisit the stars with everything you learned.');
}
function renderOuter(){
  const p=outerProgress(state.repos,state.missionSave,state.outerSave);
  const reviewed=p.steps.find(step=>step.id===state.outerReview&&p.completedIds.includes(step.id));
  const step=reviewed||p.current;
  const groups=[
    {name:'Artifact Hunts',ids:['artifact-atlas','artifact-memory','artifact-guild']},
    {name:'Combination Forge',ids:['combination-bookmap','combination-mind']},
    {name:'Hidden World',ids:['hidden-wrist']},
    {name:'The Fracture Warden',ids:['warden-safety','warden-authority','warden-convergence']}
  ];
  $('outerLedger').innerHTML='<div><strong>'+p.cleared+'/9</strong><small>Encounters cleared</small></div>'+
    '<div><strong>'+p.xp+' / '+p.maximum+' XP</strong><small>Adventure XP · game only</small></div>'+
    '<div><strong>'+p.relics.length+' / 4</strong><small>Collected story artifacts</small></div>'+
    '<div><strong>'+p.bossHealth+' / 3</strong><small>Warden shields remaining</small></div>';
  $('outerTrack').innerHTML=groups.map(group=>{
    const completed=group.ids.filter(id=>p.completedIds.includes(id)).length;
    return '<div class="outer-track-segment'+(completed===group.ids.length?' cleared':'')+'"><strong>'+escape(group.name)+'</strong><span>'+completed+' / '+group.ids.length+'</span><progress max="'+group.ids.length+'" value="'+completed+'" aria-label="'+escape(group.name)+' progress"></progress></div>';
  }).join('');
  $('outerFeedback').textContent=state.outerFeedback;
  $('outerFeedback').classList.toggle('success',!!reviewed);
  $('outerNext').hidden=!reviewed;
  $('outerNext').textContent=p.finished?'Open the Infinite Spiral →':'Continue adventure →';
  if(!p.unlocked){
    $('outerNext').hidden=true;
    $('outerEncounter').innerHTML='<div class="outer-locked"><span class="outer-gate-mark" aria-hidden="true">◇</span><h3>The Outer Field is sealed</h3><p>Finish all nine gates of the original campaign to open this world. No data or progress has been lost.</p><button id="outerBackGates" type="button">Play The Nine Gates →</button></div>';
    $('outerBackGates').onclick=()=>{$('outerDialog').close();state.missionReview=null;state.missionFeedback='';renderMissions();$('missionDialog').showModal();};
    return;
  }
  if(!p.available){
    $('outerNext').hidden=true;
    $('outerEncounter').innerHTML='<div class="outer-locked"><h3>Some public worlds are unavailable</h3><p>This adventure requires a complete public repository catalog. No private or missing repository will be surfaced as a quest choice. Try the public refresh on the map.</p></div>';
    return;
  }
  if(p.finished&&!reviewed){
    $('outerEncounter').innerHTML='<div class="outer-victory"><p class="outer-chapter">THE INFINITE SPIRAL · UNLOCKED</p><h3>The field was never broken.</h3><p>It was always waiting for someone to see how its pieces fit. The Fracture Warden is defeated, the World Key is yours, and a new route through the living constellation is open.</p><div class="outer-portal-graphic outer-portal-large" aria-hidden="true"><span>Φ</span></div><button id="outerPortal" class="outer-portal-button" type="button">Enter the Infinite Spiral →</button><small>Returns to the existing 3D map in spiral view. No repository integrations or permissions are changed.</small></div>';
    $('outerPortal').onclick=enterInfiniteSpiral;
    return;
  }
  if(!step){
    $('outerEncounter').innerHTML='<div class="outer-locked"><h3>Choose your next constellation</h3><p>The current public snapshot cannot resolve an encounter. No new private information is loaded.</p></div>';
    return;
  }
  const solved=p.completedIds.includes(step.id);
  const phase=step.kind==='boss'?' · SHIELD '+step.phase+' / 3':'';
  const lore='<p class="outer-chapter">'+escape(step.chapter.toUpperCase())+phase+' · ENCOUNTER '+(p.steps.indexOf(step)+1)+' / 9</p>'+
    '<h3>'+escape(step.title)+'</h3><p class="outer-scene">'+escape(step.scene)+'</p><strong class="outer-question">'+escape(step.question)+'</strong>';
  const sources=step.sourceRepos.map(repo=>'<a href="'+escape(repo.url+'#readme')+'" target="_blank" rel="noopener noreferrer">Read '+escape(repo.name)+' README ↗</a>').join('');
  if(solved){
    $('outerEncounter').innerHTML=lore+'<div class="outer-reward"><p>ENCOUNTER CLEARED · +'+step.xp+' GAME XP</p><h4>'+escape(step.reward)+'</h4><p>'+escape(step.lesson)+'</p><div class="outer-source-links">'+sources+'</div></div>';
    return;
  }
  const readyToClaim=!!step.visitRepo&&state.outerNeedVisit===step.visit&&state.quest.discoveredIds.includes(projectId(step.visitRepo));
  const options=step.choices.map(([id,label])=>
    '<button type="button" data-outer-choice="'+escape(id)+'"><span>'+escape(label)+'</span><span aria-hidden="true">→</span></button>').join('');
  let visitAction='';
  if(readyToClaim)visitAction='<button id="outerClaim" type="button" class="outer-claim">Claim '+escape(step.reward)+' from your discovered star →</button>';
  else if(state.outerNeedVisit===step.visit&&step.visitRepo)visitAction='<button id="outerTravel" type="button" class="outer-travel">Travel to '+escape(step.visitRepo.name)+' on the map →</button>';
  const clue=step.kind==='artifact'?'Answer the clue, then explore the actual project star before claiming your artifact.':step.kind==='secret'?'This secret can only be claimed after visiting its hidden real-project star.':step.kind==='combination'?'Choose complementary project roles. A pairing is an idea, not proof of a live integration.':'Defeat the phase with what you learned. The battle is fiction.';
  $('outerEncounter').innerHTML=lore+'<div class="outer-options" role="group" aria-label="Choose how to resolve this encounter">'+options+'</div>'+
    '<p class="outer-clue">'+escape(clue)+'</p>'+visitAction+
    (step.visitRepo?'<p class="outer-source-note">A correct discovery will ask you to visit a real public repository star and return here.</p>':'');
  document.querySelectorAll('[data-outer-choice]').forEach(button=>button.onclick=()=>{
    const result=attemptOuter(state.repos,state.missionSave,state.outerSave,state.quest,step.id,button.dataset.outerChoice);
    if(!result.accepted)return;
    if(result.reason==='wrong'){
      state.outerFeedback='Not quite. '+step.hint;
    }else if(result.reason==='visit-required'){
      state.outerNeedVisit=step.visit;
      state.outerFeedback='Correct world! Explore '+result.visitRepo.name+' in the constellation to attune the artifact, then return here to claim it.';
    }else if(result.reason==='cleared'){
      state.outerSave=result.save;saveOuter();state.outerReview=step.id;state.outerNeedVisit=null;
      state.outerFeedback='Encounter cleared! '+step.reward+' · +'+step.xp+' adventure XP.';
    }
    renderOuter();
  });
  if($('outerTravel'))$('outerTravel').onclick=()=>{
    $('outerDialog').close();resetFilters();selectRepo(step.visitRepo.id,true);
    toast('Star discovered. Open Quest RPG → The Outer Field to claim your artifact.');
  };
  if($('outerClaim'))$('outerClaim').onclick=()=>{
    const result=attemptOuter(state.repos,state.missionSave,state.outerSave,state.quest,step.id,step.correct);
    if(result.reason==='cleared'){
      state.outerSave=result.save;saveOuter();state.outerReview=step.id;state.outerNeedVisit=null;
      state.outerFeedback='Artifact attuned! '+step.reward+' · +'+step.xp+' adventure XP.';
      renderOuter();
    }
  };
}

function passportRows(ids,emptyText){
  const repos=passportRepos(ids,state.repos);
  if(!repos.length)return '<p class="passport-empty">'+escape(emptyText)+'</p>';
  return repos.map(repo=>'<button class="passport-row" data-passport-repo="'+escape(repo.id)+'"><span class="passport-mark">✳</span><span class="passport-row-copy"><strong>'+escape(repo.name)+'</strong><small>'+escape(groupMap.get(repo.group)?.name||'Public world')+'</small></span><span aria-hidden="true">↗</span></button>').join('');
}

/** Composer selects from already saved public favorites; opening a link never saves. */
function renderPostcard(){
  const incoming=state.postcardView;
  const allFavorites=passportRepos(state.passport.favoriteIds,state.repos);
  $('postcardHeading').textContent=incoming?'A Field Postcard Arrived':'Make a Field Postcard';
  $('postcardDescription').textContent=incoming?
    'Someone shared these public worlds. Explore any one, or choose to save them to your own Passport. Nothing is stored automatically.':
    'Choose up to eight of your saved public worlds to share. The link contains public repository IDs only, never recent visits.';
  $('postcardCopy').hidden=!!incoming;
  $('postcardSave').hidden=!incoming;
  $('postcardUrlFallback').hidden=true;
  $('postcardStatus').textContent='';
  if(incoming){
    $('postcardCount').textContent=incoming.worlds.length+' public worlds available';
    $('postcardOmitted').textContent=incoming.omitted?incoming.omitted+' unavailable project ID(s) were omitted. No private details were fetched.':'';
    $('postcardList').innerHTML=incoming.worlds.map(repo=>'<button class="postcard-world" data-postcard-world="'+escape(repo.id)+'"><span class="postcard-symbol" aria-hidden="true">✳</span><span class="postcard-row-copy"><strong>'+escape(repo.name)+'</strong><small>'+escape(groupMap.get(repo.group)?.name||'Public project')+'</small></span><span aria-hidden="true">↗</span></button>').join('');
    $('postcardSave').disabled=incoming.ids.every(id=>state.passport.favoriteIds.includes(id));
    document.querySelectorAll('[data-postcard-world]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.postcardWorld;
      $('postcardDialog').close();state.postcardView=null;
      resetFilters();selectRepo(id,true);
    });
  }else{
    $('postcardOmitted').textContent='';
    $('postcardCount').textContent=state.postcardDraft.length+' of '+MAX_POSTCARD_WORLDS+' worlds selected';
    $('postcardCopy').disabled=!state.postcardDraft.length;
    $('postcardList').innerHTML=allFavorites.length?allFavorites.map(repo=>{
      const id=projectId(repo),checked=state.postcardDraft.includes(id);
      return '<label class="postcard-world postcard-choice"><input type="checkbox" data-postcard-choice="'+escape(id)+'" '+(checked?'checked':'')+'><span class="postcard-row-copy"><strong>'+escape(repo.name)+'</strong><small>'+escape(groupMap.get(repo.group)?.name||'Public project')+'</small></span></label>';
    }).join(''):'<p class="passport-empty">Save a public world to your Passport first.</p>';
    document.querySelectorAll('[data-postcard-choice]').forEach(input=>input.onchange=()=>{
      const id=input.dataset.postcardChoice;
      if(input.checked){
        if(state.postcardDraft.length>=MAX_POSTCARD_WORLDS){input.checked=false;toast('A postcard holds up to eight worlds.');return;}
        if(!state.postcardDraft.includes(id))state.postcardDraft.push(id);
      }else state.postcardDraft=state.postcardDraft.filter(x=>x!==id);
      $('postcardCount').textContent=state.postcardDraft.length+' of '+MAX_POSTCARD_WORLDS+' worlds selected';
      $('postcardCopy').disabled=!state.postcardDraft.length;
      $('postcardUrlFallback').hidden=true;
    });
  }
}
async function copyPostcard(){
  if(!state.postcardDraft.length)return;
  let href;
  try{href=buildPostcardLink(location.href,state.postcardDraft,state.repos);}
  catch(error){toast(error.message);return;}
  try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(href);
    $('postcardStatus').textContent='Field Postcard link copied. Ready to share!';
  }catch{
    const input=$('postcardUrlFallback');
    input.value=href;input.hidden=false;input.focus();input.select();
    $('postcardStatus').textContent='Select and copy the link above.';
  }
}
function saveReceivedPostcard(){
  if(!state.postcardView)return;
  const outcome=savePostcardFavorites(state.passport,state.postcardView.ids,state.repos);
  state.passport=outcome.passport;savePassport();updatePassportCount();
  renderPostcard();
  toast(outcome.saved+' world(s) added to your Passport.'+(outcome.skipped?' Passport is full for '+outcome.skipped+' world(s).':''));
}

function renderPassport(){
  $('passportFavorites').innerHTML=passportRows(state.passport.favoriteIds,'No favorites yet. Open a project and save it to your Passport.');
  $('passportRecent').innerHTML=passportRows(state.passport.recentIds,'Your recently explored worlds will appear here.');
  $('passportSummary').textContent=state.passport.favoriteIds.length+' saved worlds · '+state.passport.recentIds.length+' recently visited';
  $('passportExport').disabled=state.passport.favoriteIds.length===0;
  $('passportClearFavorites').disabled=state.passport.favoriteIds.length===0;
  $('passportClearRecent').disabled=state.passport.recentIds.length===0;
  $('postcardComposer').disabled=state.passport.favoriteIds.length===0;
  document.querySelectorAll('[data-passport-repo]').forEach(button=>button.onclick=()=>{
    $('passportDialog').close();resetFilters();selectRepo(button.dataset.passportRepo,true);
  });
}
function clearPassport(section){
  const label=section==='favoriteIds'?'saved worlds':'recent history';
  if(!confirm('Clear all '+label+' from this browser?'))return;
  state.passport=clearPassportSection(state.passport,section,state.repos);
  savePassport();updatePassportCount();renderPassport();
  if(!$('inspector').hidden){const repo=state.repos.find(r=>r.id===$('inspector').dataset.repo);if(repo)showInspector(repo,!state.selected);}
}
function downloadPassport(){
  const content=exportFavorites(state.passport,state.repos);
  const blob=new Blob([content],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download='field-passport-favorites.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importPassportFile(event){
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>32000)throw Error('File is too large for Field Passport.');
    const result=importFavorites(state.passport,await file.text(),state.repos);
    state.passport=result.passport;savePassport();updatePassportCount();renderPassport();
    if(!$('inspector').hidden){const repo=state.repos.find(r=>r.id===$('inspector').dataset.repo);if(repo)showInspector(repo,!state.selected);}
    toast('Imported '+result.imported+' public favorites'+(result.omitted?' · '+result.omitted+' unavailable IDs skipped':'')+'. Existing favorites kept.');
  }catch(error){toast('Passport import failed: '+error.message);}
  finally{event.target.value='';}
}


/** The audit describes independently dated public observations, not today's site health. */
function renderAtlasAudit(){
  const report=atlasCoverageAudit(state.repos,state.snapshot,state.atlas,state.atlasPublished);
  $('auditPublic').textContent=String(report.publicInventory.repositoryCount);
  $('auditReviewed').textContent=report.reviewed.valid?String(report.reviewed.matchedCount):'Unavailable';
  $('auditPublished').textContent=report.published.valid?String(report.published.matchedCount):'Unavailable';
  $('auditMissing').textContent=report.published.valid?String(report.published.unmatchedCount):'Unavailable';
  $('auditPublicDate').textContent=report.publicInventory.fetchedAt?
    'Public repository listing: '+new Date(report.publicInventory.fetchedAt).toLocaleString():'Public repository date unavailable';
  $('auditReviewedDate').textContent=report.reviewed.valid?
    'Reviewed chapter map: '+new Date(report.reviewed.checkedAt).toLocaleString():'Reviewed chapter map unavailable or invalid';
  $('auditPublishedDate').textContent=report.published.valid?
    'Published public HTML snapshot: '+new Date(report.published.sourceGeneratedAt).toLocaleString():'Published public HTML snapshot unavailable or invalid';
  $('auditMissingList').innerHTML=!report.published.valid?
    '<li>Published snapshot unavailable. No coverage inference is made.</li>':
    report.published.unmatched.length?report.published.unmatched.map(item=>
      '<li><strong>'+escape(item.repo)+'</strong><small>'+escape(item.projectId)+' · '+escape(item.reason)+'</small></li>'
    ).join(''):'<li>All published snapshot records match a project in the displayed public listing.</li>';
  $('atlasAuditExport').disabled=!report.reviewed.valid||!report.published.valid;
}
function downloadAtlasAudit(){
  const content=atlasCoverageReceipt(state.repos,state.snapshot,state.atlas,state.atlasPublished);
  const blob=new Blob([content],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='atlas-constellation-coverage-receipt.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function renderDirectory(){
  const visible=sortedVisibleRepos();
  $('directoryCount').textContent=`${visible.length} of ${state.repos.length} repositories`;
  $('directoryList').innerHTML=visible.length?visible.map(r=>`<button class="directory-row" data-repo="${escape(r.id)}" style="--repo-color:${repoTint(r)}"><i></i><div><strong>${escape(r.name)}</strong><p>${escape(r.description||groupMap.get(r.group).name)}</p></div><span class="language">${escape(r.language)}</span>${svg('arrow')}</button>`).join(''):'<p class="dialog-footnote">No repositories match your current filters.</p>';
  document.querySelectorAll('[data-repo]').forEach(b=>b.onclick=()=>{$('directoryDialog').close();selectRepo(b.dataset.repo,true);});
}

async function refreshPublic({automatic=false}={}){
  if($('refresh').disabled)return;
  if(automatic&&(immersiveActive||showtimeIndex>=0||document.hidden||document.querySelector('dialog[open]')))return;
  if(!automatic){if(immersiveActive)exitImmersive(false);if(showtimeIndex>=0)stopShowtime(false);}
  try{localStorage.setItem(AUTO_CHECK_KEY,String(Date.now()));}catch{}
  const button=$('refresh');button.disabled=true;button.classList.add('refreshing');$('snapshotStatus').textContent='Checking all public pages…';
  let next;
  try{
    const repos=await fetchPublicInventory(fetch,{onProgress:n=>$('snapshotStatus').textContent=`Checking public repositories · ${n}`});
    next=parseSnapshot({...state.snapshot,repos,fetchedAt:new Date().toISOString(),scope:'public',complete:true,source:'Fully paginated anonymous public GitHub REST repository listing'});
  }catch(error){toast(`${error.message} Your displayed inventory is preserved.`);button.disabled=false;button.classList.remove('refreshing');updateInventoryUI();return;}
  state.snapshot=next;state.repos=prepareRepos(next.repos);state.publicUpdated=next.fetchedAt;state.activityNow=Date.now();
  state.passport=sanitizePassport(state.passport,state.repos);savePassport(false);
  state.quest=sanitizeQuest(state.quest,state.repos);saveQuest(false);
  state.missionSave=sanitizeMissionSave(state.missionSave,state.repos);saveMissionProgress(false);
  state.outerSave=sanitizeOuter(state.outerSave,state.repos);saveOuter(false);
  state.missionReview=null;state.missionFeedback='';state.outerReview=null;state.outerFeedback='';state.outerNeedVisit=null;
  updatePassportCount();if($('passportDialog').open)renderPassport();if($('questDialog').open)renderQuest();if($('missionDialog').open)renderMissions();if($('outerDialog').open)renderOuter();
  if($('postcardDialog').open){
    if(state.postcardView){
      const latest=readPostcardLink(location.href,state.repos);
      if(latest)state.postcardView=latest;
      else{state.postcardView=null;state.postcardDraft=[];}
    }else state.postcardDraft=state.postcardDraft.filter(id=>state.passport.favoriteIds.includes(id));
    renderPostcard();
  }
  if(state.trail){const latest=availableTrails(state.repos).find(t=>t.id===state.trail.id),index=latest?.stops.findIndex(r=>r.id===state.selected)??-1;if(!latest||index<0)stopTrail();else{state.trail=latest;state.trailStop=index;updateTrailHud();try{history.replaceState(null,'',trailLink(location.href,latest,index));}catch{}}}
  renderTrails();
  if(state.atlasOnly&&!reviewedAtlasIds(state.atlas,state.repos).size)state.atlasOnly=false;
  if(state.atlasPublishedOnly&&!publishedAtlasIds(state.atlasPublished,state.repos).size)state.atlasPublishedOnly=false;
  try{localStorage.setItem(CACHE_KEY,JSON.stringify(next));}catch{}
  state.relationships=state.relationshipLedger?resolveRelationships(state.repos,state.relationshipLedger):[];
  if(state.selected&&!state.repos.some(r=>r.id===state.selected))clearSelection();
  updateInventoryUI();
  if(sceneReady){try{buildField();}catch(error){sceneReady=false;console.error('Map redraw failed',error);toast('The inventory updated. Use the directory while the map recovers.');}}
  applyFilters();if(state.selected)showInspector(state.repos.find(r=>r.id===state.selected),false);
  button.disabled=false;button.classList.remove('refreshing');toast(`Updated all ${state.repos.length} public repositories. Destination checks retain their own dates.`);
}
function refreshNeighborhood(){state.neighbors=neighborhood(state.selected,state.repos,edges);}
function setArchitecture(value){
  if(value===state.architecture)return;
  if(value&&!state.relationshipLedger)return;
  state.architecture=value;document.body.classList.toggle('architecture-on',value);setCameraOffset();
  if(value){state.links=true;$('linksToggle').checked=true;}
  if(sceneReady)buildEdges();else edges=value?relationshipEdges(state.repos,state.relationships,state.includeThematic):[];
  refreshNeighborhood();updateRelationshipUI();renderSidebarIndex();if(sceneReady)updateAppearance();
  if(value)toast('Select a project to trace its direct connections. Source facts and documented contracts are labeled separately.');
}
function fitConnections(){
  if(!camera)return;
  const ids=state.selected?state.neighbors:new Set(edges.flatMap(([a,b])=>[state.repos[a].id,state.repos[b].id]));
  const points=targets.filter((p,i)=>ids.has(state.repos[i].id)&&state.visible.has(state.repos[i].id));
  if(!points.length){toast('No connections match the current filters.');return;}
  const box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),radius=Math.max(5,...points.map(p=>p.distanceTo(center))),distance=THREE.MathUtils.clamp(radius/(Math.sin(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))*1.3,25,controls.maxDistance),offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);
  setOrbit(false);flyTo(center.clone().add(offset),center);
}
function updateRelationshipUI(){
  $('architectureToggle').setAttribute('aria-pressed',String(state.architecture));$('architectureToggle').disabled=!state.relationshipLedger;
  $('architecturePanel').hidden=!state.architecture;$('includeThematic').checked=state.includeThematic;
  $('linksCaption').textContent=state.architecture?'Relationship links':chronological()?'Creation thread':state.layout==='orbits'?'Orbit links':'World links';
  const counts={verified:0,documented:0,conceptual:0};
  if(state.architecture)for(const [a,b,status]of edges)if(nodeActive(state.repos[a]?.id)&&nodeActive(state.repos[b]?.id))counts[status]++;
  $('relationshipLegend').innerHTML=Object.entries(RELATIONSHIP_STYLES).filter(([k])=>k!=='conceptual'||state.includeThematic).map(([k,v])=>`<span><i style="background:${v.color}"></i>${v.label} <b>${counts[k]}</b></span>`).join('');
  $('relationshipCoverage').textContent=`${state.relationships.length} sourced connections · ${new Set(state.relationships.flatMap(r=>[r.from,r.to])).size} reviewed projects. Missing links are not evidence of no relationship.`;
}

function toast(message){clearTimeout(toastTimeout);$('toast').textContent=message;$('toast').hidden=false;toastTimeout=setTimeout(()=>$('toast').hidden=true,5500);}
boot();
