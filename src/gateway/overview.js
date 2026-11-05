import {parseSnapshot,newerPublicCache,fetchPublicInventory,CACHE_KEY,AUTO_REFRESH_KEY,AUTO_CHECK_KEY,autoRefreshDue} from '../inventory.js';
import {ARCHITECTURE_GROUPS,architectureFor,architectureCounts} from '../architecture-taxonomy.js';
import {sortRepositoryList} from '../sort.js';

const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let snapshot=null,category='',query='',sort='name',refreshing=false;
const overviewUrl=repo=>'../index.html?repo=github:'+encodeURIComponent(repo.id);
const groupName=new Map(ARCHITECTURE_GROUPS.map(g=>[g.id,g.name]));

function render(){
  if(!snapshot)return;
  const repos=snapshot.repos,counts=architectureCounts(repos);
  $('gatewayCount').textContent=String(repos.length);
  $('gatewayDate').textContent='As of '+new Date(snapshot.fetchedAt).toLocaleString();
  $('gatewayCategoryCount').textContent=String(ARCHITECTURE_GROUPS.length);
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
async function refreshPublic(manual=false){
  if(refreshing||!snapshot)return;
  refreshing=true;$('gatewayRefresh').disabled=true;
  try{localStorage.setItem(AUTO_CHECK_KEY,String(Date.now()));}catch{}
  status('Checking all public GitHub pages…');
  try{
    const repos=await fetchPublicInventory();
    const next=parseSnapshot({...snapshot,scope:'public',complete:true,source:'Fully paginated anonymous GitHub REST public owner listing',fetchedAt:new Date().toISOString(),repos});
    snapshot=next;
    try{localStorage.setItem(CACHE_KEY,JSON.stringify(next));}catch{}
    render();
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
  try{
    const response=await fetch('../repos.json',{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('Bundled catalog unavailable');
    const bundled=parseSnapshot(await response.json());
    let saved=null;try{saved=localStorage.getItem(CACHE_KEY);}catch{}
    snapshot=newerPublicCache(saved,bundled)||bundled;
    render();
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
