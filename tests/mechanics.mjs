import assert from 'node:assert/strict';
import {GameState,PLANETS,STATION,RADIUS,SPAWN,SPAWN_BASIS,arc,advance,norm,basis,length,dot,planetPosition} from '../dist/core.mjs';
const close=(a,b,t=1e-7)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
assert.deepEqual(PLANETS.map(p=>p.name),['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']);assert.equal(PLANETS.filter(p=>p.solid).length,4);assert.equal(new Set(PLANETS.map(p=>p.crystal)).size,8);assert.equal(PLANETS[0].atmos,0);
let n=[...SPAWN],dir=[...SPAWN_BASIS.right];for(let i=0;i<6284;i++){const next=advance(n,dir,.096);dir=norm(dir.map((v,k)=>v-next[k]*dot(dir,next)));n=next;close(length(n),1);}assert(arc(n,SPAWN)<.15,'Spherical circuit closes without a world edge');
for(let planet=0;planet<8;planet++){
 const g=new GameState();g.launch();assert(g.setCourse(planet));for(let i=0;i<1000&&g.target;i++)g.step(.05,{});assert.equal(g.nearbyPlanet().index,planet);assert.equal(g.interact(),'land');assert.equal(g.planet,planet);assert(g.visited.has(planet));
 if(g.solid)g.n=[...g.rover.n];else{g.x=g.rover.x;g.z=g.rover.z;}assert.equal(g.interact(),'enter');const old=g.solid?[...g.n]:[g.x,g.z];g.step(.05,{x:1,run:true});assert(g.solid?arc(g.n,old)>0:Math.hypot(g.x-old[0],g.z-old[1])>0);assert.equal(g.interact(),'exit');
 const c=g.crystals[0];if(g.solid)g.n=[...c.n];else{g.x=c.x;g.z=c.z;}const hit=g.collect();assert(hit.length>0);assert(g.cargoColors[planet]>0);assert.equal(g.cargoColors.reduce((a,b)=>a+b,0),g.cargo);
 g.alt=0;g.step(.05,{jump:true});assert(g.alt>0);for(let k=0;k<250;k++)g.step(.05,{});close(g.alt,0);
 g.launch();g.setCourse('station');for(let k=0;k<1000&&g.target;k++)g.step(.05,{});assert.equal(g.interact(),'dock');const cargo=g.cargo;assert.equal(g.deposit(),cargo);assert.equal(g.cargo,0);assert.equal(g.deliveredColors[planet],cargo);assert(g.refuel());assert(g.undock());
}
let g=new GameState();g.world.crystals=[{id:0,n:[...g.n],value:3}];g.cargo=29;g.cargoColors[3]=29;assert.equal(g.collect()[0].awarded,1);assert(!g.collected.has(0));g.cargo=0;g.cargoColors.fill(0);assert.equal(g.collect()[0].awarded,2);assert(g.collected.has(0));assert.equal(g.collect().length,0);
g=new GameState();g.mode='docked';g.cargo=30;g.cargoColors[3]=20;g.cargoColors[2]=10;g.deposit();assert.deepEqual(g.deliveredColors,[0,0,10,20,0,0,0,0]);assert(g.buy('bag'));assert.equal(g.capacity,45);assert(g.buy('magnet'));assert.equal(g.credits,5);assert(!g.buy('magnet'));g.undock();assert(!g.buy('bag'));assert.equal(g.deposit(),0);
g.land(4);for(let i=0;i<5000;i++)g.step(.05,{x:1,z:1,run:true});assert(g.x<=42&&g.z<=42);assert(Number.isFinite(g.x));g.cargo=17;g.rescue();assert.equal(g.cargo,17);assert.equal(g.mode,'foot');g.launch();g.rocketFuel=0;const oldx=g.space.x;g.step(.05,{x:1});assert(g.space.x>oldx);assert(!g.setCourse(8));assert.throws(()=>g.land(-1));
console.log('PASS: seamless sphere movement, 8 planet routes/landings, 8 crystal colours, giant decks, rover/run/jump, docking/deposit, partial pickups, supply upgrades, rescue and emergency flight.');
