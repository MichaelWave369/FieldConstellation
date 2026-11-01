import {projectId} from './project-links.js';

// This is a local, playful exploration journal. It is NOT CI, build, deploy,
// dependency, merge or operator authority evidence.
export const QUEST_KEY='field-constellation-quest-v1';
export const MAX_DISCOVERIES=1000;
export const emptyQuest=()=>({schemaVersion:1,discoveredIds:[]});

function publicIds(repos){
  return new Set(repos.filter(repo=>repo.visibility==='public').map(projectId));
}
function cleanIds(ids,repos){
  if(!Array.isArray(ids))return [];
  const allowed=publicIds(repos),seen=new Set(),result=[];
  for(const id of ids){
    if(typeof id!=='string'||!/^github:[1-9]\\d{0,19}$/.test(id)||!allowed.has(id)||seen.has(id))continue;
    seen.add(id);result.push(id);
    if(result.length>=MAX_DISCOVERIES)break;
  }
  return result;
}
export function sanitizeQuest(data,repos){
  if(!data||typeof data!=='object'||data.schemaVersion!==1)return emptyQuest();
  return {schemaVersion:1,discoveredIds:cleanIds(data.discoveredIds,repos)};
}
export function readQuest(raw,repos,passport=emptyQuest()){
  // One-time migration from an existing browser's Passport. An explicit reset
  // writes an empty v1 journal and is never undone by this migration.
  if(raw===null)return {schemaVersion:1,discoveredIds:cleanIds(
    [...(passport.favoriteIds||[]),...(passport.recentIds||[])],repos)};
  try{
    if(typeof raw!=='string'||raw.length>30000)return emptyQuest();
    return sanitizeQuest(JSON.parse(raw),repos);
  }catch{return emptyQuest();}
}
export function discover(quest,repo,repos){
  const base=sanitizeQuest(quest,repos),id=projectId(repo);
  if(!publicIds(repos).has(id)||base.discoveredIds.includes(id)||base.discoveredIds.length>=MAX_DISCOVERIES)return base;
  return {...base,discoveredIds:[...base.discoveredIds,id]};
}

export const MILESTONES=[
  {at:0,name:'The Infinite Tinkerer'},
  {at:3,name:'First Orbit'},
  {at:6,name:'Hex Explorer'},
  {at:9,name:'Ninefold Cartographer'},
  {at:18,name:'World Weaver'},
  {at:36,name:'Constellation Keeper'},
  {at:72,name:'Infinite Horizons'}
];

export function questProgress(repos,quest,passport,relationships=[]){
  const publicRepos=repos.filter(repo=>repo.visibility==='public'),safe=sanitizeQuest(quest,publicRepos),found=new Set(safe.discoveredIds);
  const saved=new Set(cleanIds(passport?.favoriteIds||[],publicRepos));
  const branches=new Map();
  for(const repo of publicRepos){
    if(!branches.has(repo.group))branches.set(repo.group,{group:repo.group,total:0,discovered:0,saved:0,next:null});
    const branch=branches.get(repo.group);branch.total++;
    const id=projectId(repo);
    if(found.has(id))branch.discovered++;
    else if(!branch.next)branch.next=repo;
    if(saved.has(id))branch.saved++;
  }
  const completedLinks=relationships.filter(link=>link.status==='verified'&&found.has(link.from)&&found.has(link.to)).length;
  const documentedLinks=relationships.filter(link=>link.status==='documented'&&found.has(link.from)&&found.has(link.to)).length;
  const total=found.size,rank=[...MILESTONES].reverse().find(level=>total>=level.at)||MILESTONES[0];
  const next=MILESTONES.find(level=>level.at>total)||null;
  const exploredGroups=[...branches.values()].filter(branch=>branch.discovered>0).length;
  const achievements=[
    {id:'first-star',name:'First Light',detail:'Discover one public world',unlocked:total>=1},
    {id:'three',name:'Threefold Path',detail:'Discover three public worlds',unlocked:total>=3},
    {id:'six',name:'Sixfold Circuit',detail:'Discover six public worlds',unlocked:total>=6},
    {id:'nine',name:'Ninefold Constellation',detail:'Discover nine public worlds',unlocked:total>=9},
    {id:'four-branches',name:'World Hopper',detail:'Explore four different constellations',unlocked:exploredGroups>=4},
    {id:'all-branches',name:'Across the Field',detail:'Visit all eight thematic constellations',unlocked:branches.size>=8&&exploredGroups===branches.size},
    {id:'source-link',name:'Evidence Trail',detail:'Explore both ends of a source-verified relationship',unlocked:completedLinks>=1},
    {id:'all-stars',name:'Public Star Collector',detail:'Discover every world in this public snapshot',unlocked:publicRepos.length>0&&total===publicRepos.length}
  ];
  return {total,available:publicRepos.length,saved:saved.size,experience:total*10,rank,next,branches:[...branches.values()],exploredGroups,completedLinks,documentedLinks,achievements};
}
