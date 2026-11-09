/**
 * Φ Ecosystem Health R1.
 * A read-only public evidence board, NOT production health certification.
 * Unknown, expired and missing observations never become green or broken.
 */
import {destinationStatus} from '../destinations.js';

const OWNER='MichaelWave369';
const DAY=86400000;
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const dateOk=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
const dateText=v=>dateOk(v)?new Date(v).toLocaleString():'Unrecorded';
const age=(date,now)=>now-Date.parse(date);
const validTime=(date,now)=>dateOk(date)&&Date.parse(date)<=now+60000;
const validGithubName=name=>typeof name==='string'&&/^[A-Za-z0-9_.-]{1,100}$/.test(name);
const stats=(states,kind)=>states.filter(x=>x===kind).length;
export const HEALTH_CI_MAX_AGE=14*DAY;
export const HEALTH_PUBLICATION_MAX_AGE=7*DAY;
export const HEALTH_INVENTORY_MAX_AGE=2*DAY;

/** Reviewed public observations must be structurally exact and bounded. */
export function validateHealthObservations(payload,now=Date.now()){
  if(!exact(payload,['schemaVersion','owner','scope','reviewedAt','ci','publication'])||
    payload.schemaVersion!==1||payload.owner!==OWNER||payload.scope!=='public-reviewed-observations'||
    !validTime(payload.reviewedAt,now)||!Array.isArray(payload.ci)||payload.ci.length>200)
    throw Error('Invalid public health observation ledger');
  const ci=[];
  const seen=new Set();
  for(const record of payload.ci){
    if(!exact(record,['repositoryId','repository','prNumber','headSha','runId','workflow','event','conclusion','observedAt'])||
      !/^[1-9]\d*$/.test(String(record.repositoryId))||!validGithubName(record.repository)||
      !Number.isSafeInteger(record.prNumber)||record.prNumber<1||
      !Number.isSafeInteger(record.runId)||record.runId<1||
      !/^[0-9a-f]{40}$/.test(record.headSha)||
      typeof record.workflow!=='string'||record.workflow.length>150||
      record.event!=='pull_request'||!['success','failure','cancelled'].includes(record.conclusion)||
      !validTime(record.observedAt,now)||age(record.observedAt,now)<-60000||
      seen.has(record.repositoryId+':'+record.runId))throw Error('Malformed reviewed CI observation');
    seen.add(record.repositoryId+':'+record.runId);
    ci.push({...record,repositoryId:String(record.repositoryId)});
  }
  const p=payload.publication;
  if(!exact(p,['site','deployAt','deployState','mergedAt','observedAt','productionHasHierarchy','githubPagesHasHierarchy','productionUrl','pagesUrl','detail'])||
    p.site!=='www.enterthefield.org'||p.deployState!=='ready'||
    !validTime(p.deployAt,now)||!validTime(p.mergedAt,now)||!validTime(p.observedAt,now)||
    typeof p.productionHasHierarchy!=='boolean'||typeof p.githubPagesHasHierarchy!=='boolean'||
    p.productionUrl!=='https://www.enterthefield.org/'||
    p.pagesUrl!=='https://michaelwave369.github.io/FieldConstellation/gateway/index.html'||
    typeof p.detail!=='string'||p.detail.length>750||
    age(p.observedAt,now)<-60000)throw Error('Malformed public release observation');
  return {ci,publication:p,reviewedAt:payload.reviewedAt};
}

/**
 * A success is the conclusion of ONE cited PR run; not a repo-wide green status.
 * The current public snapshot determines which immutable IDs can be displayed.
 */
