/**
 * Read-only hierarchy for the public Field Gateway.
 * The source must be an already validated PUBLIC inventory snapshot.
 * A category is editorial placement, never an installation or dependency.
 */
import {ARCHITECTURE_GROUPS,architectureFor} from '../architecture-taxonomy.js';

export const PHIOS_SURFACES=Object.freeze([
  {name:'PhiOS',label:'PhiOS Core',note:'Governed OS and operator runtime; alpha'},
  {name:'phi-field',label:'PhiOS Web',note:'Public web entry and app-shell direction'},
  {name:'PhiOS-Mobile',label:'PhiOS Mobile',note:'Touch-first PWA and Android launcher prototype'},
  {name:'PhiOS-XR',label:'PhiOS XR',note:'Experimental browser and WebXR shell'}
]);

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function buildHierarchy(repositories,visible=repositories){
  const byName=new Map(repositories.map(repo=>[repo.name.toLowerCase(),repo]));
  const platform=PHIOS_SURFACES.flatMap(surface=>{
    const repo=byName.get(surface.name.toLowerCase());
    return repo?[{...surface,repo}]:[];
  });
  const pinned=new Set(platform.map(surface=>String(surface.repo.id)));
  const groups=ARCHITECTURE_GROUPS.map(group=>({
    group,
    repos:visible.filter(repo=>!pinned.has(String(repo.id))&&architectureFor(repo).id===group.id)
  }));
  return {platform,groups,branchCount:groups.reduce((sum,item)=>sum+item.repos.length,0)};
}

function projectRow(repo,projectUrl){
  const placement=architectureFor(repo);
  const note=placement.basis==='curated'?'Curated placement':
    placement.basis==='owner-topic'?'Owner-tagged':
    placement.basis==='repository-archive'?'Historical / archive':
    placement.basis==='suggested-needs-review'?'Suggested · review needed':
    'Review needed';
  return '<li><a href="'+escape(projectUrl(repo))+'">'+escape(repo.name)+'</a>'+
    '<span>'+escape(note)+'</span></li>';
}

/** Preserve user-expanded branches through searches and inventory refreshes. */
export function renderHierarchy(container,repositories,visible,projectUrl,filtered=false){
  const model=buildHierarchy(repositories,visible);
  const initialized=container.dataset.initialized==='true';
  const expanded=new Set(Array.from(container.querySelectorAll('details[open]'),element=>element.dataset.role));
  const platformMarkup=model.platform.map(surface=>
    '<li><a href="'+escape(projectUrl(surface.repo))+'"><strong>'+escape(surface.label)+'</strong></a>'+
    '<span>'+escape(surface.note)+'</span></li>'
  ).join('');
  const groups=model.groups.filter(item=>!filtered||item.repos.length).map(item=>{
    const group=item.group;
    const open=filtered||expanded.has(group.id)||(!initialized&&group.id==='CORE_OS');
    return '<details data-role="'+escape(group.id)+'"'+(open?' open':'')+'>'+
      '<summary style="--tree-accent:'+group.color+'"><span>'+escape(group.name)+'</span><b>'+item.repos.length+'</b></summary>'+
      '<ul>'+item.repos.map(repo=>projectRow(repo,projectUrl)).join('')+
      (item.repos.length?'':'<li class="tree-empty">No public projects in this branch.</li>')+'</ul>'+
      '</details>';
  }).join('');
  container.innerHTML=
    '<div class="tree-root"><strong>Φ PhiOS ecosystem</strong><span>Architecture, not installation topology</span></div>'+
    '<div class="tree-stem" aria-hidden="true"></div>'+
    '<div class="tree-platform"><h4>Platform family <small>'+model.platform.length+' public project records</small></h4>'+
    '<ul>'+platformMarkup+'</ul></div>'+
    '<div class="tree-stem" aria-hidden="true"></div>'+
    '<div class="tree-branches"><h4>Subsystem branches <small>'+model.branchCount+' matching projects</small></h4>'+
    (groups||'<p class="tree-empty">No matching branch projects. Clear your filters.</p>')+'</div>'+
    '<p class="tree-disclaimer">Public inventory only. Each repository appears once in this hierarchy. Placement does not verify a dependency, shared runtime, working installation or deployment. Unreviewed projects remain visibly provisional.</p>';
  container.dataset.initialized='true';
}
