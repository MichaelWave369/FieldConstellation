import {projectId} from './project-links.js';
import {reviewedAtlasIds,ATLAS_URL} from './atlas-lens.js';
import {publishedAtlasIds,ATLAS_PUBLISHED_SOURCE} from './atlas-published.js';

export const COVERAGE_KIND='field-constellation-atlas-coverage-v1';
const PROJECT_RE=/^github:[1-9]\d{0,19}$/;
const REPO_RE=/^[\w.-]{1,100}$/;

/** Public evidence-only source validation. Invalid sources are NOT empty coverage. */
function validPublished(snapshot){
  if(!snapshot||snapshot.schemaVersion!==1||snapshot.owner!=='MichaelWave369'||
    snapshot.sourceUrl!==ATLAS_PUBLISHED_SOURCE||!Number.isFinite(Date.parse(snapshot.sourceGeneratedAt))||
    !Number.isSafeInteger(snapshot.verifiedCount)||snapshot.verifiedCount<0||
    !Array.isArray(snapshot.pages)||snapshot.pages.length!==snapshot.verifiedCount||
    snapshot.pages.length>1000)return false;
  const seenId=new Set(),seenRepo=new Set();
  for(const row of snapshot.pages){
    if(!row||typeof row.projectId!=='string'||!PROJECT_RE.test(row.projectId)||
      typeof row.repo!=='string'||!REPO_RE.test(row.repo)||seenId.has(row.projectId)||
      seenRepo.has(row.repo.toLowerCase())||typeof row.url!=='string'||row.url.length>2000)return false;
    let u;try{u=new URL(row.url);}catch{return false;}
    if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return false;
    seenId.add(row.projectId);seenRepo.add(row.repo.toLowerCase());
  }
  return true;
}
function validReviewed(atlas){
  return Boolean(atlas&&atlas.schemaVersion===1&&atlas.owner==='MichaelWave369'&&
    atlas.url===ATLAS_URL&&Number.isFinite(Date.parse(atlas.checkedAt))&&
    Array.isArray(atlas.chapters)&&atlas.chapters.length<=1000&&
    atlas.chapters.every(id=>typeof id==='string'&&PROJECT_RE.test(id))&&
    new Set(atlas.chapters).size===atlas.chapters.length);
}

/**
 * No network calls, no browser storage, no user-specific or private project data.
 * Counts describe distinct dated observations, never app health or entire chapters.
 */
export function atlasCoverageAudit(repos,publicInventory,atlas,published){
  const publicRepos=Array.isArray(repos)?repos.filter(r=>r.visibility==='public'):[];
  const byId=new Map(publicRepos.map(r=>[projectId(r),r]));
  const reviewedValid=validReviewed(atlas);
  const publishedValid=validPublished(published);
  const matchedPublished=publishedValid?publishedAtlasIds(published,publicRepos):new Set();
  const matchedReviewed=reviewedValid?reviewedAtlasIds(atlas,publicRepos):new Set();
  const unpaired=publishedValid?published.pages.filter(row=>!matchedPublished.has(row.projectId))
    .map(row=>{
      const known=byId.get(row.projectId);
      return {
        projectId:row.projectId,
        repo:row.repo,
        reason:known?'name differs from displayed public snapshot':'not present in displayed public snapshot'
      };
    }).sort((a,b)=>a.repo.localeCompare(b.repo)||a.projectId.localeCompare(b.projectId)):[];
  const rawReviewed=reviewedValid?atlas.chapters.length:null;
  return {
    kind:COVERAGE_KIND,
    schemaVersion:1,
    publicInventory:{
      repositoryCount:publicRepos.length,
      fetchedAt:typeof publicInventory?.fetchedAt==='string'?publicInventory.fetchedAt:null,
      source:typeof publicInventory?.source==='string'?publicInventory.source:null
    },
    reviewed:{
      valid:reviewedValid,
      checkedAt:reviewedValid?atlas.checkedAt:null,
      recordedCount:rawReviewed,
      matchedCount:reviewedValid?matchedReviewed.size:null
    },
    published:{
      valid:publishedValid,
      sourceGeneratedAt:publishedValid?published.sourceGeneratedAt:null,
      verifiedHtmlCount:publishedValid?published.verifiedCount:null,
      matchedCount:publishedValid?matchedPublished.size:null,
      unmatchedCount:publishedValid?unpaired.length:null,
      unmatched:unpaired
    },
    caveats:[
      'Reviewed Atlas chapters, verified public HTML pages and live book chapters are distinct populations.',
      'A matching published site is not a successful application-level test or live availability guarantee.',
      'A missing public ID can reflect a newer publication than this displayed GitHub listing; private status is not inferred.',
      'This receipt includes public project identifiers only. It makes no requests and exports no visitor history.'
    ]
  };
}
export function atlasCoverageReceipt(repos,publicInventory,atlas,published){
  return JSON.stringify(atlasCoverageAudit(repos,publicInventory,atlas,published),null,2)+'\n';
}