export function summarizeHealth(repos,{deployments=null,relationships=null,observations=null,snapshotAt=null}={},now=Date.now()){
  const rows=Array.isArray(repos)?repos.filter(repo=>repo.visibility==='public'):[];
  const byId=new Map(rows.map(repo=>[String(repo.id),repo]));
  const destinations=rows.map(repo=>deployments?destinationStatus(repo,deployments,now).state:'unknown');
  const ci=(observations?.ci??[]).flatMap(entry=>{
    const repo=byId.get(entry.repositoryId);
    if(!repo||repo.name!==entry.repository)return [];
    const fresh=age(entry.observedAt,now)>=-60000&&age(entry.observedAt,now)<=HEALTH_CI_MAX_AGE;
    return [{...entry,fresh,repo}];
  });
  const covered=new Set(ci.filter(item=>item.fresh).map(item=>item.repositoryId)).size;
  const publication=observations?.publication??null;
  const observedGap=Boolean(publication&&publication.githubPagesHasHierarchy&&!publication.productionHasHierarchy&&
    Date.parse(publication.deployAt)<Date.parse(publication.mergedAt));
  const publicationFresh=Boolean(publication&&age(publication.observedAt,now)>=-60000&&
    age(publication.observedAt,now)<=HEALTH_PUBLICATION_MAX_AGE);
  const inventoryFresh=Boolean(dateOk(snapshotAt)&&age(snapshotAt,now)>=-60000&&
    age(snapshotAt,now)<=HEALTH_INVENTORY_MAX_AGE);
  return {
    total:rows.length,ci,covered,ciUnknown:rows.length-covered,
    recentPrPasses:ci.filter(item=>item.fresh&&item.conclusion==='success').length,
    recentPrFailures:ci.filter(item=>item.fresh&&item.conclusion==='failure').length,
    destination:{
      reachable:stats(destinations,'reachable'),
      unavailable:stats(destinations,'unavailable'),
      stale:stats(destinations,'stale'),
      unchecked:stats(destinations,'unchecked'),
      none:stats(destinations,'none'),
      inconclusive:stats(destinations,'inconclusive'),
      unknown:stats(destinations,'unknown')
    },
    relationshipCount:Array.isArray(relationships)?relationships.length:null,
    observedGap,publicationFresh,publication,
    inventoryFresh,snapshotAt
  };
}

export function renderHealthBoard(model){
  const d=model.destination;
  const counts=[
    ['Cited PR checks passed',model.recentPrPasses,'Passing a PR check is not a deployed app'],
    ['Fresh HTML observations',d.reachable,'HTTP HTML only; not feature acceptance'],
    ['Evidence needs refresh',d.stale,'Last destination observations are older than 7 days'],
    ['CI coverage unknown',model.ciUnknown,'Not checked by this small reviewed sample']
  ];
  const cards=counts.map(([label,value,detail])=>
    '<div class="health-stat"><strong>'+value+'</strong><span>'+escape(label)+'</span><small>'+escape(detail)+'</small></div>').join('');
  const p=model.publication;
  const gap=model.observedGap;
  const releaseMessage=!p?
    '<p>No verified public-domain publication comparison is available.</p>':
    '<p>'+((gap&&model.publicationFresh)?
      '<strong>Action: review publication mismatch.</strong> The last inspected Netlify production gateway lacked the hierarchy present on GitHub Pages.':
      (gap?'A previous publication gap was recorded. <strong>Recheck both sites before treating it as current.</strong>':
        'No publication mismatch was recorded in this bounded check; that is not proof of deployment parity.'))+
    ' Production deploy marked '+escape(p.deployState)+' on '+escape(dateText(p.deployAt))+
    '; observed after the merged change on '+escape(dateText(p.observedAt))+
    '. <a href="'+escape(p.productionUrl)+'" target="_blank" rel="noopener noreferrer">Production page</a> · '+
    '<a href="'+escape(p.pagesUrl)+'" target="_blank" rel="noopener noreferrer">GitHub Pages</a></p>';
  const tasks=[];
  if(gap&&model.publicationFresh)tasks.push('Review Netlify publish source, build output and deploy parity before cutover.');
  if(gap&&!model.publicationFresh)tasks.push('Recheck the previously observed production/GitHub Pages discrepancy.');
  if(!model.inventoryFresh)tasks.push('Refresh the public repository inventory; the current source snapshot is old or unavailable.');
  if(d.unavailable)tasks.push('Recheck '+d.unavailable+' recent unavailable HTML destinations. HTTP checks alone do not diagnose the app.');
  if(d.stale)tasks.push('Recheck '+d.stale+' stale destination observations before declaring any project online or offline.');
  if(model.recentPrFailures)tasks.push('Inspect '+model.recentPrFailures+' cited recent failing PR workflow run(s); not proof of main-branch failure.');
  if(!tasks.length)tasks.push('No actionable failures are established by this limited public evidence. Continue broadening verified coverage.');
  const taskHtml=tasks.map((task,i)=>'<li><span>'+(i+1)+'</span>'+escape(task)+'</li>').join('');
  const checks=model.ci.length?model.ci.map(item=>{
    const link='https://github.com/'+OWNER+'/'+item.repo.name+'/actions/runs/'+item.runId;
    return '<li><b>'+escape(item.repo.name)+'</b> · '+escape(item.workflow)+
      ' · <strong>'+escape(item.conclusion)+'</strong>'+(!item.fresh?' (stale review)':'')+
      ' · <a href="'+escape(link)+'" target="_blank" rel="noopener noreferrer">Run #'+item.runId+'</a>'+
      '<small>PR #'+item.prNumber+' · head '+escape(item.headSha.slice(0,9))+
      ' · observed '+escape(dateText(item.observedAt))+
      ' · result scoped to this run, not current main or production</small></li>';
  }).join(''):'<li>No CI run from the reviewed public snapshot matches the current catalog.</li>';
  return '<div class="health-stats">'+cards+'</div>'+
    '<div class="health-release"><h4>Release parity · www.enterthefield.org</h4>'+releaseMessage+'</div>'+
    '<div class="health-layout"><section><h4>Attention queue</h4><ol class="health-tasks">'+taskHtml+'</ol></section>'+
    '<section><h4>Evidence boundaries</h4><p>'+d.unavailable+
      ' fresh HTML checks reported unavailable, '+d.inconclusive+' inconclusive, '+d.unchecked+
      ' unchecked, '+d.none+' without declared destination. '+d.unknown+
      ' currently have unavailable evidence. These are <em>not</em> counts of broken projects.</p>'+
      '<p>'+ (model.relationshipCount===null?'Source connection ledger unavailable.':
      model.relationshipCount+' source-reviewed connection records; none certifies end-to-end service health.')+
      '</p><p>Public inventory: '+model.total+' projects; last bundled or browser snapshot '+escape(dateText(model.snapshotAt))+
      (model.inventoryFresh?' (recent).':' (refresh needed).')+'</p></section></div>'+
    '<details class="health-ci"><summary>Review '+model.ci.length+' cited PR workflow observations</summary><ul>'+checks+'</ul></details>'+
    '<p class="health-footnote">Health signals are evidence-scoped, not fleet-wide certification. No token, private RepoNerve ledger, GitHub authentication, automated agent or production deployment is used. Unknown must stay unknown.</p>';
}

