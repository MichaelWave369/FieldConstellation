import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {CanvasFieldRenderer} from './canvas-renderer.js';
import {GROUPS,hash,prepareRepos,layoutPositions,layoutEdges,languageOrbits,languageColor,colorFor,activityWeight,filterRepos,safeUrl,normalizePublic} from './model.js';

const $=id=>document.getElementById(id);
const svg=id=>`<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={repos:[],query:'',group:null,language:'',visibility:'',pagesOnly:false,hideForks:false,lens:'world',theme:'field',sidebarMode:'worlds',activityNow:Date.now(),layout:'constellation',selected:null,hovered:null,orbit:!reducedMotion,links:true,labels:true,visible:new Set(),snapshot:null,publicUpdated:null};
let renderer,scene,camera,controls,instanced,glowPoints,lineMesh,selectionRing,core,coreGlow,starfield,groupHalos=[],orbitLines=[],layoutGuides=[],positions=[],targets=[],edges=[],labelNodes=[],clusterLabels=[],centerLabel,frame=0,fitDistance=105,flight=null,toastTimeout,lastHover=0,lastTime=0,sceneReady=false,contextLost=false;
const tempMatrix=new THREE.Matrix4(),tempScale=new THREE.Vector3(),tempColor=new THREE.Color(),tempProjection=new THREE.Vector3();
const groupMap=new Map(GROUPS.map(g=>[g.id,g]));
const featured=['SuperPhiVessel','BrainC','PhiLearn','Agentora','Domistika','SiliconLouvre','FramefieldStudio','RastaPhi','PhiCade','GitPorch','FieldAtlas','Pulse369','MoreBounceLabs','NestedBubbleGear','MRIPHI','RegenerationAtlas','Phithon','Vibe','WhiteHatLedger369','PhiOS','CommonTable','FamilyVault','FieldAccord','axiomforge-ledger','Infinite-Commons'];
const repoTint=repo=>colorFor(repo,state.lens,state.activityNow);
const repoGlow=repo=>activityWeight(repo,state.activityNow);
const chronological=()=>state.layout==='helix'||state.layout==='spiral';

async function boot(){
  try{
    const response=await fetch('./repos.json');if(!response.ok)throw Error('Inventory unavailable');
    state.snapshot=await response.json();if(state.snapshot.scope!=='public'||!Array.isArray(state.snapshot.repos)||!state.snapshot.repos.every(r=>r.visibility==='public'))throw Error('A public repository snapshot is required.');let repos=state.snapshot.repos;
    try{const cache=JSON.parse(localStorage.getItem('field-constellation-public-v2')||'null');if(cache?.repos?.length&&Date.parse(cache.at)>Date.parse(state.snapshot.fetchedAt)&&cache.repos.every(r=>r.visibility==='public'&&r.id&&r.name)){const original=new Map(repos.map(r=>[r.id,r]));repos=cache.repos.map(r=>({...r,pages:r.pages??original.get(r.id)?.pages??null,issues:r.issues??original.get(r.id)?.issues??null}));state.publicUpdated=cache.at;}}catch{}
    state.repos=prepareRepos([...new Map(repos.map(r=>[r.id,r])).values()]);
    bindUI();updateInventoryUI();applyFilters();
    try{initScene();sceneReady=true;buildField();animate(0);}catch(error){console.error('3D initialization failed',error);$('map').classList.add('webgl-unavailable');$('orbitToggle').disabled=true;$('loading').hidden=true;toast('3D is unavailable here. Every repo is still in the directory.');}
    const spotlight=state.repos.find(r=>r.name==='SuperPhiVessel')||state.repos[0];if(spotlight)showInspector(spotlight,true);
    if(innerWidth<761)$('inspector').hidden=true;setCameraOffset();
    $('loading').hidden=true;
  }catch(error){console.error(error);$('loading').innerHTML=`<span class="loader-orbit">✳</span><p>Your inventory could not load.</p><button class="primary-button" id="retryLoad">Try again</button><a href="https://github.com/MichaelWave369?tab=repositories" target="_blank" rel="noopener noreferrer">Browse on GitHub ↗</a>`;$('retryLoad').onclick=()=>location.reload();}
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
  $('fitMatches').onclick=fitMatches;
  document.querySelectorAll('[data-layout]').forEach(button=>button.onclick=()=>setLayout(button.dataset.layout));
  $('linksToggle').onchange=event=>{state.links=event.target.checked;if(lineMesh)lineMesh.visible=state.links;};
  $('labelsToggle').onchange=event=>{state.labels=event.target.checked;$('labels').style.display=state.labels?'':'none';};
  $('orbitToggle').onclick=()=>setOrbit(!state.orbit);
  $('resetView').onclick=()=>fitField(true);$('zoomIn').onclick=()=>zoom(.78);$('zoomOut').onclick=()=>zoom(1.26);
  $('closeInspector').onclick=clearSelection;
  $('directoryButton').onclick=()=>{renderDirectory();$('directoryDialog').showModal();};
  $('directorySort').onchange=renderDirectory;
  $('aboutButton').onclick=()=>$('aboutDialog').showModal();
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  $('refresh').onclick=refreshPublic;
  $('mobileMenu').onclick=()=>setSidebar(!$('sidebar').classList.contains('open'));
  $('closeMobileMenu').onclick=()=>setSidebar(false);
  $('map').addEventListener('pointerdown',event=>{if(!event.target.closest('#mobileMenu'))setSidebar(false);});
  document.addEventListener('keydown',event=>{
    const editing=event.target.matches('input,textarea,select');
    if(event.key==='/'&&!editing&&!document.querySelector('dialog[open]')){event.preventDefault();if(innerWidth<761)setSidebar(true);$('search').focus();}
    if(event.key==='Escape'&&!document.querySelector('dialog[open]')){if(state.query){$('search').value='';state.query='';applyFilters();}else clearSelection();setSidebar(false);}
    if(!editing&&event.target.tagName!=='CANVAS'&&!document.querySelector('dialog[open]')&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();cycleRepo(event.key==='ArrowDown'?1:-1);}
  });
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{lastTime=0;});
  setOrbit(state.orbit);
}

function updateInventoryUI(){
  $('totalCount').textContent=state.repos.length;$('groupCount').textContent=GROUPS.length;$('liveCount').textContent=state.repos.filter(r=>safeUrl(r.homepage)).length;
  $('indexTotal').textContent=state.repos.length;$('inventoryFacts').textContent=`${state.repos.reduce((n,r)=>n+r.stars,0)} stars · ${state.repos.filter(r=>r.pages).length} GitHub Pages · ${state.repos.filter(r=>r.fork).length} forks`;
  const options=['',...new Set(state.repos.map(r=>r.language))].sort((a,b)=>!a?-1:!b?1:a.localeCompare(b));
  $('language').innerHTML=options.map(x=>`<option value="${escape(x)}">${escape(x||'All languages')}</option>`).join('');$('language').value=state.language;
  const at=state.publicUpdated||state.snapshot.fetchedAt,date=new Date(at).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  $('snapshotStatus').textContent=(state.publicUpdated?'Public repos refreshed · ':'GitHub snapshot · ')+date;
  $('aboutInventory').textContent=`${state.repos.length} public repositories owned by MichaelWave369. Public snapshot captured ${new Date(state.snapshot.fetchedAt).toLocaleString()}. Refresh checks every page of GitHub’s public repository listing.`;
  $('categories').innerHTML=GROUPS.map(g=>`<button class="category${state.group===g.id?' selected':''}" style="--category:${g.color}" data-group="${g.id}" aria-pressed="${state.group===g.id}"><span class="category-dot"></span><span>${g.name}</span><span class="category-count">${state.repos.filter(r=>r.group===g.id).length}</span></button>`).join('');
  document.querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>{state.group=state.group===button.dataset.group?null:button.dataset.group;applyFilters();});
  renderLensLegend();renderSidebarIndex();
}

function applyFilters(){
  state.visible=new Set(filterRepos(state.repos,state).map(r=>r.id));
  $('visibleCount').textContent=`${state.visible.size} / ${state.repos.length} worlds`;
  $('emptyState').hidden=state.visible.size!==0;
  document.querySelectorAll('[data-group]').forEach(b=>{const selected=state.group===b.dataset.group;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  if(state.selected&&!state.visible.has(state.selected))clearSelection();
  if($('inspector').dataset.repo&&!state.visible.has($('inspector').dataset.repo))$('inspector').hidden=true;
  if(state.query&&state.visible.size===1&&state.selected!==[...state.visible][0])selectRepo([...state.visible][0],true,false);
  if(sceneReady)updateAppearance();
  if($('directoryDialog').open)renderDirectory();
  $('pagesOnly').setAttribute('aria-pressed',String(state.pagesOnly));$('hideForks').setAttribute('aria-pressed',String(state.hideForks));renderSidebarIndex();renderLensLegend();
  $('tooltip').hidden=true;
}
function resetFilters(){state.query='';state.group=null;state.language='';state.visibility='';state.pagesOnly=false;state.hideForks=false;$('search').value='';$('language').value='';$('visibility').value='';clearSelection();applyFilters();if(sceneReady)fitField(true);}
function setSidebarMode(mode){state.sidebarMode=mode;$('worldPanel').hidden=mode!=='worlds';$('repoPanel').hidden=mode!=='repos';$('worldsTab').setAttribute('aria-selected',String(mode==='worlds'));$('reposTab').setAttribute('aria-selected',String(mode==='repos'));$('worldsTab').tabIndex=mode==='worlds'?0:-1;$('reposTab').tabIndex=mode==='repos'?0:-1;$('browseHeading').textContent=mode==='worlds'?'CONSTELLATIONS':'REPOSITORIES';if(mode==='repos')renderSidebarIndex();}
function renderSidebarIndex(){
  const previousScroll=$('repoIndex').scrollTop;
  const visible=state.repos.filter(r=>state.visible.has(r.id));$('indexCount').textContent=`${visible.length} in view`;
  $('repoIndex').innerHTML=visible.length?visible.map(r=>`<button class="index-row${r.id===state.selected?' selected':''}" data-index-repo="${escape(r.id)}" title="${escape(r.description||r.name)}" aria-label="Explore ${escape(r.name)}"><i style="background:${repoTint(r)}"></i><span>${escape(r.name)}</span></button>`).join(''):'<p class="index-empty">No matching worlds. Try Show all.</p>';
  document.querySelectorAll('[data-index-repo]').forEach(button=>{button.onclick=()=>selectRepo(button.dataset.indexRepo,true);button.onmouseenter=()=>{state.hovered=button.dataset.indexRepo;$('tooltip').hidden=true;if(sceneReady)updateAppearance();};button.onmouseleave=()=>{if(state.hovered===button.dataset.indexRepo)state.hovered=null;if(sceneReady)updateAppearance();};});
  $('repoIndex').scrollTop=previousScroll;
}
function cycleRepo(direction){const visible=state.repos.filter(r=>state.visible.has(r.id));if(!visible.length)return;const index=visible.findIndex(r=>r.id===state.selected),next=index<0?(direction>0?0:visible.length-1):(index+direction+visible.length)%visible.length;selectRepo(visible[next].id,true,false);if(state.sidebarMode==='repos'){const row=document.querySelector(`[data-index-repo="${visible[next].id}"]`);row?.focus({preventScroll:true});row?.scrollIntoView({block:'nearest'});}}
function setLens(lens){state.lens=lens;state.activityNow=Date.now();$('colorLens').value=lens;renderLensLegend();renderSidebarIndex();if(sceneReady)updateAppearance();if(!$('inspector').hidden){const r=state.repos.find(r=>r.id===$('inspector').dataset.repo);if(r)showInspector(r,!state.selected);}}
function renderLensLegend(){
  const visible=state.repos.filter(r=>state.visible.has(r.id));
  if(state.lens==='language'){const counts=new Map();for(const r of visible)counts.set(r.language,(counts.get(r.language)||0)+1);$('lensLegend').innerHTML=[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([language,count])=>`<button class="legend-language" data-key-language="${escape(language)}" title="${escape(language)} · ${count} matching repositories" aria-label="Filter ${escape(language)}"><i style="background:${languageColor(language)}"></i><span>${escape(language)}</span></button>`).join('');document.querySelectorAll('[data-key-language]').forEach(button=>button.onclick=()=>{state.language=state.language===button.dataset.keyLanguage?'':button.dataset.keyLanguage;$('language').value=state.language;applyFilters();});}
  else if(state.lens==='activity')$('lensLegend').innerHTML='<span title="Age of the last code push"><i style="background:#f5d68b"></i>≤7d</span><span><i style="background:#d7a866"></i>30d</span><span><i style="background:#8ba58b"></i>90d</span><span><i style="background:#6d7884"></i>Older</span>';
  else $('lensLegend').innerHTML='<span>COLOR: WORLD</span><span class="legend-dots">'+GROUPS.map(g=>`<i style="background:${g.color}" title="${g.name}"></i>`).join('')+'</span>';
}
function setTheme(theme){state.theme=theme;document.body.classList.toggle('lattice-theme',theme==='lattice');$('themeToggle').setAttribute('aria-pressed',String(theme==='lattice'));document.querySelector('meta[name="theme-color"]').content=theme==='lattice'?'#0d0f12':'#111412';if(scene){scene.background.set(theme==='lattice'?'#0d0f12':'#111512');scene.fog.color.copy(scene.background);for(const child of core.children)if(child.material?.color)child.material.color.set(theme==='lattice'?'#e0b15a':'#c4dc9e');}}
function setSidebar(open){$('sidebar').classList.toggle('open',open);$('sidebar').inert=innerWidth<761&&!open;$('mobileMenu').setAttribute('aria-expanded',String(open));}
function setOrbit(value){state.orbit=value;if(controls)controls.autoRotate=value;$('orbitToggle').classList.toggle('active',value);$('orbitToggle').setAttribute('aria-pressed',String(value));}
function setLayout(mode){if(state.layout===mode)return;state.layout=mode;document.querySelectorAll('[data-layout]').forEach(b=>{b.classList.toggle('selected',b.dataset.layout===mode);b.setAttribute('aria-pressed',String(b.dataset.layout===mode));});$('layoutLabel').textContent={constellation:'CONSTELLATION SPACE',helix:'CHRONOLOGICAL HELIX',sphere:'FIBONACCI SPHERE',orbits:'LANGUAGE ORBITS',spiral:'GOLDEN-ANGLE TIMELINE'}[mode];$('viewDescription').textContent={constellation:'Eight worlds of ideas. One shared field.',helix:'Follow the order in which your projects began.',sphere:'Every world, a place on the same Fibonacci shell.',orbits:'One orbit per programming language. Inspired by Grok’s Field Lattice.',spiral:'A widening golden-angle spiral, ordered by creation. From Grok’s Field Lattice.'}[mode];$('linksCaption').textContent=chronological()?'Creation thread':mode==='orbits'?'Orbit links':'World links';if(mode==='orbits')setLens('language');if(sceneReady){targets=layoutPositions(state.repos,mode).map(p=>new THREE.Vector3(...p));if(reducedMotion)positions=targets.map(p=>p.clone());buildEdges();refreshGuides();buildLabels();fitField(true);}}

function initScene(){
  const host=$('scene');scene=new THREE.Scene();scene.background=new THREE.Color('#111512');scene.fog=new THREE.FogExp2('#111512',.0035);
  const renderCanvas=document.createElement('canvas');let webglContext=null;try{webglContext=renderCanvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});}catch{}
  renderer=webglContext?new THREE.WebGLRenderer({canvas:renderCanvas,context:webglContext,antialias:true,alpha:false}):new CanvasFieldRenderer({getField:()=>({state,positions,edges,starfield,orbitLines,layoutGuides,core,groupMap,repoTint,repoGlow})});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D repository map. Use the Directory button to explore all repositories with the keyboard.');
  camera=new THREE.PerspectiveCamera(46,host.clientWidth/host.clientHeight,.1,650);camera.position.set(0,20,105);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.autoRotate=state.orbit;controls.autoRotateSpeed=.22;controls.minDistance=8;controls.maxDistance=230;controls.enablePan=true;controls.target.set(0,0,0);controls.addEventListener('start',()=>{flight=null;setOrbit(false);});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;$('map').classList.add('webgl-unavailable');toast('The 3D context was interrupted. The directory remains available.');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  const dotCanvas=document.createElement('canvas');dotCanvas.width=dotCanvas.height=128;const ctx=dotCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.1,'rgba(255,255,255,.8)');gradient.addColorStop(.28,'rgba(255,255,255,.19)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const glowTexture=new THREE.CanvasTexture(dotCanvas);
  core=new THREE.Group();const coreMesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,2),new THREE.MeshBasicMaterial({color:'#c4dc9e',wireframe:true,transparent:true,opacity:.35}));core.add(coreMesh);const innerCore=new THREE.Mesh(new THREE.SphereGeometry(.85,20,16),new THREE.MeshBasicMaterial({color:'#d4ebae'}));core.add(innerCore);coreGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#b6d781',transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));coreGlow.scale.set(16,16,1);core.add(coreGlow);scene.add(core);
  for(const g of GROUPS){const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:g.color,opacity:.055,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.set(...g.center);halo.scale.set(27,27,1);scene.add(halo);groupHalos.push(halo);}
  for(let ringIndex=0;ringIndex<3;ringIndex++){
    const radius=ringIndex===0?43:ringIndex===1?51:57,points=[];for(let i=0;i<=240;i++){const angle=i/240*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius));}
    const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#8ea17a',transparent:true,opacity:ringIndex===0?.13:.065,depthWrite:false}));ring.rotation.set((ringIndex-1)*.29,0,ringIndex===1?.43:-.12);ring.position.y=-3;scene.add(ring);orbitLines.push(ring);
  }
  const tickPositions=[];for(let i=0;i<100;i++){const a=i/100*Math.PI*2,r=52;tickPositions.push(Math.cos(a)*r,-3,Math.sin(a)*r,Math.cos(a)*(r+(i%5===0?.9:.35)),-3,Math.sin(a)*(r+(i%5===0?.9:.35)));}const tickGeo=new THREE.BufferGeometry();tickGeo.setAttribute('position',new THREE.Float32BufferAttribute(tickPositions,3));const ticks=new THREE.LineSegments(tickGeo,new THREE.LineBasicMaterial({color:'#8ea17a',transparent:true,opacity:.13}));ticks.rotation.z=.43;scene.add(ticks);orbitLines.push(ticks);
  const dust=[];for(let i=0;i<1100;i++){const a=hash('a'+i)*Math.PI*2,y=(hash('y'+i)-.5)*220,r=65+hash('r'+i)*160;dust.push(Math.cos(a)*r,y,Math.sin(a)*r);}const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));starfield=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#a1b68b',size:.19,transparent:true,opacity:.3,sizeAttenuation:true,depthWrite:false}));scene.add(starfield);
  const selectionGeo=new THREE.RingGeometry(.9,1.0,48);selectionRing=new THREE.Mesh(selectionGeo,new THREE.MeshBasicMaterial({color:'#e5ffbc',side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));selectionRing.visible=false;scene.add(selectionRing);
  let down=null;
  host.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY,time:performance.now()};});
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
  edges=layoutEdges(state.repos,targets.map(p=>p.toArray()),state.layout);
  lineMesh.geometry.dispose();lineMesh.geometry=new THREE.BufferGeometry();lineMesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(edges.length*6),3));lineMesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(edges.length*6),3));lineMesh.visible=state.links;updateAppearance();
}
function refreshGuides(){
  for(const guide of layoutGuides){scene.remove(guide);guide.geometry.dispose();guide.material.dispose();}layoutGuides=[];
  orbitLines.forEach(line=>line.visible=state.layout==='constellation');
  if(state.layout==='orbits')for(const ring of languageOrbits(state.repos)){const points=[];for(let i=0;i<=180;i++){const angle=i/180*Math.PI*2;points.push(new THREE.Vector3(Math.cos(angle)*ring.radius,ring.y,Math.sin(angle)*ring.radius));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:ring.color,transparent:true,opacity:.23,depthWrite:false}));line.userData.language=ring.language;scene.add(line);layoutGuides.push(line);}
  if(state.layout==='sphere'){const base=new THREE.IcosahedronGeometry(40,1),geometry=new THREE.EdgesGeometry(base);base.dispose();const cage=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#c5b581',transparent:true,opacity:.1,depthWrite:false}));scene.add(cage);layoutGuides.push(cage);}
  updateAppearance();
}
function updateAppearance(){
  if(!instanced)return;
  const colors=glowPoints.geometry.attributes.aColor,sizes=glowPoints.geometry.attributes.aSize;
  state.repos.forEach((r,i)=>{const visible=state.visible.has(r.id),selected=r.id===state.selected,hovered=r.id===state.hovered;tempColor.set(repoTint(r));tempColor.multiplyScalar(visible?(selected||hovered?1.4:repoGlow(r)):.065);instanced.setColorAt(i,tempColor);colors.setXYZ(i,tempColor.r,tempColor.g,tempColor.b);sizes.setX(i,(selected||hovered?14:9)*r.radius*(visible?1:.3));});
  instanced.instanceColor.needsUpdate=true;colors.needsUpdate=true;sizes.needsUpdate=true;
  if(lineMesh?.geometry.attributes.color){const arr=lineMesh.geometry.attributes.color;edges.forEach(([a,b],i)=>{const ra=state.repos[a],rb=state.repos[b],visible=state.visible.has(ra.id)&&state.visible.has(rb.id),selected=ra.id===state.selected||rb.id===state.selected;tempColor.set(chronological()?'#dfb86d':repoTint(ra)).multiplyScalar(visible?(selected?1:chronological()?.47:.34):.012);arr.setXYZ(i*2,tempColor.r,tempColor.g,tempColor.b);arr.setXYZ(i*2+1,tempColor.r,tempColor.g,tempColor.b);});arr.needsUpdate=true;}
  groupHalos.forEach((h,i)=>{h.material.opacity=state.layout==='constellation'&&(!state.group||state.group===GROUPS[i].id)?.045:0;});
  layoutGuides.forEach(g=>{if(g.userData.language)g.material.opacity=state.repos.some(r=>r.language===g.userData.language&&state.visible.has(r.id))?.23:.025;});
}
function updateGeometry(){
  const points=glowPoints.geometry.attributes.position,lines=lineMesh.geometry.attributes.position;
  positions.forEach((p,i)=>{const r=state.repos[i],scale=r.radius*(state.visible.has(r.id)?1:.5)*(r.id===state.selected?1.35:1);tempScale.setScalar(scale);tempMatrix.compose(p,new THREE.Quaternion(),tempScale);instanced.setMatrixAt(i,tempMatrix);points.setXYZ(i,p.x,p.y,p.z);});instanced.instanceMatrix.needsUpdate=true;points.needsUpdate=true;
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
  const captionBottom=document.querySelector('.map-caption').getBoundingClientRect().bottom-sceneRect.top+14;
  const blocked=(x,y,width)=>y<Math.max(145,captionBottom)||y>h-143||x<60||x+width>w-15||(inspectorVisible&&x+width>inspectorRect.left-sceneRect.left-12&&x<inspectorRect.right-sceneRect.left+12&&y>inspectorRect.top-sceneRect.top-15&&y<inspectorRect.bottom-sceneRect.top+15);
  const ordered=labelNodes.map((l,i)=>({...l,i,priority:l.repo.id===state.selected?0:l.repo.id===state.hovered?1:featured.includes(l.repo.name)?2:3})).sort((a,b)=>a.priority-b.priority);let count=0;
  for(const label of ordered){const {el,repo,i}=label;el.style.display='none';if(!state.visible.has(repo.id))continue;const allow=label.priority<3||state.query||state.visible.size<50||camera.position.distanceTo(positions[i])<48;if(!allow||count>42)continue;tempProjection.copy(positions[i]).project(camera);if(tempProjection.z>1||tempProjection.z<-1)continue;const x=(tempProjection.x*.5+.5)*w+9,y=(-tempProjection.y*.5+.5)*h-5,width=repo.name.length*(label.priority===0?6:5.4);if(blocked(x,y,width))continue;const box={x,y,w:width,h:14};if(occupied.some(o=>x<o.x+o.w+10&&x+width>o.x-10&&y<o.y+o.h+5&&y+14>o.y-5))continue;occupied.push(box);el.style.display='';el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;el.classList.toggle('selected',repo.id===state.selected);el.style.color=repo.id===state.selected?'':state.lens==='world'?'':repoTint(repo);count++;}
  for(const {el,group}of clusterLabels){el.style.display='none';if(group.language){if(state.layout!=='orbits'||!state.repos.some(r=>r.language===group.language&&state.visible.has(r.id)))continue;}else if(state.layout!=='constellation'||(state.group&&state.group!==group.id)||!state.repos.some(r=>r.group===group.id&&state.visible.has(r.id)))continue;tempProjection.set(group.center[0],group.center[1]+11,group.center[2]).project(camera);const x=(tempProjection.x*.5+.5)*w,y=(-tempProjection.y*.5+.5)*h,width=group.short.length*5.5;if(tempProjection.z>1||blocked(x-width/2,y,width)||occupied.some(o=>x-width/2<o.x+o.w+8&&x+width/2>o.x-8&&y<o.y+o.h+14&&y+10>o.y-8))continue;el.style.display='';el.style.left=x+'px';el.style.top=y+'px';occupied.push({x:x-width/2,y,w:width,h:14});}
  tempProjection.set(0,-2,0).project(camera);centerLabel.style.left=((tempProjection.x*.5+.5)*w)+'px';centerLabel.style.top=((-tempProjection.y*.5+.5)*h+12)+'px';centerLabel.style.display=state.selected||state.query||state.group?'none':'';
}

function animate(now){
  requestAnimationFrame(animate);if(document.hidden||contextLost)return;const delta=Math.min(.05,lastTime?(now-lastTime)/1000:.016);lastTime=now;frame++;
  if(flight){const t=reducedMotion?1:Math.min(1,(now-flight.start)/950),e=1-Math.pow(1-t,3);camera.position.lerpVectors(flight.from,flight.to,e);controls.target.lerpVectors(flight.fromTarget,flight.toTarget,e);if(t===1)flight=null;}
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
function setCameraOffset(){if(!camera)return;const w=$('scene').clientWidth,h=$('scene').clientHeight;camera.clearViewOffset();if(innerWidth<761&&!$('inspector').hidden)camera.setViewOffset(w,h,0,h*.27,w,h);else if(w>720)camera.setViewOffset(w,h,70,0,w,h);camera.updateProjectionMatrix();}
function fitField(smooth){if(!camera)return;const target=new THREE.Vector3(0,0,0),destination=state.layout==='orbits'?new THREE.Vector3(0,fitDistance*.72,fitDistance*.98):state.layout==='spiral'?new THREE.Vector3(fitDistance*.24,fitDistance*.16,fitDistance):new THREE.Vector3(0,state.layout==='helix'?6:20,fitDistance);if(smooth&&!reducedMotion)flyTo(destination,target);else{camera.position.copy(destination);controls.target.copy(target);controls.update();}}
function fitMatches(){if(!camera||!state.visible.size)return;setOrbit(false);const points=targets.filter((p,i)=>state.visible.has(state.repos[i].id)),box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),radius=Math.max(3,...points.map(p=>p.distanceTo(center))),distance=THREE.MathUtils.clamp(radius/(Math.sin(camera.fov*Math.PI/360)*Math.min(1,camera.aspect)) * 1.25,20,controls.maxDistance),offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);flyTo(center.clone().add(offset),center);setSidebar(false);}
function flyTo(to,toTarget){if(!camera)return;if(reducedMotion){camera.position.copy(to);controls.target.copy(toTarget);controls.update();return;}flight={from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget,start:performance.now()};}
function zoom(factor){if(!camera)return;setOrbit(false);const offset=camera.position.clone().sub(controls.target),distance=THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);flyTo(controls.target.clone().add(offset.normalize().multiplyScalar(distance)),controls.target.clone());}
function pickRepo(event){if(!camera)return null;const rect=$('scene').getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let best=null,distance=14;for(let i=0;i<state.repos.length;i++){const repo=state.repos[i];if(!state.visible.has(repo.id))continue;tempProjection.copy(positions[i]).project(camera);if(tempProjection.z>1||tempProjection.z<-1)continue;const px=(tempProjection.x*.5+.5)*rect.width,py=(-tempProjection.y*.5+.5)*rect.height,d=Math.hypot(x-px,y-py);if(d<distance){distance=d;best=repo;}}return best;}
function selectRepo(id,focus=true,closeMenu=true){const repo=state.repos.find(r=>r.id===id);if(!repo)return;state.selected=id;$('inspector').hidden=false;showInspector(repo,false);updateAppearance();renderSidebarIndex();if(sceneReady&&focus){setOrbit(false);const p=targets[state.repos.indexOf(repo)],offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(innerWidth<761?48:34);flyTo(p.clone().add(offset),p.clone());}if(innerWidth<761&&closeMenu)setSidebar(false);}
function clearSelection(){state.selected=null;$('inspector').hidden=true;setCameraOffset();if(sceneReady)updateAppearance();renderSidebarIndex();}
function showInspector(repo,spotlight){
  $('inspector').dataset.repo=repo.id;
  const g=groupMap.get(repo.group),url=safeUrl(repo.url),homepage=safeUrl(repo.homepage),updated=repo.updated?new Date(repo.updated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Not available',created=repo.created?new Date(repo.created).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Not available',size=repo.size<1024?repo.size.toLocaleString()+' KB':(repo.size/1024).toFixed(1)+' MB';
  $('inspectorCaption').textContent=spotlight?'IN THE SPOTLIGHT':'A POINT IN THE FIELD';
  $('inspectorContent').innerHTML=`<div class="inspector-body" style="--repo-color:${repoTint(repo)}"><div class="repo-orb" aria-hidden="true"></div><div class="repo-category"><i></i>${escape(g.name)}</div><h2>${escape(repo.name)}</h2><p class="repo-description" title="${escape(repo.description)}">${escape(repo.description||'No description has been added on GitHub yet. Explore the repository to see what is taking shape.')}</p><div class="repo-tags"><span>${escape(repo.language)}</span><span>Public</span>${repo.pages?'<span>GitHub Pages</span>':''}${repo.fork?'<span>Fork</span>':''}${repo.archived?'<span>Archived</span>':''}</div><dl class="repo-meta"><div><dt>Stars</dt><dd>${repo.stars.toLocaleString()}</dd></div><div><dt>License</dt><dd>${escape(repo.license&&repo.license!=='NOASSERTION'?repo.license:'Not specified')}</dd></div><div><dt>Repository size</dt><dd>${size}</dd></div><div><dt>Forks</dt><dd>${repo.forks.toLocaleString()}</dd></div><div class="wide"><dt>Last code update</dt><dd>${updated}</dd></div></dl><details class="repo-facts"><summary>More repository facts <span>+</span></summary><dl><div><dt>Created</dt><dd>${created}</dd></div><div><dt>Open issues / PRs</dt><dd>${repo.issues==null?'Not available':repo.issues.toLocaleString()}</dd></div><div><dt>GitHub Pages</dt><dd>${repo.pages===true?'Enabled':repo.pages===false?'Not enabled':'Not recorded'}</dd></div><div><dt>Default branch</dt><dd>${escape(repo.branch)}</dd></div></dl></details><div class="repo-links">${homepage?`<a href="${escape(homepage)}" target="_blank" rel="noopener noreferrer">Enter the live world ${svg('arrow')}</a>`:''}${url?`<a class="secondary" href="${escape(url)}" target="_blank" rel="noopener noreferrer"><span>View on GitHub</span>${svg('github')}</a>`:''}</div></div><div class="inspector-footer"><span>${spotlight?'ONE OF '+state.repos.length+' WORLDS':'KEEP EXPLORING'}</span><button id="surprise">Another world ↗</button></div>`;
  $('surprise').onclick=()=>{const available=state.repos.filter(r=>state.visible.has(r.id)&&r.id!==repo.id);if(available.length)selectRepo(available[Math.floor(Math.random()*available.length)].id,true);else toast('This is the only world matching your filters.');};
  setCameraOffset();
}
function renderDirectory(){
  const sort=$('directorySort').value,visible=state.repos.filter(r=>state.visible.has(r.id)).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):String(b[sort]||'').localeCompare(String(a[sort]||'')));
  $('directoryCount').textContent=`${visible.length} of ${state.repos.length} repositories`;
  $('directoryList').innerHTML=visible.length?visible.map(r=>`<button class="directory-row" data-repo="${escape(r.id)}" style="--repo-color:${repoTint(r)}"><i></i><div><strong>${escape(r.name)}</strong><p>${escape(r.description||groupMap.get(r.group).name)}</p></div><span class="language">${escape(r.language)}</span>${svg('arrow')}</button>`).join(''):'<p class="dialog-footnote">No repositories match your current filters.</p>';
  document.querySelectorAll('[data-repo]').forEach(b=>b.onclick=()=>{$('directoryDialog').close();selectRepo(b.dataset.repo,true);});
}

async function refreshPublic(){
  const button=$('refresh');button.disabled=true;button.classList.add('refreshing');$('snapshotStatus').textContent='Checking public repositories…';
  try{
    let incoming=[];for(let page=1;page<=30;page++){const response=await fetch(`https://api.github.com/users/MichaelWave369/repos?per_page=100&sort=full_name&page=${page}`,{headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw Error(response.status===403||response.status===429?'GitHub’s rate limit was reached. Please try again later.':'GitHub could not be reached.');const part=await response.json();if(!Array.isArray(part)||!part.every(r=>r.private===false&&r.id&&r.name&&r.owner?.login?.toLowerCase()==='michaelwave369'))throw Error('GitHub returned an unexpected inventory.');incoming.push(...part);if(part.length<100)break;if(page===30)throw Error('The inventory was too large to refresh completely.');}
    if(!incoming.length)throw Error('No public repositories were returned.');
    const publicRepos=incoming.map(normalizePublic);state.repos=prepareRepos([...new Map(publicRepos.map(r=>[r.id,r])).values()]);state.publicUpdated=new Date().toISOString();state.activityNow=Date.now();try{localStorage.setItem('field-constellation-public-v2',JSON.stringify({at:state.publicUpdated,repos:publicRepos}));}catch{}
    if(state.selected&&!state.repos.some(r=>r.id===state.selected))clearSelection();updateInventoryUI();applyFilters();if(sceneReady)buildField();if(state.selected)showInspector(state.repos.find(r=>r.id===state.selected),false);toast(`Updated all ${publicRepos.length} public repositories.`);
  }catch(error){toast(`${error.message} Your saved inventory is preserved.`);}finally{button.disabled=false;button.classList.remove('refreshing');updateInventoryUI();}
}
function toast(message){clearTimeout(toastTimeout);$('toast').textContent=message;$('toast').hidden=false;toastTimeout=setTimeout(()=>$('toast').hidden=true,5500);}
boot();
