import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const imageUrl=new URL('../src/gateway/cosmic-field.webp',import.meta.url);
const css=readFileSync(new URL('../src/gateway/gateway.css',import.meta.url),'utf8');
const image=readFileSync(imageUrl);

test('the cosmic portal ships as the exact optimized local WebP used by the Netlify preview',()=>{
  assert.equal(image.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(image.subarray(8,12).toString('ascii'),'WEBP');
  assert.equal(createHash('sha256').update(image).digest('hex'),'65d6b59bd87a232a8da6800714dba5d78440c4f8ab41abe466f8340184bcd2dc');
  assert(image.length<200000,'Portal art should remain lightweight');
  assert.match(css,/url\('\.\/cosmic-field\.webp'\)/);
  assert.match(css,/rgba\(3, 8, 23, \.60\)/,'Overlay retains headline contrast');
});