/** One anonymous GitHub Actions read, only after an explicit button click. */
export async function inspectPublicCi(repo,fetcher=fetch){
  if(!repo||repo.visibility!=='public'||!validGithubName(repo.name)||
    typeof repo.branch!=='string'||!/^[A-Za-z0-9_.\/-]{1,200}$/.test(repo.branch))
    throw Error('Select a public GitHub project');
  const url='https://api.github.com/repos/'+OWNER+'/'+encodeURIComponent(repo.name)+
    '/actions/runs?per_page=5&branch='+encodeURIComponent(repo.branch);
  const response=await fetcher(url,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Public Actions API unavailable or rate limited');
  const data=await response.json();
  if(!data||!Array.isArray(data.workflow_runs))throw Error('No verifiable public Actions response');
  const runs=data.workflow_runs.filter(run=>run&&Number.isSafeInteger(run.id)&&run.id>0&&
    typeof run.name==='string'&&typeof run.status==='string'&&
    typeof run.head_sha==='string'&&/^[a-f0-9]{40}$/.test(run.head_sha)&&
    run.head_branch===repo.branch&&run.repository?.full_name===OWNER+'/'+repo.name);
  const newest=runs[0];
  if(!newest)return {state:'unknown',text:'No matching public workflow run returned for this branch.'};
  const state=newest.status==='completed'?
    (newest.conclusion==='success'?'observed-success':newest.conclusion==='failure'?'observed-failure':'observed-other'):
    'in-progress';
  return {state,runId:newest.id,repoName:repo.name,name:newest.name,
    conclusion:newest.conclusion||null,headSha:newest.head_sha,
    branch:repo.branch,event:typeof newest.event==='string'?newest.event:'unreported',
    observedAt:new Date().toISOString()};
}

export function renderCiLookup(result){
  if(!result||result.state==='unknown')return '<p>Unknown: '+escape(result?.text||'No confirmed CI result')+'</p>';
  const link='https://github.com/'+OWNER+'/'+result.repoName+'/actions/runs/'+result.runId;
  return '<p><strong>'+escape(result.repoName)+' · '+escape(result.conclusion||result.state)+
    '</strong> · '+escape(result.name)+'. '+
    '<a href="'+escape(link)+'" target="_blank" rel="noopener noreferrer">Inspect GitHub run</a><br>'+
    '<small>Branch '+escape(result.branch)+' · '+escape(result.event)+' · commit '+escape(result.headSha.slice(0,12))+
    ' · checked '+escape(dateText(result.observedAt))+
    '. This run alone does not certify current HEAD, an installation or production.</small></p>';
}
