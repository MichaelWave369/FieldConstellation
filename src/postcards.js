import {projectId} from './project-links.js';
import {sanitizePassport,MAX_FAVORITES} from './passport.js';

export const MAX_POSTCARD_WORLDS=8;
const ID_RE=/^github:[1-9]\d{0,19}$/;

/** All shared IDs must be explicit public repo identities, never private lookups. */
function publicMap(repos){
  return new Map(repos.filter(r=>r.visibility==='public').map(repo=>[projectId(repo),repo]));
}
function validIds(ids){
  return Array.isArray(ids)&&ids.length>0&&ids.length<=MAX_POSTCARD_WORLDS&&
    ids.every(id=>typeof id==='string'&&ID_RE.test(id))&&new Set(ids).size===ids.length;
}

/**
 * An incoming postcard is untrusted public-only navigation, not an import.
 * Unknown IDs remain unnamed and are omitted. No visitor data is touched.
 */
export function readPostcardLink(href,repos){
  try{
    const url=new URL(href);
    const values=url.searchParams.getAll('postcard');
    if(values.length!==1||!values[0]||values[0].length>300)return null;
    const ids=values[0].split(',');
    if(!validIds(ids))return null;
    const known=publicMap(repos);
    const available=ids.filter(id=>known.has(id));
    if(!available.length)return null;
    return {ids:available,worlds:available.map(id=>known.get(id)),omitted:ids.length-available.length};
  }catch{return null;}
}

/** Share only deliberately chosen public projects, never history or metadata. */
export function buildPostcardLink(href,ids,repos){
  if(!validIds(ids))throw Error('Choose between one and eight different public worlds.');
  const publicIds=publicMap(repos);
  if(ids.some(id=>!publicIds.has(id)))throw Error('Postcards can include only currently public worlds.');
  const url=new URL(href);
  // A share URL never inherits unrelated query parameters, including any
  // attribution or temporary state from the composer's browsing session.
  url.search='';
  url.searchParams.set('postcard',ids.join(','));
  url.hash='';
  return url.href;
}
export function withoutPostcard(href){
  const url=new URL(href);
  url.searchParams.delete('postcard');
  return url.href;
}

/** Explicit visitor action only; never invoked while hydrating a shared link. */
export function savePostcardFavorites(passport,ids,repos){
  const current=sanitizePassport(passport,repos);
  if(!Array.isArray(ids)||ids.length>MAX_POSTCARD_WORLDS)throw Error('Invalid postcard collection.');
  const known=publicMap(repos),additions=[];
  for(const id of ids){
    if(typeof id!=='string'||!ID_RE.test(id)||!known.has(id)||additions.includes(id))continue;
    if(!current.favoriteIds.includes(id))additions.push(id);
  }
  const available=MAX_FAVORITES-current.favoriteIds.length;
  const inserted=additions.slice(0,Math.max(0,available));
  return {
    passport:{...current,favoriteIds:[...current.favoriteIds,...inserted]},
    saved:inserted.length,
    skipped:additions.length-inserted.length
  };
}
