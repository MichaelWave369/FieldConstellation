/**
 * PhiOS architectural placement, separate from the Phitarium's eight artistic houses.
 * Placement is EDITORIAL. GitHub metadata cannot prove installability, dependency,
 * service health, licensing, or an operating-system installation.
 *
 * Owners can add an exact "phios-<category>" GitHub topic for future repos.
 * Untagged new projects may receive a clearly marked suggestion or fall into
 * EXPERIMENT for review. No private repository data is fetched.
 */
export const ARCHITECTURE_GROUPS = Object.freeze([
  {id:'CORE_OS',name:'PhiOS core & runtime',short:'CORE_OS',color:'#a1e2ff',center:[0,4,0]},
  {id:'AI_HOME',name:'Infinite Porch & local AI',short:'AI_HOME',color:'#c9bcff',center:[-22,16,-24]},
  {id:'APP',name:'PhiOS app candidates',short:'APP',color:'#efc88a',center:[8,15,-32]},
  {id:'LOCAL_SERVICE',name:'Local services & agents',short:'LOCAL_SERVICE',color:'#9fe8c8',center:[32,-5,-16]},
  {id:'CREATIVE_PIPELINE',name:'Creative pipeline',short:'CREATIVE_PIPELINE',color:'#e7a9da',center:[30,12,19]},
  {id:'WORLD_PORTAL',name:'Infinite Commons & worlds',short:'WORLD_PORTAL',color:'#edb17e',center:[2,17,34]},
  {id:'BRIDGE',name:'Governed bridges (proposed)',short:'BRIDGE',color:'#a8d9dd',center:[-29,-1,23]},
  {id:'RESEARCH_LIBRARY',name:'Research & libraries',short:'RESEARCH_LIBRARY',color:'#83cbd2',center:[-32,-18,-9]},
  {id:'EXPERIMENT',name:'Experiments / review queue',short:'EXPERIMENT',color:'#d0d4ab',center:[-8,-25,-31]},
  {id:'ARCHIVE',name:'Archives & historical work',short:'ARCHIVE',color:'#8593ab',center:[23,-24,-22]}
]);

const curated=Object.freeze({
  CORE_OS:'PhiOS PhiKernel PhiOS-MK1 phios-v3-stable PhiOS-Mobile PhiOS-XR PhiOS-Core PhiOS-Bubble PhiOS-BubbleGear phi-field',
  AI_HOME:'Infinite-Porch BrainC PocketBrain EVIE Memoria mempalace PorchTalk PrivateSpark SuperPhiVessel Triad369-Launchpad FrontPorchAI PhiTriBrain369',
  APP:'PhianoSheets PhiLowe PhiCade PaperGhost RetroVerse PhiOperator PhiLearn PhiScribe RecoM3ndo PHircQ FieldDeck GitPorch',
  LOCAL_SERVICE:'PhiServe PhiStream PhiRSI Agentora phibot PhiMadaPrime FieldCloudWorker JukeBot RepoReady',
  CREATIVE_PIPELINE:'parallax-pixelforge FramefieldStudio paracut PHIAudio PHIVid Domistika SiliconLouvre FieldStoryForge CineSwarm WaveForgeStudio MuseVault Phiform RastaPhi HueHatch BounceDeck',
  WORLD_PORTAL:'Infinite-Commons BTM SparkTheSubstrate RacetoOblivion ElsewhereEngine EchoesOfTheNine TweedleVerse ShedofShadows Blackout PhiXRCommons SiliconLouvre-XR The-MDF-Files',
  BRIDGE:'InfiniteInterconnects PhiBridge369 LightBridge PhiXRBridge PhiVine GenEWrist Opti-Eyes OverStrings',
  RESEARCH_LIBRARY:'Altermath NestedBubbleGear CompAware 12fold MRIPHI RegenerationAtlas FieldAtlas BioPhi369 PhiFieldLab PhiMathAtelier AquaPhi schumann-live-react',
  EXPERIMENT:'-Core369 Core369 PhiMadaPrime-Lab PhiDecisionField PhiMadaPrime-Experiments InfiniteTinkerer',
  ARCHIVE:'EVIE-private-archive ravedial-archive-explorer'
});
const exact=new Map();
for(const [id,names] of Object.entries(curated))for(const name of names.split(/\s+/))if(name)exact.set(name.toLowerCase(),id);
const byTopic=new Map(ARCHITECTURE_GROUPS.map(group=>['phios-'+group.id.toLowerCase().replaceAll('_','-'),group.id]));
const suggestions=[
  ['CORE_OS',/\boperating system\b|\bos kernel\b|\bbootloader\b|\bphios runtime\b/i],
  ['AI_HOME',/\blocal.first ai home\b|\bpersonal ai home\b|\bmodel identity\b/i],
  ['CREATIVE_PIPELINE',/\b(glb|gltf) export\b|\bkeyframe editor\b|\bvideo edit(or|ing)\b|\b3d asset pipeline\b/i],
  ['WORLD_PORTAL',/\b(webxr|virtual reality|vr game|shared world|world portal)\b/i],
  ['LOCAL_SERVICE',/\blocal inference server\b|\bon.device service\b|\bdaemon\b/i],
  ['BRIDGE',/\b(interoperability bridge|governed bridge|transport bridge)\b/i],
  ['RESEARCH_LIBRARY',/\breference framework\b|\bscientific research\b|\bexperimental physics\b/i],
  ['APP',/\b(browser app|desktop app|web app|midi plugin)\b/i]
];

/** A category is a placement, NEVER evidence of installation or source dependency. */
export function architectureFor(repo){
  const name=String(repo?.name||'').toLowerCase();
  if(repo?.archived||/(^|[-_])archive($|[-_])/.test(name))return {id:'ARCHIVE',basis:'repository-archive',integration:'cataloged'};
  const named=exact.get(name);
  if(named)return {id:named,basis:'curated',integration:'cataloged'};
  const tagged=[...new Set((repo?.topics||[]).map(t=>byTopic.get(String(t).toLowerCase())).filter(Boolean))];
  if(tagged.length>1)return {id:'EXPERIMENT',basis:'conflicting-owner-topics',integration:'cataloged'};
  if(tagged.length===1)return {id:tagged[0],basis:'owner-topic',integration:'cataloged'};
  const description=String(repo?.description||'');
  const matches=suggestions.filter(([,rule])=>rule.test(description));
  if(matches.length===1)return {id:matches[0][0],basis:'suggested-needs-review',integration:'cataloged'};
  return {id:'EXPERIMENT',basis:'unreviewed',integration:'cataloged'};
}
export function architectureCounts(repos){
  const counts=Object.fromEntries(ARCHITECTURE_GROUPS.map(g=>[g.id,0]));
  for(const repo of repos)counts[architectureFor(repo).id]++;
  return counts;
}
function stableHash(s){
  let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return (h>>>0)/4294967296;
}
/** Stable IDs keep a project's position independent of new inventory order. */
export function architecturePositions(repos){
  const groupMap=new Map(ARCHITECTURE_GROUPS.map(g=>[g.id,g]));
  return repos.map(repo=>{
    const g=groupMap.get(architectureFor(repo).id);
    const angle=stableHash(String(repo.id)+'theta')*Math.PI*2;
    const radius=3.5+7*Math.sqrt(stableHash(String(repo.id)+'radius'));
    const offset=(stableHash(String(repo.id)+'height')-.5)*5;
    return [g.center[0]+Math.cos(angle)*radius,g.center[1]+offset,g.center[2]+Math.sin(angle)*radius];
  });
}
