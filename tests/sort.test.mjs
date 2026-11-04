import test from 'node:test';
import assert from 'node:assert/strict';
import {SORT_MODES,normalizeSortMode,sortRepositoryList} from '../src/sort.js';

const rows=[
 {id:'1',name:'Beta',created:'2024-02-01T00:00:00Z',updated:'2026-01-02T00:00:00Z',stars:2},
 {id:'2',name:'Alpha',created:'2026-03-01T00:00:00Z',updated:'2026-01-03T00:00:00Z',stars:0},
 {id:'3',name:'Gamma',created:'2024-02-01T00:00:00Z',updated:'2025-06-01T00:00:00Z',stars:11}
];
test('sort order is stable, deterministic, and never mutates the universe array',()=>{
  const baseline=JSON.stringify(rows);
  for(const [mode,want] of [['name','Alpha,Beta,Gamma'],['updated','Alpha,Beta,Gamma'],['created','Alpha,Beta,Gamma'],['stars','Gamma,Beta,Alpha']])
    assert.equal(sortRepositoryList(rows,mode).map(r=>r.name).join(','),want);
  assert.equal(JSON.stringify(rows),baseline);
  assert.equal(normalizeSortMode('bad'),'name');
  assert.equal(sortRepositoryList(rows,'bad')[0].name,'Alpha');
  assert.equal(new Set(SORT_MODES.map(x=>x.id)).size,SORT_MODES.length);
});
