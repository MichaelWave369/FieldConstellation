import test from 'node:test';
import assert from 'node:assert/strict';
import {SHOWTIME_NAMES,SHOWTIME_INTERVAL_MS,resolveShowtimeStops,domeLinePositions} from '../src/phitarium.js';

test('Dome Show resolves only currently public repos in an intentional stable order',()=>{
  const names=['BTM','FieldAtlas','GenEWrist','FieldConstellation','PhiOS','PhiServe'];
  const repos=names.map((name,i)=>({name,id:String(i+1),visibility:'public'}));
  const result=resolveShowtimeStops(repos);
  assert.deepEqual(result.map(r=>r.name),SHOWTIME_NAMES);
  assert.equal(result.length,6);
  assert(SHOWTIME_INTERVAL_MS>=5000);
  assert(SHOWTIME_INTERVAL_MS<=15000);
});
test('missing and private repositories never appear or cause invented tour stops',()=>{
  const repos=[
    {name:'FieldConstellation',id:'1',visibility:'public'},
    {name:'FieldAtlas',id:'2',visibility:'private'},
    {name:'PhiOS',id:'3',visibility:'public'},
    {name:'GenEWrist',id:'4',visibility:'private'}
  ];
  assert.deepEqual(resolveShowtimeStops(repos).map(r=>r.name),['FieldConstellation','PhiOS']);
  assert.deepEqual(resolveShowtimeStops([]),[]);
  assert.deepEqual(resolveShowtimeStops(repos.filter(r=>r.visibility==='private')),[]);
});
test('celestial dome geometry is finite, bounded and made of complete line segments',()=>{
  const p=domeLinePositions({radius:100,baseY:-10,meridians:6,steps:12});
  assert.equal(p.length,6*(6*12+6*12*6)); // 6 values per segment
  assert.equal(p.length%6,0);
  assert(p.every(Number.isFinite));
  for(let i=0;i<p.length;i+=3){
    const x=p[i],y=p[i+1],z=p[i+2];
    assert(Math.abs(Math.hypot(x,y+10,z)-100)<1e-8);
  }
  assert(domeLinePositions().length<12000,'WebGL and Canvas should receive a bounded dome');
});
test('invalid geometry is rejected rather than allowing unbounded GPU allocations',()=>{
  for(const options of [{radius:Infinity},{radius:900},{meridians:100},{meridians:0},{steps:5},{steps:500},{baseY:Infinity}]){
    assert.throws(()=>domeLinePositions(options),RangeError);
  }
});
