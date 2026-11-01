/**
 * An editorial route across real, public repository stars.
 * These are thematic exhibits, never architecture claims or deployment receipts.
 */
export const IMMERSIVE_STARS=Object.freeze([
  'FieldConstellation','FieldAtlas','PhiOS','Agentora','Domistika','BTM',
  'Pulse369','CycleWeave','PhiServe','PhiXRCommons','GenEWrist','FieldAccord'
]);

export function resolveImmersiveExhibits(repos){
  const available=new Map(repos.filter(repo=>repo.visibility==='public')
    .map(repo=>[repo.name.toLowerCase(),repo]));
  const seen=new Set();
  return IMMERSIVE_STARS.map(name=>available.get(name.toLowerCase()))
    .filter(repo=>{
      if(!repo||seen.has(repo.id))return false;
      seen.add(repo.id);return true;
    });
}

/**
 * A site check is meaningful only within its stated seven-day window.
 * Missing or expired checks must never be represented as zero working sites.
 */
export const RECENT_CHECK_WINDOW_MS=7*86400000;
export function recentCheckSummary(repos,ledger,now=Date.now()){
  const checked=Date.parse(ledger?.checkedAt);
  if(!ledger||ledger.schemaVersion!==1||ledger.owner!=='MichaelWave369'||
     !Number.isFinite(checked)||!Number.isFinite(now)){
    return {count:null,label:'not verified',detail:'No valid dated public destination verification snapshot is available.'};
  }
  const age=now-checked;
  if(age< -60000||age>RECENT_CHECK_WINDOW_MS){
    return {count:null,label:'checks expired',
      detail:'The last destination verification snapshot is dated '+new Date(checked).toISOString().slice(0,10)+'. Checks are valid for seven days. Expired evidence is not proof a site is down.'};
  }
  const validIds=new Set(repos.filter(repo=>repo.visibility==='public').map(repo=>'github:'+repo.id));
  const visited=new Set();
  for(const check of ledger.checks||[]){
    if(!check||!validIds.has(check.projectId)||visited.has(check.projectId))continue;
    const at=Date.parse(check.checkedAt);
    if(check.status!=='reachable'||!Number.isFinite(at)||now-at>RECENT_CHECK_WINDOW_MS||
       now-at< -60000||!Number.isInteger(check.httpStatus)||check.httpStatus<200||check.httpStatus>=300||
       !/^text\/html(?:;|$)/i.test(check.contentType||''))continue;
    visited.add(check.projectId);
  }
  return {count:visited.size,label:'HTML checked ≤7d',
    detail:visited.size+' recent recorded 2xx HTML destination checks. This does not certify app health, functionality or integration.'};
}
