export const GROUPS = [
  {id:'intelligence',name:'Intelligence & agents',short:'INTELLIGENCE',color:'#d0f29b',center:[-24,11,4]},
  {id:'creative',name:'Art & creative studios',short:'CREATIVE STUDIOS',color:'#c1a5ed',center:[-7,19,-15]},
  {id:'play',name:'Games & imagined worlds',short:'PLAY & WORLDS',color:'#edb17e',center:[18,15,-8]},
  {id:'sound',name:'Sound & movement',short:'SOUND & MOTION',color:'#e6a4c0',center:[30,-1,6]},
  {id:'research',name:'Science & research',short:'SCIENCE & RESEARCH',color:'#83cbd2',center:[15,-15,14]},
  {id:'infrastructure',name:'Tools & infrastructure',short:'TOOLS & SYSTEMS',color:'#91afe0',center:[-9,-15,19]},
  {id:'commons',name:'People & the commons',short:'PEOPLE & COMMONS',color:'#e1d18a',center:[-30,-6,-9]},
  {id:'trust',name:'Governance & trust',short:'GOVERNANCE & TRUST',color:'#81c9b1',center:[5,-2,-27]}
];
const curated={
  intelligence:'Agentora BrainC BudgetGenius CoEvo EVIE FieldCloudWorker LAU LittUp Memoria mempalace NBGPocketMesh PhiCompile PhiFieldLab PhiLearn PhiMirrorHex phibot PhiStream PocketBrain PorchTalk PrivateSpark SIcologist SuperPhiVessel think-tank TMC Triad369-Launchpad WaveRider xi-vessel-bridge',
  creative:'BackyardProductionCompany FieldStoryForge Auralith369 brainsweatstudios CineSwarm codeveil369 Domistika FramefieldStudio FutureArchive hidden-equations-of-feeling HueHatch infinitylens369 MemeForge MuseVault OpenBlueprintStudio paracut PHIVid PhiScribe Phiform RastaPhi SIGLStudio SiliconLouvre WaveForgeStudio',
  play:'BTM EchoesOfTheNine LENZ SparkTheSubstrate TweedleVerse ChippyDip Codedex GiltHouse InfiniteAfterHours Infinite-Porch MythSplicer NightCircuit OakStreetRumble parallax-arc parallax-gran-prix parallax-pixelforge PhiCade PorchQuest369 ProofArcade PuzzlePen The-MDF-Files WastelandWorkshopStudio',
  sound:'AquaCymatics369 BounceDeck HomeBass JukeBot LabelFit LoopCatch mictek-house MoreBounceLabs OverStrings PHIAudio PockeRec Pulse369 ravedial-archive-explorer',
  research:'GBRM PhiMathAtelier 12fold ANC aqlen-quantum-ledger AquaPhi Cannabiverse CFD chronolattice Codex DCL enter-the-field-research FieldMedic langarian-math MRIPHI NestedBubbleGear particleforge369 phi369-element-spiral-atlas Phi-Morph RegenerationAtlas schumann-live-react VAL',
  infrastructure:'GenEWrist PhiARK PhiOS-XR PhiPress atomspace-rocks atomspace-storage Blinker Browsallax datacenter-ledger-explorer DropZone ebpf-for-windows FieldAtlas FieldConstellation FieldDeck GitPorch InfiniteInterconnects LightBridge Nevora-Translator Phi5 PhiCleanroom PhiKernel phioffice369 PhiOS PhiPie PhiPortal Phithon public-apis-search RepoReady reporider SponsorRail Trellis Vibe WizardWebb',
  commons:'Aidora BeyondtheBuzz BizHaven bubblenest cannabis-as-sacred-medicine ChippyDip CollaborationJunction ComicRelief Commonline CommonTable concrete-atlas consent_mirror_369 EmberFlow369 FamilyVault FieldHaven FieldManual369 flow-covenant-runtime focusbridge21 FrontPorchAI GLO goldenjoy369 Growora GypsyAI Infinite-Commons inspection-closeout-pilot kindbridge369 LittUp lumen_sword_369 MichaelWave369 michaelwhughes-portfolio Mindora MoreBounceMethod nevora-codex openfield pain-joy-continuum parallax-369-public-primer personamirror369 PHircQ PhiSkrit ReceiptRipper RecoM3ndo Reconnect ReelCommons',
  trust:'axiomforge-ledger FieldAccord FieldShield governance-drift-rsdc parallax-watchtower Peekaboo SCAM-A-LAX WhiteHatLedger369'
};
const categoryLookup=new Map();
for(const group of GROUPS) for(const name of curated[group.id].split(' ')) if(!categoryLookup.has(name.toLowerCase()))categoryLookup.set(name.toLowerCase(),group.id);
export function categoryFor(repo){
  if(categoryLookup.has(repo.name.toLowerCase()))return categoryLookup.get(repo.name.toLowerCase());
  const text=(repo.name+' '+repo.description+' '+(repo.topics||[]).join(' ')).toLowerCase();
  const rules=[['trust',/governance|security|consent|ethical|trust|scam|ledger/],['sound',/audio|music|sound|radio|dj |rhythm|fitness|record/],['play',/game|arcade|rpg|play|adventure|world/],['creative',/art |visual|image|creative|studio|editor|video|animation/],['research',/research|physics|biology|science|quantum|math|experiment|simulation/],['intelligence',/agent|inference|intelligence|llm|ollama|memory| ai /],['infrastructure',/compiler|language|platform|runtime|database|browser|tool|api|system|device/]];
  return rules.find(([,r])=>r.test(text))?.[0]||'commons';
}
export function hash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0)/4294967296;}
// Adapted from the user's Grok Field Lattice palette and layout.ts.
export const LANGUAGE_COLORS={JavaScript:'#e2b657',TypeScript:'#f4e4bc',Python:'#3fbfa0',HTML:'#d4784a',Rust:'#c4623a',CSS:'#8eabbf','C++':'#c5cdd4',GDScript:'#8fbf7a','Not specified':'#88847c'};
export function languageColor(language){return LANGUAGE_COLORS[language]||'#aaa391';}
export function ageInDays(repo,now=Date.now()){const at=Date.parse(repo.updated);return Number.isFinite(at)?Math.max(0,(now-at)/86400000):Infinity;}
export function activityWeight(repo,now=Date.now()){return .72+.28*Math.exp(-ageInDays(repo,now)/30);}
export function colorFor(repo,lens='world',now=Date.now()){
  if(lens==='language')return languageColor(repo.language);
  if(lens==='activity'){const days=ageInDays(repo,now);return days<=7?'#f5d68b':days<=30?'#d7a866':days<=90?'#8ba58b':'#6d7884';}
  return GROUPS.find(g=>g.id===repo.group)?.color||'#d0f29b';
}
export function languageOrbits(repos){
  const counts=new Map();for(const r of repos)counts.set(r.language,(counts.get(r.language)||0)+1);
  // Put larger populations on wider rings so crowded languages remain readable.
  return [...counts.entries()].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0])).map(([language,count],index,list)=>({language,count,radius:12+index*4.2,y:(index-(list.length-1)/2)*1.1,color:languageColor(language)}));
}
export function filterRepos(repos,filters={}){
  const q=(filters.query||'').trim().toLowerCase();return repos.filter(r=>(!filters.group||r.group===filters.group)&&(!filters.language||r.language===filters.language)&&(!filters.visibility||r.visibility===filters.visibility)&&(!filters.pagesOnly||r.pages===true)&&(!filters.hideForks||!r.fork)&&(!q||[r.name,r.description,r.language,...(r.topics||[])].join(' ').toLowerCase().includes(q)));
}
export function chronologicalOrder(repos){return repos.map((r,index)=>({r,index})).sort((a,b)=>(a.r.created||'').localeCompare(b.r.created||'')||a.r.name.localeCompare(b.r.name)).map(x=>x.index);}
export function prepareRepos(repos){return repos.map(r=>({...r,group:categoryFor(r),radius:Math.min(.65,.22+Math.log10(1+(r.size||0))*.075)})).sort((a,b)=>a.name.localeCompare(b.name));}
export function layoutPositions(repos,mode){
  const buckets=new Map(GROUPS.map(g=>[g.id,repos.filter(r=>r.group===g.id)]));
  const order=chronologicalOrder(repos),chronology=order.map(i=>repos[i]),orbits=languageOrbits(repos);
  return repos.map((r,i)=>{
    if(mode==='orbits'){
      const ring=orbits.find(o=>o.language===r.language),members=repos.filter(x=>x.language===r.language),index=members.findIndex(x=>x.id===r.id),ringIndex=orbits.indexOf(ring),theta=index/members.length*Math.PI*2+ringIndex*.5;
      return [Math.cos(theta)*ring.radius,ring.y,Math.sin(theta)*ring.radius];
    }
    if(mode==='spiral'){
      const index=order.indexOf(i),t=index/Math.max(1,repos.length-1),theta=index*Math.PI*(3-Math.sqrt(5)),radius=8+t*25;
      return [Math.cos(theta)*radius,(t-.5)*58,Math.sin(theta)*radius];
    }
    if(mode==='sphere'){
      const gi=GROUPS.findIndex(g=>g.id===r.group),before=GROUPS.slice(0,gi).reduce((a,g)=>a+buckets.get(g.id).length,0),index=before+buckets.get(r.group).findIndex(x=>x.id===r.id);
      const y=1-2*(index+.5)/repos.length,rad=Math.sqrt(1-y*y),theta=Math.PI*(3-Math.sqrt(5))*index;
      return [35*rad*Math.cos(theta),35*y,35*rad*Math.sin(theta)];
    }
    if(mode==='helix'){
      const index=chronology.findIndex(x=>x.id===r.id),t=index/Math.max(1,repos.length-1),angle=t*Math.PI*9,rad=19+hash(r.name)*4;
      return [Math.cos(angle)*rad,(t-.5)*64,Math.sin(angle)*rad];
    }
    const group=GROUPS.find(g=>g.id===r.group),list=buckets.get(r.group),index=list.findIndex(x=>x.id===r.id),phi=index*Math.PI*(3-Math.sqrt(5)),y=1-2*(index+.5)/list.length,ring=Math.sqrt(1-y*y),radius=(5+Math.cbrt(list.length)*1.25)*(.55+.45*hash(r.id+'r'));
    return [group.center[0]+Math.cos(phi)*ring*radius,group.center[1]+y*radius,group.center[2]+Math.sin(phi)*ring*radius];
  });
}
export function layoutEdges(repos,points,mode){
  if(mode==='helix'||mode==='spiral'){const order=chronologicalOrder(repos);return order.slice(1).map((i,k)=>[order[k],i]);}
  if(mode==='orbits'){
    const edges=[];for(const ring of languageOrbits(repos)){const members=repos.map((r,i)=>({r,i})).filter(x=>x.r.language===ring.language);if(members.length>1)for(let i=0;i<members.length-(members.length===2?1:0);i++)edges.push([members[i].i,members[(i+1)%members.length].i]);}return edges;
  }
  const edges=[],seen=new Set();repos.forEach((r,i)=>{const nearest=repos.map((s,j)=>({j,d:points[i].reduce((n,x,k)=>n+(x-points[j][k])**2,0),group:s.group})).filter(s=>s.j!==i&&s.group===r.group).sort((a,b)=>a.d-b.d).slice(0,3);for(const n of nearest){const key=[i,n.j].sort((a,b)=>a-b).join('-');if(!seen.has(key)){edges.push([i,n.j]);seen.add(key);}}});return edges;
}
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
export function normalizePublic(r){return{id:String(r.id),name:r.name,description:r.description||'',url:r.html_url,homepage:r.homepage||(r.has_pages?'https://michaelwave369.github.io/'+r.name+'/':''),language:r.language||'Not specified',topics:r.topics||[],stars:r.stargazers_count||0,forks:r.forks_count||0,size:r.size||0,created:r.created_at,updated:r.pushed_at||r.updated_at,visibility:'public',archived:!!r.archived,fork:!!r.fork,branch:r.default_branch||'main',license:r.license?.spdx_id||null,pages:!!r.has_pages,issues:r.open_issues_count??null};}
