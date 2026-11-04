import test from 'node:test';
import assert from 'node:assert/strict';
import {solarDiscoveryFor} from '../src/solar-discovery.js';

const group='infrastructure';
const fixture=[
  {id:'a',name:'Alpha',group,visibility:'public',stars:7,created:'2026-01-01T00:00:00Z',updated:'2026-01-04T00:00:00Z'},
  {id:'b',name:'Bravo',group,visibility:'public',stars:21,created:'2025-03-01T00:00:00Z',updated:'2026-11-02T00:00:00Z'},
  {id:'c',name:'Charlie',group,visibility:'public',stars:0,created:'2026-11-03T00:00:00Z',updated:'2026-11-03T00:00:00Z'},
  {id:'d',name:'Delta',group,visibility:'public',stars:5,created:'2026-05-01T00:00:00Z',updated:'2026-09-02T00:00:00Z'},
  {id:'e',name:'Echo',group,visibility:'public',stars:12,created:'2026-10-01T00:00:00Z',updated:'2026-10-09T00:00:00Z'},
  {id:'f',name:'Foxtrot',group,visibility:'public',stars:2,created:'2026-09-01T00:00:00Z',updated:'2026-04-03T00:00:00Z'},
  {id:'private',name:'Private',group,visibility:'private',stars:1000,created:'2026-11-04T00:00:00Z',updated:'2026-11-04T00:00:00Z'},
  {id:'elsewhere',name:'Other',group:'creative',visibility:'public',stars:999,created:'2026-11-04T00:00:00Z',updated:'2026-11-04T00:00:00Z'}
];

test('Solar Discovery uses only selected public group and preserves input order',()=>{
  const before=JSON.stringify(fixture);
  const result=solarDiscoveryFor(fixture,group);
  assert.equal(result.count,6);
  assert.deepEqual(result.featured.map(x=>x.id),['b','e','a']);
  assert.deepEqual(result.newest.map(x=>x.id),['c','e','f']);
  assert.equal(result.route.length,5);
  assert.equal(new Set(result.route.map(x=>x.id)).size,result.route.length);
  assert(result.route.every(x=>x.group===group&&x.visibility==='public'));
  assert.equal(JSON.stringify(fixture),before,'must not mutate source inventory');
});

test('Solar Discovery honors current filters and works for one or no matching planets',()=>{
  const only=new Set(['c']);
  const result=solarDiscoveryFor(fixture,group,only);
  assert.equal(result.count,1);
  assert.deepEqual(result.featured.map(x=>x.id),['c']);
  assert.deepEqual(result.newest.map(x=>x.id),['c']);
  assert.deepEqual(result.route.map(x=>x.id),['c']);
  const empty=solarDiscoveryFor(fixture,group,new Set());
  assert.equal(empty.count,0);
  assert.deepEqual(empty.route,[]);
});

test('Solar Discovery handles empty and larger inventories deterministically',()=>{
  assert.deepEqual(solarDiscoveryFor([],group),{count:0,featured:[],newest:[],route:[]});
  const large=Array.from({length:650},(_,i)=>({id:String(i),name:'Project '+i,group,visibility:'public',stars:i%15,created:new Date(Date.UTC(2026,0,1)+i*3600000).toISOString(),updated:'2026-11-01T00:00:00Z'}));
  const first=solarDiscoveryFor(large,group),again=solarDiscoveryFor(large,group);
  assert.equal(first.count,650);
  assert.deepEqual(first.route.map(x=>x.id),again.route.map(x=>x.id));
  assert.equal(first.route.length,5);
  assert.equal(new Set(first.route.map(x=>x.id)).size,5);
});
