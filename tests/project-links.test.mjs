import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectId,projectLink,readProjectLink,atlasLink} from '../src/project-links.js';
const read=name=>JSON.parse(readFileSync(new URL('../src/'+name+'.json',import.meta.url),'utf8'));
const repos=read('repos').repos,atlas=read('atlas');
const base='https://michaelwave369.github.io/FieldConstellation/';

test('canonical project links survive names changing and resolve only current public records',()=>{
  const repo=repos[0],url=projectLink(base,repo);
  assert.equal(projectId(repo),'github:'+repo.id);assert.equal(readProjectLink(url,repos).id,repo.id);
  const renamed={...repo,name:'Renamed-public-project'};
  assert.equal(readProjectLink(url,[renamed]).name,renamed.name);
  assert.equal(readProjectLink(url,[{...repo,visibility:'private'}]),null);
  for(const query of ['?repo=github:999999999999','?repo=https://evil.example/','?repo=github:0','?repo=github:'+repo.id+'&repo=github:'+repo.id])assert.equal(readProjectLink(base+query,repos),null);
  assert.equal(new URL(projectLink(url,null)).searchParams.has('repo'),false);
});

test('the Atlas uses its checked entrance and only promises reviewed public chapters',()=>{
  assert.equal(atlasLink(atlas),atlas.url);
  const known=repos.find(r=>r.name==='Domistika');assert(atlas.chapters.includes(projectId(known)));
  assert.equal(new URL(atlasLink(atlas,known)).searchParams.get('chapter'),'Domistika');
  assert.equal(atlasLink({...atlas,chapters:[]},known),atlas.url);
  assert.equal(atlasLink({...atlas,url:'https://unreviewed.example/'}),null);
  assert(atlas.chapters.every(id=>repos.some(r=>r.visibility==='public'&&projectId(r)===id)));
});
