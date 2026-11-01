import {destinationStatus} from './destinations.js';

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
  // Reuse the original bounded HTTPS verification contract, which also
  // binds each receipt to the *current* declared candidate URL.
  const count=repos.filter(repo=>repo.visibility==='public'&&
    destinationStatus(repo,ledger,now).state==='reachable').length;
  return {count,label:'HTML checked ≤7d',
    detail:count+' recent recorded 2xx HTML destination checks. This does not certify app health, functionality or integration.'};
}
