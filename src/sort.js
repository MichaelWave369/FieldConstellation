export const SORT_MODES=Object.freeze([
  {id:'name',label:'A → Z',description:'alphabetical A to Z'},
  {id:'updated',label:'Updated',description:'most recently pushed'},
  {id:'created',label:'Newest',description:'newest repositories first'},
  {id:'stars',label:'Stars',description:'most GitHub stars first'}
]);
export function normalizeSortMode(value){return SORT_MODES.some(option=>option.id===value)?value:'name';}
export function sortRepositoryList(repos,mode='name'){
  const sort=normalizeSortMode(mode);
  const tie=(a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'})||String(a.id).localeCompare(String(b.id));
  const date=value=>{const at=Date.parse(value||'');return Number.isFinite(at)?at:0;};
  return [...repos].sort((a,b)=>{
    if(sort==='created')return date(b.created)-date(a.created)||tie(a,b);
    if(sort==='updated')return date(b.updated)-date(a.updated)||tie(a,b);
    if(sort==='stars')return (Number(b.stars)||0)-(Number(a.stars)||0)||tie(a,b);
    return tie(a,b);
  });
}
