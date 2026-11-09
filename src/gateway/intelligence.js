/**
 * Public, evidence-grounded project inspector for the Field Gateway.
 * Source-reviewed links and dated HTML checks are not production/CI assertions.
 * An optional RepoNerve file is validated in memory; no localhost fetch or upload.
 */
import {architectureFor,ARCHITECTURE_GROUPS} from '../architecture-taxonomy.js';
import {projectId} from '../project-links.js';
import {resolveRelationships,relatedProjects,RELATIONSHIP_STYLES,validateRelationship} from '../relationships.js';
import {destinationStatus} from '../destinations.js';

const OWNER='MichaelWave369';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keysEqual=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
const dateText=value=>timestamp(value)?new Date(value).toLocaleString():'Not recorded';

/** Reject raw private RepoNerve API responses and arbitrary JSON, not merely hide fields. */
export function validateRepoNerveHandoff(value,publicRepos,now=Date.now()){
  const header=['schemaVersion','source','scope','owner','observedAt','repositories'];
  if(!keysEqual(value,header)||value.schemaVersion!==1||value.source!=='PhiRepoNerve'||
    value.scope!=='public-ids-only'||value.owner!==OWNER||!timestamp(value.observedAt)||
    Date.parse(value.observedAt)>now+60000||!Array.isArray(value.repositories)||
    value.repositories.length>10000)throw Error('Unsupported public handoff. No data imported.');
  const allowed=new Set(publicRepos.filter(repo=>repo.visibility==='public').map(repo=>String(repo.id)));
  const rows=new Map();
  for(const record of value.repositories){
    if(!keysEqual(record,['id','pushedAt','archived'])||typeof record.id!=='string'||
      !/^[1-9]\d*$/.test(record.id)||!allowed.has(record.id)||
      (record.pushedAt!==null&&(!timestamp(record.pushedAt)||Date.parse(record.pushedAt)>now+60000))||
      typeof record.archived!=='boolean'||rows.has(record.id))
      throw Error('Handoff contains an unknown identity or unapproved field. No data imported.');
    rows.set(record.id,{pushedAt:record.pushedAt,archived:record.archived});
  }
  return {observedAt:value.observedAt,rows};
}

async function fetchJson(url,fetcher){
  const response=await fetcher(url,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Public evidence unavailable');
  return response.json();
}

export async function loadProjectEvidence(publicRepos,fetcher=fetch){
  const results=await Promise.allSettled([
    fetchJson('../relationships.json',fetcher),
    fetchJson('../deployments.json',fetcher),
  ]);
  let relationships=null,deployments=null;
  if(results[0].status==='fulfilled'){
    try{
      const ledger=results[0].value;
      if(!ledger||ledger.schemaVersion!==1||ledger.owner!==OWNER||
        !Array.isArray(ledger.relationships)||!ledger.relationships.every(r=>validateRelationship(r,publicRepos)))
        throw Error('Invalid public relationship ledger');
      relationships=resolveRelationships(publicRepos,ledger);
    }catch{/* preserve explicit evidence-unavailable state */}
  }
  if(results[1].status==='fulfilled'){
    const data=results[1].value;
    if(data?.schemaVersion===1&&data.owner===OWNER&&Array.isArray(data.checks))deployments=data;
  }
  return {relationships,deployments};
}

export function renderProjectIntelligence(repo,context={}){
  const {snapshotAt,relationships=null,deployments=null,handoff=null}=context;
  const placement=architectureFor(repo);
  const group=ARCHITECTURE_GROUPS.find(item=>item.id===placement.id);
  const discovered=relationships===null?null:relatedProjects(repo,relationships);
  const destination=deployments===null?null:destinationStatus(repo,deployments);
  const local=handoff?.rows.get(String(repo.id))??null;
  const found=discovered===null?
    '<p>Relationship ledger unavailable. No integration conclusion can be drawn.</p>':
    discovered.length?
      '<ul class="intel-relations">'+discovered.slice(0,12).map(item=>{
        const relation=item.relation,grade=RELATIONSHIP_STYLES[relation.status]?.label||'Source record';
        const sources=relation.evidence.slice(0,2).map((e,i)=>
          '<a href="'+escape(e.url)+'" target="_blank" rel="noopener noreferrer">Source '+(i+1)+'</a>'
        ).join(' · ');
        return '<li><strong>'+escape(item.repo.name)+'</strong> <small>'+escape(item.direction)+' · '+escape(grade)+'</small>'+
          '<p>'+escape(relation.summary)+'</p><p>Reviewed '+escape(dateText(relation.reviewedAt))+
          ' · '+sources+'</p><details><summary>Scope and limitations</summary><p>'+escape(relation.scope)+'</p></details></li>';
      }).join('')+'</ul>'+
      (discovered.length>12?'<p>More recorded links: open the Phitarium project inspector.</p>':''):
      '<p>No relationship for this project is recorded in the reviewed public ledger. This does not mean there is no integration.</p>';
  const destinationLabel=destination?
    escape(destination.label)+' · '+escape(destination.detail)+
      (destination.url?' <a href="'+escape(destination.url)+'" target="_blank" rel="noopener noreferrer">Visit observed HTML page</a>':''):
    'Destination checks unavailable. No availability claim.';
  const localSection=handoff?
    (local?'<p>RepoNerve complete scan observed '+escape(dateText(handoff.observedAt))+
      '. Last push timestamp: '+escape(local.pushedAt?dateText(local.pushedAt):'not reported')+
      '. Archived in that scan: '+(local.archived?'yes':'no')+'. This is not CI evidence.</p>':
      '<p>No matching public RepoNerve observation in this imported file.</p>'):
    '<p>No local RepoNerve handoff loaded. The private observer is never queried by this site.</p>';
  return '<div class="intel-content">'+
    '<p class="intel-kicker">PUBLIC PROJECT INTELLIGENCE · READ ONLY</p>'+
    '<p>'+escape(repo.description||'No public description recorded.')+'</p>'+
    '<dl class="intel-facts">'+
      '<div><dt>Architectural role</dt><dd>'+escape(group?.name??placement.id)+' <small>('+escape(placement.basis)+')</small></dd></div>'+
      '<div><dt>Source metadata</dt><dd>'+escape(repo.language||'Unspecified')+' · '+(repo.archived?'Archived':'Not archived')+
        ' · Updated '+escape(dateText(repo.updated))+'</dd></div>'+
      '<div><dt>Inventory observation</dt><dd>'+escape(dateText(snapshotAt))+' · Public GitHub snapshot; not a build report</dd></div>'+
      '<div><dt>Public destination</dt><dd>'+destinationLabel+'</dd></div>'+
      '<div><dt>CI / installed application</dt><dd>Not verified by this public intelligence view</dd></div>'+
    '</dl>'+
    '<h5>Source-reviewed connections</h5>'+found+
    '<h5>Optional local fleet observation</h5>'+localSection+
    '<p class="intel-actions"><a href="'+escape(repo.url)+'" target="_blank" rel="noopener noreferrer">GitHub source</a>'+
    ' · <a href="../index.html?repo='+encodeURIComponent(projectId(repo))+'">Open Phitarium inspector</a></p>'+
    '<p class="intel-scope">A classified app is only a candidate; a recorded source bridge is not proof it works end to end. Observations do not authorize agent actions.</p>'+
    '</div>';
}
