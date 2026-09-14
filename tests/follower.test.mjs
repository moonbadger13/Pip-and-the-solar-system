import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {astronaut,alien,roverModel} from '../dist/models.js';
import {followMotion,smoothFollowPace,arc,advance,SPAWN,SPAWN_BASIS,dot,norm,sub,scale} from '../dist/core.mjs';
for(const fps of[20,30,60])for(const speed of[5.8,10])test(`Pip smoothly follows ${speed} m/s at ${fps} FPS`,()=>{
 let pip=advance(SPAWN,SPAWN_BASIS.back,-3.5);const dt=1/fps;
 for(let i=0;i<fps*20;i++){
  const player=advance(SPAWN,SPAWN_BASIS.back,speed*(i+1)*dt),{travel,pace}=followMotion(arc(pip,player),dt);
  assert(Number.isFinite(travel)&&travel>=0&&travel<=18*dt+1e-10);assert(pace>=0&&pace<=18+1e-10);
  pip=advance(pip,norm(sub(player,scale(pip,dot(player,pip)))),travel);
  if(i>fps*3){assert(travel>1e-8,'Moving explorer must not cause stop/start');const gap=arc(pip,player);assert(gap>=2.8-1e-8&&gap<6,`Following gap ${gap}`);}
 }
});
test('Pip settles without overshoot, and resting noise stays imperceptible',()=>{
 let distance=12,previous=Infinity;
 for(let i=0;i<1200;i++){const {travel,pace}=followMotion(distance,1/60);assert(travel>=0&&travel<=distance-2.8+1e-10);assert(pace<=previous+1e-10);distance-=travel;previous=pace;}
 assert(Math.abs(distance-2.8)<1e-8);assert(previous<1e-8);assert.deepEqual(followMotion(12,0),{travel:0,pace:0});
 for(let i=0;i<500;i++){const {travel,pace}=followMotion(2.8+Math.sin(i)*1e-10,1/60);assert(travel<1e-9&&pace<1e-8);}
});
test('animation pace eases consistently across frame rates',()=>{
 for(const fps of[20,30,60]){let p=0;for(let i=0;i<fps;i++)p=smoothFollowPace(p,10,1/fps);assert(Math.abs(p-10*(1-Math.exp(-8)))<1e-10);
 for(let i=0;i<fps;i++)p=smoothFollowPace(p,0,1/fps);assert(p>=0&&p<.004);}
});
test('platform floor clears its base and matches collision height',()=>{
 const source=readFileSync(new URL('../dist/planet-world.js',import.meta.url),'utf8');
 const base=source.match(/box\(pod,\s*deckMat,\s*w,\s*([-\d.]+),\s*d,\s*0,\s*([-\d.]+),\s*0\)/);
 const floor=source.match(/box\(pod,\s*floorMat,\s*w\s*-\s*[\d.]+,\s*([-\d.]+),\s*d\s*-\s*[\d.]+,\s*0,\s*([-\d.]+),\s*0\)/);
 assert(base&&floor);assert(Math.abs(+floor[2]+(+floor[1])/2)<1e-8);assert(+floor[2]-(+floor[1])/2-(+base[2]+(+base[1])/2)>=.015);
});
test('real character meshes cast ground shadows without receiving self-shadow shimmer',()=>{
 const rover=roverModel();
 for(const model of[astronaut(),alien(),rover.driver,rover.pip]){
  let count=0;model.root.traverse(o=>{if(o.isMesh){count++;assert.equal(o.receiveShadow,false);assert.equal(o.castShadow,true);}});assert(count>10);
 }
});
