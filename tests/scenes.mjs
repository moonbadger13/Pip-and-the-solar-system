import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {GameState,RADIUS,SPAWN,SPAWN_BASIS} from '../dist/core.mjs';
import {textures,makeSurface,orbitalGlobe,pointFor,orient} from '../dist/planet-world.js';
import {astronaut,alien,roverModel,rocketModel,mothership} from '../dist/models.js';
for(const key of ['mercury','venus','venusClouds','earth','earthClouds','mars','jupiter','saturn','uranus','neptune','rings']){const t=new THREE.DataTexture(new Uint8Array([128,160,190,255]),1,1);t.needsUpdate=true;textures[key]=t;}
for(let i=0;i<8;i++){
 const g=new GameState();g.land(i);const s=makeSurface(g);assert.equal(s.crystals.length,130);assert.equal(!!s.air,i!==0);assert.equal(!!s.deck,i>=4);assert.equal(!!s.ring,i===5||i===6);
 const player=astronaut();player.root.position.copy(pointFor(g));orient(player.root,g.solid?g.n:SPAWN,g.heading);assert(player.root.position.length()>RADIUS-5);assert(player.root.quaternion.toArray().every(Number.isFinite));
 s.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(s.root);assert(Number.isFinite(bounds.min.x));assert(bounds.max.x-bounds.min.x>180);const orb=orbitalGlobe(i,10);assert(orb.group.children.length>=1);s.dispose();
}
for(const fn of[alien,roverModel,rocketModel])assert(fn().root.children.length>0);assert(mothership().children.length>0);
console.log('PASS: 8 Three.js planet scenes, texture material configuration, atmosphere presence, giant decks, rings and articulated game models construct successfully.');
