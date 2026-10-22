import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../src/index.html',import.meta.url),'utf8');

test('postcard composer uses existing Passport favorites and an explicit share action',()=>{
  assert.match(app,/state\.postcardDraft=state\.passport\.favoriteIds\.slice\(0,MAX_POSTCARD_WORLDS\)/);
  assert.match(app,/buildPostcardLink\(location\.href,state\.postcardDraft,state\.repos\)/);
  assert.match(app,/postcardCopy'\)\.onclick=copyPostcard/);
  assert.match(html,/id="postcardComposer"/);
  assert.match(html,/id="postcardUrlFallback"/);
});

test('incoming public link is a preview, not an automatic Passport write',()=>{
  assert.match(app,/const sharedPostcard=readPostcardLink\(location\.href,state\.repos\)/);
  assert.match(app,/state\.postcardView=sharedPostcard;renderPostcard\(\);/);
  assert.match(app,/postcardSave'\)\.onclick=saveReceivedPostcard/);
  assert.match(app,/function saveReceivedPostcard\(\)/);
  assert.match(html,/Nothing is stored automatically|does not import it/);
});

test('visitors can exit postcard mode and return to the normal stable project link',()=>{
  assert.match(app,/withoutPostcard\(state\.trail\?trailLink/);
  assert.match(app,/withoutPostcard\(withoutTrail\(projectLink\(location\.href,null\)\)\)/);
  assert.match(app,/postcardDialog'\)\.close\(\);state\.postcardView=null/);
  assert.match(app,/resetFilters\(\);selectRepo\(id,true\)/);
});

test('postcard remains an independent self-contained dialog with native keyboard controls',()=>{
  assert.match(html,/<dialog id="postcardDialog"/);
  assert.match(html,/id="postcardStatus" class="postcard-status" role="status"/);
  assert.match(html,/id="postcardCount" class="postcard-count" aria-live="polite"/);
  assert.match(app,/data-postcard-choice/);
  assert.match(app,/input\.checked=false;toast/);
  assert.match(html,/data-close-dialog/);
});
