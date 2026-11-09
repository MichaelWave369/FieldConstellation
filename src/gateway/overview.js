import {parseSnapshot,newerPublicCache,fetchPublicInventory,CACHE_KEY,AUTO_REFRESH_KEY,AUTO_CHECK_KEY,autoRefreshDue} from '../inventory.js';
import {ARCHITECTURE_GROUPS,architectureFor,architectureCounts} from '../architecture-taxonomy.js';
import {sortRepositoryList} from '../sort.js';
import {renderHierarchy} from './hierarchy.js';
import {validateRepoNerveHandoff,loadProjectEvidence,renderProjectIntelligence} from './intelligence.js';
import {validateHealthObservations,summarizeHealth,renderHealthBoard,inspectPublicCi,renderCiLookup} from './health.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let snapshot=null,category='',query='',sort='name',refreshing=false;
let evidence={relationships:null,deployments:null},handoff=null;
let healthObservations=null,healthLoadMessage='Loading reviewed public observations…';
const overviewUrl=repo=>'../index.html?repo=github:'+encodeURIComponent(repo.id);
const groupName=new Map(ARCHITECTURE_GROUPS.map(g=>[g.id,g.name]));

function render(){
  if(!snapshot)return;
  const repos=snapshot.repos,counts=architectureCounts(repos);
  $('gatewayCount').textContent=String(repos.length);
  $('gatewayDate').textContent='As of '+new Date(snapshot.fetchedAt).toLocaleString();
  $('gatewayCategoryCount').textContent=String(ARCHITECTURE_GROUPS.length);
  $('gatewayHealth').innerHTML=renderHealthBoard(summarizeHealth(repos,{...evidence,observations:healthObservations,snapshotAt:snapshot.fetchedAt}));
  $('gatewayCategories').innerHTML=ARCHITECTURE_GROUPS.map(g=>
    '<button type="button" class="system-filter'+(g.id===category?' selected':'')+'" data-category="'+g.id+'" aria-pressed="'+(g.id===category)+'" style="--group-color:'+g.color+'"><i aria-hidden="true"></i><span>'+escape(g.id)+'</span><b>'+counts[g.id]+'</b></button>'
  ).join('');
  for(const button of $('gatewayCategories').querySelectorAll('button')){
    button.onclick=()=>{category=category===button.dataset.category?'':button.dataset.category;render();};
  }
  const visible=sortRepositoryList(repos.filter(repo=>{
    const placement=architectureFor(repo),haystack=[repo.name,repo.description,...(repo.topics||[]),placement.id].join(' ').toLowerCase();
    return (!category||category===placement.id)&&(!query||haystack.includes(query));
  }),sort);
  renderHierarchy($('gatewayHierarchy'),repos,visible,overviewUrl,Boolean(category||query),
    (repo,panel)=>{panel.innerHTML=renderProjectIntelligence(repo,{snapshotAt:snapshot.fetchedAt,...evidence,handoff});});
  $('gatewayShown').textContent=visible.length+' of '+repos.length+' public repositories';
  const byGroup=new Map(ARCHITECTURE_GROUPS.map(g=>[g.id,[]]));
  for(const repo of visible)byGroup.get(architectureFor(repo).id).push(repo);
  $('gatewayProjects').innerHTML=ARCHITECTURE_GROUPS.filter(g=>byGroup.get(g.id).length).map(g=>
    '<section class="system-directory-group" aria-label="'+escape(g.name)+'"><h3 style="--group-color:'+g.color+'">'+escape(g.name)+' <small>'+byGroup.get(g.id).length+'</small></h3><ul>'+
    byGroup.get(g.id).map(repo=>{
      const placement=architectureFor(repo);
      const placementNote=placement.basis==='curated'?'curated':placement.basis==='owner-topic'?'owner tagged':placement.basis==='suggested-needs-review'?'suggested; review pending':placement.basis==='unreviewed'?'review pending':'archived';
      return '<li><a href="'+overviewUrl(repo)+'">'+escape(repo.name)+'</a><span title="Cataloged source; not an installed app">'+escape(placementNote)+'</span></li>';
    }).join('')+'</ul></section>'
  ).join('')||'<p class="gateway-empty">No matching public projects. Clear the search or category filter.</p>';
  $('gatewayReset').hidden=!category&&!query;
}
function status(message){$('gatewayInventoryStatus').textContent=message;}

