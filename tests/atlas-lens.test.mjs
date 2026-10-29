import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId} from '../src/project-links.js';
import {reviewedAtlasIds,atlasLensRepos,atlasManifestLabel} from '../src/atlas-lens.js';
const load=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const repos=load('repos').repos,atlas=load('atlas');

test('reviewed Atlas IDs match only public repositories in this checked snapshot',()=>{
  const ids=reviewedAtlasIds(atlas,repos);
  assert.equal(ids.size,atlas.chapters.length);
  const found=atlasLensRepos(repos,atlas);
  assert.equal(found.length,ids.size);
  assert(found.every(repo=>repo.visibility==='public'&&ids.has(projectId(repo))));
  assert.match(atlasManifestLabel(atlas,repos),/reviewed public Atlas chapters/);
  assert.match(atlasManifestLabel(atlas,repos),/2026-10-29/);
});

test('private, deleted, duplicate and malformed chapter claims are ignored',()=>{
  const a=repos.find(repo=>repo.visibility==='public'&&atlas.chapters.includes(projectId(repo)));
  assert(a);
  const another=repos.find(repo=>repo.id!==a.id&&repo.visibility==='public');
  const input={...atlas,chapters:[projectId(a),projectId(a),'github:999999999999999999', 'javascript:evil',projectId(another)]};
  const changed=repos.map(repo=>repo.id===another.id?{...repo,visibility:'private'}:repo);
  assert.deepEqual([...reviewedAtlasIds(input,changed)],[projectId(a)]);
  assert.equal(atlasLensRepos(changed,input).length,1);
});

test('invalid Atlas manifest never narrows scope to inferred or unreviewed records',()=>{
  const bad=[
    null,
    {...atlas,owner:'attacker'},
    {...atlas,schemaVersion:2},
    {...atlas,url:'https://unreviewed.example/'},
    {...atlas,chapters:'github:123'}
  ];
  for(const manifest of bad){
    assert.equal(reviewedAtlasIds(manifest,repos).size,0);
    assert.equal(atlasLensRepos(repos,manifest).length,0);
  }
  assert.equal(atlasManifestLabel(null,repos),'Atlas chapter map unavailable');
});
