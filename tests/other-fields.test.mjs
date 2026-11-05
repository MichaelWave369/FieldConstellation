import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
const root = new URL('../src/', import.meta.url);
const main = await readFile(new URL('index.html', root), 'utf8');
const page = await readFile(new URL('other-fields/index.html', root), 'utf8');
const css = await readFile(new URL('other-fields/houses.css', root), 'utf8');
const expected = [['ChipsHouse','Larrina'],['XiHouse','Hunter'],['OmegaHouse','Jeffrey'],['WAREHouse','Nicole'],['QuillHouse','Joseph'],['QEFHouse','Stanley']];
test('Phitarium links to the static Other Fields page', () => {
 assert.equal(main.split('href="./other-fields/index.html"').length-1, 2);
 assert.ok(page.includes('href="../index.html"'));
 assert.ok(page.includes('href="./houses.css"'));
});
test('all six canonical Houses and creators are present; only approved destinations are linked', () => {
 assert.equal(page.split('<article class="house ').length-1, 6);
 for(const [house,owner] of expected){ assert.ok(page.includes('>'+house+'</h2>'),house); assert.ok(page.includes('A world by '+owner),owner); }
 assert.equal(page.split('Portal awaiting its creator').length-1, 2,'Unconfirmed Quill and QEF portals remain pending');
 const urls=[
   'https://larrinamsalva.github.io/larrina-creator-hub/',
   'https://www.xi-field.com/',
   'https://ware-portal-nicwitahole311.replit.app/',
   'https://omegav6.jeffdeweyeljefe.workers.dev/'
 ];
 for(const url of urls)assert.ok(page.includes('href="'+url+'"'),url);
 assert.equal((page.match(/class="house-link"/g)||[]).length,4);
 assert.equal((page.match(/rel="noopener noreferrer"/g)||[]).length,4);
});
test('privacy and accessibility defaults', () => {
 assert.ok(page.includes('Each House belongs to its creator'));
 assert.ok(page.includes('Skip to the Six Houses'));
 assert.ok(css.includes('prefers-reduced-motion'));
});