function setHealthRepoOptions(){
  if(!snapshot)return;
  const select=$('gatewayHealthRepo'),previous=select.value;
  const publicRepos=snapshot.repos.filter(repo=>repo.visibility==='public').slice()
    .sort((a,b)=>a.name.localeCompare(b.name));
  select.innerHTML='<option value="">Choose a public project…</option>'+
    publicRepos.map(repo=>'<option value="'+escape(repo.id)+'">'+escape(repo.name)+'</option>').join('');
  if(publicRepos.some(repo=>repo.id===previous))select.value=previous;
}
async function loadHealthFor(currentSnapshot){
  try{
    const response=await fetch('../health-observations.json',{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('No reviewed health observation ledger');
    const parsed=validateHealthObservations(await response.json());
    if(snapshot===currentSnapshot){
      healthObservations=parsed;
      healthLoadMessage='Reviewed public observations loaded. All signals are time-scoped.';
      render();
    }
  }catch{
    if(snapshot===currentSnapshot){
      healthObservations=null;
      healthLoadMessage='Reviewed CI and release observations unavailable. Showing only source-independent categories.';
      render();
    }
  }
}
async function checkHealthCi(){
  const id=$('gatewayHealthRepo').value;
  const repo=snapshot?.repos.find(item=>item.id===id&&item.visibility==='public');
  if(!repo){$('gatewayHealthResult').textContent='Select a public project first.';return;}
  const button=$('gatewayHealthCheck');
  button.disabled=true;
  $('gatewayHealthResult').textContent='Checking one public GitHub Actions branch…';
  try{
    const result=await inspectPublicCi(repo);
    $('gatewayHealthResult').innerHTML=renderCiLookup(result);
  }catch{
    $('gatewayHealthResult').textContent='CI unavailable or rate limited. No pass or failure inferred.';
  }finally{button.disabled=false;}
}

async function loadEvidenceFor(currentSnapshot){
  const observed=await loadProjectEvidence(currentSnapshot.repos);
  if(snapshot===currentSnapshot){evidence=observed;render();}
}
function clearHandoff(message='No local handoff loaded.'){
  handoff=null;
  $('gatewayRepoNerveFile').value='';
  $('gatewayRepoNerveClear').hidden=true;
  $('gatewayRepoNerveStatus').textContent=message;
}
async function importHandoff(file){
  try{
    if(!snapshot||!file||file.size>1048576)throw Error('Unsupported file');
    const payload=validateRepoNerveHandoff(JSON.parse(await file.text()),snapshot.repos);
    handoff=payload;
    $('gatewayRepoNerveStatus').textContent=
      'Local file accepted: '+payload.rows.size+' public IDs, scan '+new Date(payload.observedAt).toLocaleString()+
      '. Browser memory only; no upload or CI claim.';
    $('gatewayRepoNerveClear').hidden=false;
    render();
  }catch{
    clearHandoff('Handoff rejected. Only the exact public-only RepoNerve export, with known public GitHub IDs and no extra fields, is accepted.');
    render();
  }finally{$('gatewayRepoNerveFile').value='';}
}
async function refreshPublic(manual=false){
  if(refreshing||!snapshot)return;
  refreshing=true;$('gatewayRefresh').disabled=true;
  try{localStorage.setItem(AUTO_CHECK_KEY,String(Date.now()));}catch{}
  status('Checking all public GitHub pages…');
  try{
    const repos=await fetchPublicInventory();
    const next=parseSnapshot({...snapshot,scope:'public',complete:true,source:'Fully paginated anonymous GitHub REST public owner listing',fetchedAt:new Date().toISOString(),repos});
    snapshot=next;
    evidence={relationships:null,deployments:null};
    clearHandoff('Public snapshot refreshed. Previous local observations cleared; import a newly reviewed public handoff if needed.');
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(next));}catch{}
    setHealthRepoOptions();
    $('gatewayHealthResult').textContent='Public inventory updated. Choose a project to check its CI.';
    render();
    void loadEvidenceFor(next);
    status('Public catalog refreshed from GitHub. All pages validated; private repositories excluded.');
  }catch(error){
    status('GitHub refresh unavailable. Showing last complete public snapshot ('+snapshot.repos.length+' projects).');
    if(manual)console.warn('Public catalog refresh did not finish',error);
  }finally{refreshing=false;$('gatewayRefresh').disabled=false;}
}
async function boot(){
  $('gatewaySearch').addEventListener('input',event=>{query=event.target.value.trim().toLowerCase();render();});
  $('gatewaySort').addEventListener('change',event=>{sort=event.target.value;render();});
  $('gatewayReset').onclick=()=>{category='';query='';$('gatewaySearch').value='';render();};
  $('gatewayRefresh').onclick=()=>void refreshPublic(true);
  $('gatewayHealthCheck').onclick=()=>void checkHealthCi();
  $('gatewayRepoNerveFile').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)void importHandoff(file);});
  $('gatewayRepoNerveClear').onclick=()=>{clearHandoff();render();};
  try{
    const response=await fetch('../repos.json',{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Bundled catalog unavailable');
    const bundled=parseSnapshot(await response.json());
    let saved=null;try{saved=localStorage.getItem(CACHE_KEY);}catch{}
    snapshot=newerPublicCache(saved,bundled)||bundled;
    setHealthRepoOptions();
    render();
    void loadEvidenceFor(snapshot);
    void loadHealthFor(snapshot);
    status('Complete public snapshot loaded. Browser checks GitHub at most daily when stale.');
    let lastAttempt=null,enabled=true;
    try{lastAttempt=localStorage.getItem(AUTO_CHECK_KEY);enabled=localStorage.getItem(AUTO_REFRESH_KEY)!=='off';}catch{}
    if(autoRefreshDue(enabled,lastAttempt,snapshot.fetchedAt))void refreshPublic();
  }catch(error){
    status('Public inventory could not be verified. Browse the existing Phitarium or GitHub directory.');
    $('gatewayProjects').textContent='The catalog is temporarily unavailable. Existing project links remain accessible.';
    console.warn('Gateway snapshot rejected',error);
  }
}
void boot();
