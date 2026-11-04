import test from 'node:test';
import assert from 'node:assert/strict';
import {planetDossierFor} from '../src/planet-dossier.js';
import {projectId} from '../src/project-links.js';

const selected={id:'1',name:'PhiOS',group:'infrastructure',language:'TypeScript',visibility:'public',updated:'2026-10-01T00:00:00Z'};
const peerA={id:'2',name:'Aster',group:'infrastructure',language:'TypeScript',visibility:'public',updated:'2026-08-01T00:00:00Z'};
const peerB={id:'3',name:'Beacon',group:'infrastructure',language:'JavaScript',visibility:'public',updated:'2026-11-03T00:00:00Z'};
const peerC={id:'4',name:'Comet',group:'infrastructure',language:'TypeScript',visibility:'public',updated:'2026-05-01T00:00:00Z'};
const privatePeer={id:'5',name:'PrivatePlan',group:'infrastructure',language:'TypeScript',visibility:'private',updated:'2026-11-04T00:00:00Z'};
const otherGroup={id:'6',name:'ForeignField',group:'creative',language:'TypeScript',visibility:'public',updated:'2026-11-04T00:00:00Z'};
const all=[selected,peerA,peerB,peerC,privatePeer,otherGroup];
const relations=[
 {from:projectId(selected),to:projectId(peerA),status:'verified',reviewedAt:'2026-10-03T00:00:00Z'},
 {from:projectId(peerB),to:projectId(selected),status:'documented',reviewedAt:'2026-11-01T00:00:00Z'},
 {from:projectId(selected),to:projectId(otherGroup),status:'conceptual',reviewedAt:'2026-11-04T00:00:00Z'},
 {from:projectId(peerC),to:projectId(peerA),status:'verified',reviewedAt:'2026-11-04T00:00:00Z'}
];

test('Dossier shows only public curated-category neighbors, not private or foreign worlds',()=>{
  const before=JSON.stringify(all);
  const result=planetDossierFor(all,selected,relations,new Set(['1','2','3','4','5','6']),'2026-11-04T15:00:00Z');
  assert.deepEqual(result.nearby.map(r=>r.id),['2','4','3']);
  assert(result.nearby.every(r=>r.visibility==='public'&&r.group===selected.group));
  assert.equal(JSON.stringify(all),before,'Dossier cannot mutate inventory');
});

test('Dossier counts only validated source-grade relationship statuses for the selected repository',()=>{
  const result=planetDossierFor(all,selected,relations);
  assert.deepEqual(result.counts,{verified:1,documented:1});
  assert.equal(result.sourceCount,2);
  assert.equal(result.reviewedAt,'2026-11-01T00:00:00.000Z');
});

test('Dossier respects current visible filters and returns explicit empty state',()=>{
  const filtered=planetDossierFor(all,selected,relations,new Set(['1','3']));
  assert.deepEqual(filtered.nearby.map(r=>r.id),['3']);
  const none=planetDossierFor(all,selected,[],new Set(['1']),'not a date');
  assert.deepEqual(none.nearby,[]);
  assert.equal(none.sourceCount,0);
  assert.equal(none.inventoryAt,null);
  assert.equal(none.reviewedAt,null);
});

test('Private/unknown selection is rejected and large public inventory remains bounded',()=>{
  assert.equal(planetDossierFor(all,privatePeer,relations),null);
  assert.equal(planetDossierFor(all,{...selected,id:'not-indexed'},relations),null);
  const many=Array.from({length:650},(_,i)=>({id:'large-'+i,name:'Planet '+i,group:'infrastructure',language:'TypeScript',visibility:'public',updated:'2026-01-01T00:00:00Z'}));
  const dossier=planetDossierFor([selected,...many],selected,[]);
  assert.equal(dossier.nearby.length,3);
  assert.equal(new Set(dossier.nearby.map(r=>r.id)).size,3);
});
