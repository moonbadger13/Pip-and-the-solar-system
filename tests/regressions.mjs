import assert from 'node:assert/strict';
import {GameState,PLANETS,PLATFORMS,platformAt,SPAWN,SPAWN_BASIS,arc,advance,basis,scale,STATION} from '../dist/core.mjs';
const failures=[],counts={};
function test(group,label,fn){counts[group]=(counts[group]||0)+1;try{fn();}catch(e){failures.push({group,label,error:e.message});}}
function run(g,max=5000,dt=.05,input={}){let frames=0;while((g.target||g.route)&&frames++<max)g.step(dt,input);assert(frames<max,`Navigation stuck: ${JSON.stringify({mode:g.mode,planet:g.planet,x:g.x,z:g.z,alt:g.alt,target:g.target,route:g.route,recoveries:g.recoveries})}`);return frames;}
function position(g,p){g.x=p.x;g.z=p.z;g.checkpoint={x:p.x,z:p.z};}
for(const mode of ['foot','rover'])for(let from=0;from<8;from++)for(const dest of [...PLANETS.keys(),'station'])test('routes',`${mode} ${from}→${dest}`,()=>{
 const g=new GameState();g.land(from);if(mode==='rover'){if(g.solid)g.n=[...g.rover.n];else position(g,g.rover);assert.equal(g.interact(),'enter');}
 g.cargo=17;g.cargoColors[from]=17;assert(g.navigate(dest));run(g);
 if(dest==='station')assert.equal(g.mode,'docked');else{assert.equal(g.planet,dest);assert(g.ground);if(dest!==from)assert.equal(g.mode,'foot');}
 assert.equal(g.cargo,17);assert.equal(g.cargoColors[from],17);assert.equal(g.recoveries,0);
});
for(let planet=4;planet<8;planet++)for(const from of PLATFORMS)for(const to of PLATFORMS)for(const dt of [.05,1/60])test('platform paths',`${planet}: ${from.id}→${to.id} dt=${dt}`,()=>{
 const g=new GameState();g.land(planet);position(g,from);g.walkTo(to);run(g,12000,dt);assert(Math.hypot(g.x-to.x,g.z-to.z)<.56,`Stopped short: ${JSON.stringify({x:g.x,z:g.z,alt:g.alt,recoveries:g.recoveries,target:g.target})}`);assert.equal(g.recoveries,0,'Navigation fell into gap');
});
for(let planet=4;planet<8;planet++)for(const from of PLATFORMS)test('outer platform departure',`${planet}:${from.id}→station`,()=>{
 const g=new GameState();g.land(planet);position(g,from);g.navigate('station');run(g);assert.equal(g.mode,'docked');assert.equal(g.recoveries,0);
});
for(let planet=4;planet<8;planet++)test('manual gap jumps',`${planet}`,()=>{
 const g=new GameState();g.land(planet);position(g,{x:21,z:0});g.step(.05,{x:1,jump:true});let jumped=g.alt>0;for(let i=0;i<24;i++){g.step(.05,{x:1});jumped||=g.alt>0;}for(let i=0;i<50;i++)g.step(.05,{});assert(jumped);assert.equal(platformAt(g.x,g.z)?.id,1);assert.equal(g.alt,0);assert.equal(g.recoveries,0);
});
for(let planet=4;planet<8;planet++)test('fall recovery',`${planet}`,()=>{
 const g=new GameState();g.land(planet);g.cargo=19;g.cargoColors[planet]=19;position(g,{x:20,z:0});for(let i=0;i<15;i++)g.step(.05,{x:1});assert(g.alt<0,'No fall in gap');assert.equal(g.collect().length,0);assert.equal(g.interaction(),'falling');for(let i=0;i<150;i++)g.step(.05,{});assert.equal(g.recoveries,1);assert(g.supported);assert.equal(g.alt,0);assert.equal(g.cargo,19);assert.equal(g.cargoColors[planet],19);
});
for(const mode of ['foot','rover','flight'])for(const planet of [3,4])test('analog throttle',`${planet}:${mode}`,()=>{
 const make=()=>{const g=new GameState();g.land(planet);if(mode==='flight')g.launch();else if(mode==='rover'){g.mode='rover';position(g,g.rover);g.n=[...g.rover.n];}return g;};
 const slow=make(),full=make(),initial=make(),delta=g=>mode==='flight'?Math.hypot(g.space.x-initial.space.x,g.space.z-initial.space.z):g.solid?arc(g.n,initial.n):Math.hypot(g.x-initial.x,g.z-initial.z);
 slow.step(.05,{x:.2});full.step(.05,{x:1});assert(Math.abs(delta(slow)/delta(full)-.2)<1e-5);
});
for(const mode of ['foot','flight'])for(const input of [{x:.2},{z:-1},{up:1}])test('manual cancellation',`${mode} ${JSON.stringify(input)}`,()=>{
 const g=new GameState();if(mode==='flight')g.launch();g.navigate(2);g.step(.05,input);assert.equal(g.route,null);assert.equal(g.target,null);assert.equal(g.path.length,0);
});
test('jump latch','held button does not bounce',()=>{const g=new GameState();g.land(4);g.step(.05,{jump:true});assert(g.alt>0);for(let i=0;i<100;i++)g.step(.05,{jump:true});assert.equal(g.alt,0);g.step(.05,{});g.step(.05,{jump:true});assert(g.alt>0);});
test('cargo','partial collection and deposit preserves colours',()=>{const g=new GameState();g.world.crystals=[{id:0,n:[...g.n],value:3}];g.cargo=29;g.cargoColors[3]=29;assert.equal(g.collect()[0].awarded,1);assert(!g.collected.has(0));g.cargo=0;g.cargoColors.fill(0);assert.equal(g.collect()[0].awarded,2);assert(g.collected.has(0));g.cargo=30;g.cargoColors[3]=20;g.cargoColors[2]=10;g.mode='docked';assert.equal(g.deposit(),30);assert.deepEqual(g.deliveredColors,[0,0,10,20,0,0,0,0]);assert(g.buy('bag'));assert(g.buy('magnet'));assert.equal(g.credits,5);assert(g.refuel());});
for(let planet=4;planet<8;planet++)test('crystal placement',`${planet}`,()=>{const g=new GameState();g.land(planet);assert(g.crystals.every(c=>platformAt(c.x,c.z,1)));});
for(const variant of ['empty fuel','boosted'])for(let from=0;from<8;from++)for(const dest of [...PLANETS.keys(),'station'])test('flight extremes',`${variant} ${from}→${dest}`,()=>{
 const g=new GameState();g.land(from);g.launch();if(variant==='empty fuel')g.rocketFuel=0;g.navigate(dest);run(g,10000,.05,{boost:variant==='boosted'});assert.equal(g.mode,dest==='station'?'docked':'foot');if(dest!=='station')assert.equal(g.planet,dest);assert(g.rocketFuel>=0);
});
test('edge jump','jump from last 5 cm of hub',()=>{const g=new GameState();g.land(4);g.x=21.95;g.z=0;g.checkpoint={x:20,z:0};g.step(.05,{x:1,jump:true});assert(g.alt>0,`Jump rejected: alt=${g.alt}, vy=${g.vy}`);});
test('antipode','autopilot from exact opposite surface point',()=>{const g=new GameState();g.n=scale(advance(g.rocket.n,basis(g.rocket.n).right,3),-1);g.navigate(2);run(g,8000);assert.equal(g.planet,2);assert.equal(g.mode,'foot');});
console.log(JSON.stringify({counts,total:Object.values(counts).reduce((a,b)=>a+b,0),failureCount:failures.length,failures:failures.slice(0,40)},null,2));if(failures.length)process.exitCode=1;
