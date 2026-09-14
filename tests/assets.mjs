import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=new URL('../dist/',import.meta.url),html=fs.readFileSync(new URL('index.html',root),'utf8'),js=fs.readFileSync(new URL('game.js',root),'utf8');
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.has(m[1]),'Missing DOM id '+m[1]);
for(const m of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g))assert(fs.existsSync(new URL(m[1],root)),m[1]);
for(const f of['game.js','models.js','planet-world.js','input.mjs','vendor/three.module.min.js']){const text=fs.readFileSync(new URL(f,root),'utf8');for(const m of text.matchAll(/from\s*['"](\.\/[^'"]+)['"]/g))assert(fs.existsSync(new URL(m[1],new URL(f,root))),m[1]);}
const assets=fs.readdirSync(new URL('assets/planets/',root));assert.equal(assets.filter(n=>/^2k_/.test(n)).length,11);assert(fs.existsSync(new URL('assets/mission.jpg',root)));assert(fs.existsSync(new URL('.nojekyll',root)));
console.log('PASS: DOM IDs, static asset paths, ES module imports and 11 planetary texture files.');
