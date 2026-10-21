import {projectId} from './project-links.js';

export const DESTINATION_MAX_AGE=7*86400000;
/** HTTPS public destinations only; exclude code hosts and local/private addresses. */
export function publicDestination(value){
  try{
    const url=new URL(value),host=url.hostname.toLowerCase().replace(/\.$/,'');
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!host.includes('.')||host.endsWith('.local')||host.endsWith('.localhost')||host.endsWith('.internal')||host==='localhost'||host.includes(':')||/^\d+(?:\.\d+){3}$/.test(host)||['github.com','api.github.com','raw.githubusercontent.com','example.com','example.org'].includes(host))return null;
    return url.href;
  }catch{return null;}
}

export function destinationCandidate(repo){
  return publicDestination(repo.homepage)||(repo.pages?`https://michaelwave369.github.io/${repo.name}/`:null);
}

async function htmlMarker(response){
  if(!response.body)return false;
  const reader=response.body.getReader(),decoder=new TextDecoder();let inspected='',bytes=0;
  try{
    while(bytes<8192){
      const {done,value}=await reader.read();if(done)break;
      const part=value.subarray(0,8192-bytes);bytes+=part.byteLength;inspected+=decoder.decode(part,{stream:true});
      if(/<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(inspected))return true;
    }
    return false;
  }finally{await reader.cancel();}
}

/** A bounded reachability observation, never a full application certification. */
export async function probeDestination(repo,fetcher=fetch,now=Date.now()){
  const candidateUrl=destinationCandidate(repo),base={projectId:projectId(repo),candidateUrl,checkedAt:new Date(now).toISOString()};
  if(!candidateUrl)return {...base,status:'inconclusive',reason:'No eligible public HTTPS destination is declared.'};
  let url=candidateUrl;
  try{
    for(let redirects=0;redirects<=5;redirects++){
      const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/html','User-Agent':'FieldConstellation-public-destination-check/3.0'}});
      const contentType=response.headers.get('content-type')||'';
      if(response.status>=300&&response.status<400&&response.headers.get('location')){
        await response.body?.cancel();
        const target=publicDestination(new URL(response.headers.get('location'),url).href);
        if(!target)return {...base,status:'inconclusive',reason:'Redirect did not remain on an eligible public HTTPS destination.'};
        url=target;continue;
      }
      const eligible=response.status>=200&&response.status<300&&/^text\/html(?:;|$)/i.test(contentType);
      const html=eligible?await htmlMarker(response):false;
      if(!eligible)await response.body?.cancel();
      const status=eligible&&html?'reachable':[401,403,429].includes(response.status)?'inconclusive':'unavailable';
      return {...base,url,httpStatus:response.status,contentType,status,reason:status==='reachable'?'HTTPS HTML document observed; application features not tested.':status==='inconclusive'?'The check was restricted or rate limited; availability is unknown.':'HTTP '+response.status+' or no recognizable HTML document in the first 8 KiB.'};
    }
    return {...base,status:'inconclusive',reason:'The bounded redirect limit was reached.'};
  }catch{return {...base,status:'inconclusive',reason:'The request timed out or could not be completed; availability is unknown.'};}
}

export function destinationStatus(repo,ledger,now=Date.now()){
  const candidate=destinationCandidate(repo);
  const check=ledger?.schemaVersion===1&&ledger.owner==='MichaelWave369'?ledger.checks?.find(c=>c.projectId===projectId(repo)&&c.candidateUrl===candidate):null;
  if(!candidate)return {state:'none',label:'No public destination declared',detail:'No eligible HTTPS homepage or Pages destination is recorded. The repository and its documentation are available below.',url:null};
  if(!check)return {state:'unchecked',label:'Destination not checked',detail:'A public destination is declared, but a Pages flag or homepage alone does not confirm a working site.',candidate,url:null};
  const checked=Date.parse(check.checkedAt),age=now-checked;
  if(!Number.isFinite(checked)||age< -60000||age>DESTINATION_MAX_AGE)return {state:'stale',label:'Destination check is stale',detail:'The last check is more than seven days old or has an invalid date. Recheck before treating this destination as available.',candidate,url:null,check};
  if(check.status==='reachable'&&check.httpStatus>=200&&check.httpStatus<300&&/^text\/html(?:;|$)/i.test(check.contentType||'')&&publicDestination(check.url))return {state:'reachable',label:'HTML destination checked',detail:'An HTTPS HTML response was available at the recorded check time. This does not test every application feature or iframe support.',candidate,url:check.url,check};
  if(check.status==='unavailable')return {state:'unavailable',label:'Unavailable at last check',detail:check.reason||'The destination did not return an available HTML page. This may be temporary.',candidate,url:null,check};
  return {state:'inconclusive',label:'Destination check inconclusive',detail:check.reason||'The destination could not be checked from the verification environment. This is not proof the site is down.',candidate,url:null,check};
}
