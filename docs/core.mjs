export const PLANETS=[
{name:'Mercury',key:'mercury',au:.39,r:60,size:2.3,color:0xafa49a,angle:2.0,solid:true,crystal:0xffc766,crystalName:'Amber',atmosColor:0xffffff,atmos:0,gravity:3.7,terrain:1.4,sky:0x040915,air:'Sparse exosphere',composition:'Scattered atoms of oxygen, sodium, hydrogen, helium and potassium.',regions:['Sparse exosphere'],fact:'Mercury has a tiny exosphere, not a thick atmosphere. No clouds cover its cratered surface.',source:'https://science.nasa.gov/mercury/facts/'},
{name:'Venus',key:'venus',au:.72,r:90,size:4.2,color:0xd9ad69,angle:3,solid:true,crystal:0xff86ba,crystalName:'Rose',atmosColor:0xfbc273,atmos:.065,gravity:8.9,terrain:1.9,sky:0x786042,air:'Very thick atmosphere',composition:'Mostly carbon dioxide. Its clouds contain sulfuric acid.',regions:['Upper atmosphere','Sulfuric-acid clouds','Dense lower atmosphere'],fact:'Venus is rocky below the clouds. Its dense carbon dioxide atmosphere traps extreme heat.',source:'https://science.nasa.gov/venus/venus-facts/'},
{name:'Earth',key:'earth',au:1,r:125,size:4.5,color:0x83c7e8,angle:4.1,solid:true,crystal:0x70ff9c,crystalName:'Emerald',atmosColor:0x5598f3,atmos:.024,gravity:9.8,terrain:.3,sky:0x779bc6,air:'Nitrogen and oxygen',composition:'About 78% nitrogen and 21% oxygen, with other gases.',regions:['Exosphere','Thermosphere','Mesosphere','Stratosphere','Troposphere'],fact:'Clouds and weather gather in the troposphere, the lowest of Earth’s five main atmospheric layers.',source:'https://science.nasa.gov/earth/facts/'},
{name:'Mars',key:'mars',au:1.52,r:170,size:6.5,color:0xe29865,angle:0,solid:true,crystal:0x65f5ee,crystalName:'Aqua',atmosColor:0xf0a477,atmos:.010,gravity:3.7,terrain:1.5,sky:0xa47860,air:'Thin, dusty atmosphere',composition:'Mostly carbon dioxide, with nitrogen and argon.',regions:['Upper atmosphere','Thin lower atmosphere','Dust haze'],fact:'Mars has a thin atmosphere. Rust-colored dust helps give its sky a reddish haze.',source:'https://science.nasa.gov/mars/facts/'},
{name:'Jupiter',key:'jupiter',au:5.2,r:255,size:13,color:0xe4c8a7,angle:5.1,solid:false,crystal:0xffec75,crystalName:'Sunstone',atmosColor:0xddb188,atmos:.055,gravity:12,terrain:0,sky:0x9e7c63,air:'Cloud bands and deep gas',composition:'Mostly hydrogen and helium. Ammonia and water clouds.',regions:['Upper atmosphere','Clouds and haze','Deeper atmosphere'],fact:'Jupiter has no solid ground to land on. You explore from our imaginary floating cloud station.',source:'https://science.nasa.gov/jupiter/jupiter-facts/'},
{name:'Saturn',key:'saturn',au:9.54,r:330,size:10,color:0xe9d2a0,angle:.9,solid:false,crystal:0xc6a0ff,crystalName:'Amethyst',atmosColor:0xebd099,atmos:.05,gravity:8,terrain:0,sky:0x9f9275,air:'Soft bands and haze',composition:'Mostly hydrogen and helium. Its rings orbit outside the atmosphere.',regions:['Upper atmosphere','Clouds and haze','Deeper atmosphere'],fact:'Saturn’s rings contain ice and rock. This world has no solid surface for walking.',source:'https://science.nasa.gov/saturn/facts/'},
{name:'Uranus',key:'uranus',au:19.19,r:405,size:7,color:0x9bdbd5,angle:2.7,solid:false,crystal:0xb1ffdf,crystalName:'Mint',atmosColor:0x7ad4cf,atmos:.045,gravity:8,terrain:0,sky:0x75a7a7,air:'Pale blue-green haze',composition:'Mostly hydrogen and helium, with methane that absorbs red light.',regions:['Upper atmosphere','Clouds and haze','Deeper atmosphere'],fact:'Uranus is an ice giant tipped on its side. Its deep fluids are not a solid walking surface.',source:'https://science.nasa.gov/uranus/facts/'},
{name:'Neptune',key:'neptune',au:30.07,r:475,size:6.7,color:0x88c9d8,angle:4,solid:false,crystal:0x72aaff,crystalName:'Sapphire',atmosColor:0x67b4cf,atmos:.05,gravity:9,terrain:0,sky:0x658eaa,air:'Blue-green gas and clouds',composition:'Mostly hydrogen and helium, with methane and methane-ice clouds.',regions:['Upper atmosphere','Clouds and haze','Deeper atmosphere'],fact:'Neptune is naturally pale blue-green. Fast winds sweep its clouds. Our cloud station is fictional.',source:'https://science.nasa.gov/neptune/neptune-facts/'}];
export const RADIUS=96,STATION={x:204,y:19,z:-37};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const add=(a,b)=>a.map((v,i)=>v+b[i]);export const sub=(a,b)=>a.map((v,i)=>v-b[i]);export const scale=(a,s)=>a.map(v=>v*s);export const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);export const length=a=>Math.hypot(...a);export const norm=a=>length(a)>1e-10?scale(a,1/length(a)):[0,1,0];export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function basis(n){const right=norm(cross(Math.abs(n[1])>.98?[0,0,1]:[0,1,0],n));return{right,back:norm(cross(right,n))};}
export function tangent(v,n){return sub(v,scale(n,dot(v,n)));}
export function advance(n,dir,meters){const d=tangent(dir,n);if(length(d)<1e-9)return[...n];const a=meters/RADIUS;return norm(add(scale(n,Math.cos(a)),scale(norm(d),Math.sin(a))));}
export const arc=(a,b)=>Math.acos(clamp(dot(a,b),-1,1))*RADIUS;
export const SPAWN=norm([.25,.64,.74]);export const SPAWN_BASIS=basis(SPAWN);
export function heightFor(index,n){const p=PLANETS[index];if(!p.solid)return 0;if(index===2)return .12;const[x,y,z]=n;let h=(Math.sin(x*19+index)*Math.cos(z*17)+.45*Math.sin(y*33+z*11)+.19*Math.sin(x*61-y*39))*p.terrain;if(index===0){for(const c of CRATERS){const d=Math.acos(clamp(dot(n,c.n),-1,1));if(d<c.r*1.2){const q=d/c.r;h+=q<.83?-(1-q*q)*c.depth:Math.sin((q-.83)/.37*Math.PI)*c.depth*.25;}}}return h;}
export function seedRandom(seed=87231){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const crng=seedRandom(52),CRATERS=Array.from({length:23},()=>({n:norm([crng()-.5,crng()-.5,crng()-.5]),r:.035+crng()*.12,depth:.3+crng()*1.3}));
export function planetPosition(i){const p=PLANETS[i];return{x:Math.cos(p.angle)*p.r,y:0,z:Math.sin(p.angle)*p.r};}

// One geometry contract for deck rendering, collision, crystals and navigation.
export const PLATFORMS = [
  {id:0,x:0,z:0,w:44,d:38,links:[1,3,5,7]},
  {id:1,x:35,z:0,w:18,d:18,links:[0,2]},
  {id:2,x:58,z:0,w:18,d:18,links:[1]},
  {id:3,x:-35,z:0,w:18,d:18,links:[0,4]},
  {id:4,x:-58,z:0,w:18,d:18,links:[3]},
  {id:5,x:0,z:-32,w:18,d:18,links:[0,6]},
  {id:6,x:0,z:-55,w:18,d:18,links:[5]},
  {id:7,x:0,z:32,w:18,d:18,links:[0,8]},
  {id:8,x:0,z:55,w:18,d:18,links:[7]}
];
export function platformAt(x,z,margin=0){return PLATFORMS.find(p=>Math.abs(x-p.x)<=p.w/2-margin&&Math.abs(z-p.z)<=p.d/2-margin)||null;}
export function safeDeckPoint(x,z,preferred=null){
  const candidates=preferred?[preferred]:PLATFORMS;
  return candidates.map(p=>({x:clamp(x,p.x-p.w/2+1.2,p.x+p.w/2-1.2),z:clamp(z,p.z-p.d/2+1.2,p.z+p.d/2-1.2),platform:p.id})).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
}
export function platformPath(from,to){
  const a=platformAt(from.x,from.z)||PLATFORMS[safeDeckPoint(from.x,from.z).platform],end=safeDeckPoint(to.x,to.z),b=PLATFORMS[end.platform];
  if(a.id===b.id)return[end];
  const queue=[[a.id]],seen=new Set([a.id]);
  while(queue.length){const route=queue.shift(),last=route.at(-1);if(last===b.id)return route.map(id=>({x:PLATFORMS[id].x,z:PLATFORMS[id].z,platform:id})).concat(end);
    for(const next of PLATFORMS[last].links)if(!seen.has(next)){seen.add(next);queue.push([...route,next]);}}
  return[end];
}
export function flightPath(from,to){
  const start=[from.x,from.y,from.z],end=[to.x,to.y,to.z],delta=sub(end,start),denominator=dot(delta,delta);
  const obstacles=[{x:0,y:0,z:0,size:15},...PLANETS.map((p,i)=>({...planetPosition(i),size:p.size}))];
  const blocked=obstacles.some(p=>{
    const center=[p.x,p.y,p.z],t=denominator?clamp(dot(sub(center,start),delta)/denominator,0,1):0;
    return length(sub(add(start,scale(delta,t)),center))<p.size+4;
  });
  if(!blocked)return[to];
  const cruise=Math.max(52,from.y,to.y);
  return[{x:from.x,y:cruise,z:from.z,kind:'waypoint'},{x:to.x,y:cruise,z:to.z,kind:'waypoint'},to];
}
function planetState(index){
  const p=PLANETS[index],rng=seedRandom(901+index*8123),crystals=[];
  for(let i=0;i<130;i++){
    let n,x,z;
    if(p.solid){if(i<22){const a=rng()*Math.PI*2,dir=add(scale(SPAWN_BASIS.right,Math.cos(a)),scale(SPAWN_BASIS.back,Math.sin(a)));n=advance(SPAWN,dir,7+rng()*35);}else n=norm([rng()-.5,rng()-.5,rng()-.5]);}
    else{const deck=PLATFORMS[i<22?0:1+(i%8)];x=deck.x+(rng()-.5)*(deck.w-5);z=deck.z+(rng()-.5)*(deck.d-5);if(deck.id===0&&Math.hypot(x+13,z+8)<8){x=5+rng()*12;z=-10+rng()*16;}}
    crystals.push({id:i,n,x,z,value:i%15===0?3:1});
  }
  if(p.solid){crystals[0].n=advance(SPAWN,SPAWN_BASIS.back,-7);crystals[1].n=advance(SPAWN,SPAWN_BASIS.back,-13);}else{crystals[0].x=0;crystals[0].z=-7;}
  return{crystals,collected:new Set(),remaining:new Map(),rover:{n:advance(SPAWN,SPAWN_BASIS.right,11),x:11,z:5,heading:[...SPAWN_BASIS.back]},rocket:{n:advance(SPAWN,add(scale(SPAWN_BASIS.right,-1),scale(SPAWN_BASIS.back,-.6)),14),x:-13,z:-8},collectedCount:0};
}
export class GameState{
  constructor(){this.reset();}
  reset(){
    this.mode='foot';this.planet=3;this.n=[...SPAWN];this.x=0;this.z=3;this.alt=0;this.vy=0;this.heading=[...SPAWN_BASIS.back];
    this.cargo=0;this.cargoColors=Array(8).fill(0);this.deliveredColors=Array(8).fill(0);this.delivered=0;this.credits=0;this.capacity=30;this.magnet=false;this.bagLevel=0;
    this.energy=100;this.roverFuel=100;this.rocketFuel=100;this.target=null;this.route=null;this.path=[];this.worlds=PLANETS.map((_,i)=>planetState(i));this.visited=new Set([3]);
    this.space={x:185,y:8,z:14,heading:Math.PI};this.lastLanding=3;this.water=false;this.checkpoint={x:0,z:3};this.recoveries=0;this.jumpHeld=false;
  }
  get world(){return this.worlds[this.planet];} get info(){return PLANETS[this.planet];} get solid(){return this.info.solid;}
  get ground(){return this.mode==='foot'||this.mode==='rover';} get fuel(){return this.mode==='foot'?this.energy:this.mode==='rover'?this.roverFuel:this.rocketFuel;}
  get rover(){return this.world.rover;} get rocket(){return this.world.rocket;} get crystals(){return this.world.crystals;} get collected(){return this.world.collected;}
  get supported(){return this.solid||!!platformAt(this.x,this.z);}
  distanceTo(target){return this.solid?arc(this.n,target.n):Math.hypot(this.x-target.x,this.z-target.z);}
  cancelNavigation(){this.target=null;this.route=null;this.path=[];}
  walkTo(target){
    if(!this.ground)return false;
    this.cancelNavigation();
    if(this.solid)this.target={n:norm(target.n)};
    else{const current=platformAt(this.x,this.z);if(this.mode==='rover'){const safe=safeDeckPoint(target.x,target.z,current||PLATFORMS[0]);this.path=[safe];}else this.path=platformPath(this,target);this.target=this.path.shift();}
    return true;
  }
  navigate(dest){
    if(dest!=='station'&&(!Number.isInteger(dest)||dest<0||dest>7))return false;
    this.cancelNavigation();
    if(this.ground&&dest===this.planet)return true;
    if(this.mode==='docked')this.undock();
    if(this.mode==='flight')return this.setCourse(dest);
    if(this.mode==='rover')this.exitRover();
    if(this.alt<-.1)this.recoverFromFall();
    this.walkTo(this.solid?{n:advance(this.rocket.n,basis(this.rocket.n).right,3)}:{x:this.rocket.x+3,z:this.rocket.z+3});
    this.route={destination:dest,phase:'rocket'};return true;
  }
  collect(){
    if(!this.ground||this.cargo>=this.capacity||this.alt>3||this.alt<-.1||!this.supported)return[];
    const out=[],radius=this.magnet?5:this.mode==='rover'?3.6:2.1;
    for(const c of this.crystals)if(!this.collected.has(c.id)&&this.distanceTo(c)<radius&&this.cargo<this.capacity){
      const available=this.world.remaining.get(c.id)??c.value,count=Math.min(available,this.capacity-this.cargo);
      this.cargo+=count;this.cargoColors[this.planet]+=count;this.world.collectedCount+=count;
      if(count===available){this.collected.add(c.id);this.world.remaining.delete(c.id);}else this.world.remaining.set(c.id,available-count);
      out.push({...c,awarded:count,depleted:count===available});
    }return out;
  }
  nearbyPlanet(){let nearest=-1,d=Infinity;for(let i=0;i<PLANETS.length;i++){const p=planetPosition(i),dist=Math.hypot(this.space.x-p.x,this.space.y,this.space.z-p.z)-PLANETS[i].size;if(dist<d){d=dist;nearest=i;}}return{index:nearest,distance:d};}
  interaction(){
    if(this.mode==='rover')return'exit';if(this.mode==='docked')return'none';
    if(this.mode==='flight'){const d=Math.hypot(this.space.x-STATION.x,this.space.y-STATION.y,this.space.z-STATION.z);if(d<15)return'dock';if(this.nearbyPlanet().distance<14)return'land';return'route';}
    if(this.alt>.6||this.alt<-.1||!this.supported)return'falling';
    const rd=this.distanceTo(this.rover),kd=this.distanceTo(this.rocket);if(kd<8&&kd<rd)return'launch';if(rd<6)return'enter';if(kd<8)return'launch';return'vehicle';
  }
  exitRover(){
    this.mode='foot';if(this.solid)this.n=advance(this.n,basis(this.n).right,4);else{const pos=safeDeckPoint(this.x+3,this.z,platformAt(this.x,this.z));this.x=pos.x;this.z=pos.z;this.checkpoint={x:this.x,z:this.z};}
    this.alt=this.vy=0;this.cancelNavigation();
  }
  interact(){
    const action=this.interaction();
    if(action==='exit')this.exitRover();
    if(action==='enter'){this.mode='rover';this.n=[...this.rover.n];this.x=this.rover.x;this.z=this.rover.z;this.heading=[...this.rover.heading];this.alt=this.vy=0;this.cancelNavigation();}
    if(action==='launch')this.launch();if(action==='land')this.land(this.nearbyPlanet().index);
    if(action==='dock'){this.mode='docked';this.cancelNavigation();}return action;
  }
  launch(){const p=planetPosition(this.planet);this.lastLanding=this.planet;this.mode='flight';this.space={x:p.x+PLANETS[this.planet].size+18,y:8,z:p.z+12,heading:Math.PI};this.cancelNavigation();this.alt=this.vy=0;return'launch';}
  land(index){
    if(!Number.isInteger(index)||index<0||index>7)throw new Error('Unknown planet');
    this.planet=index;this.lastLanding=index;this.visited.add(index);this.mode='foot';this.n=[...SPAWN];this.x=0;this.z=3;this.heading=[...SPAWN_BASIS.back];this.alt=this.vy=0;this.cancelNavigation();this.water=false;this.checkpoint={x:0,z:3};return'land';
  }
  setCourse(index){
    if(this.mode!=='flight')return false;
    if(index!=='station'&&(!Number.isInteger(index)||index<0||index>7))return false;
    this.cancelNavigation();
    if(index==='station')this.target={x:STATION.x+9,y:STATION.y,z:STATION.z,kind:'station'};
    else{const p=planetPosition(index);this.target={x:p.x+PLANETS[index].size+8,y:3,z:p.z,kind:'planet',planet:index};}
    this.path=flightPath(this.space,this.target);this.target=this.path.shift();
    this.route={destination:index,phase:'flight'};return true;
  }
  undock(){if(this.mode!=='docked')return false;this.mode='flight';this.space={x:STATION.x+18,y:STATION.y,z:STATION.z+4,heading:2.7};this.cancelNavigation();return true;}
  deposit(){if(this.mode!=='docked'||this.cargo===0)return 0;const n=this.cargo;this.delivered+=n;this.credits+=n;for(let i=0;i<8;i++){this.deliveredColors[i]+=this.cargoColors[i];this.cargoColors[i]=0;this.worlds[i].collected.clear();this.worlds[i].remaining.clear();}this.cargo=0;return n;}
  refuel(){if(this.mode!=='docked')return false;this.energy=this.roverFuel=this.rocketFuel=100;return true;}
  buy(type){if(this.mode!=='docked')return false;if(type==='bag'&&this.credits>=10&&this.bagLevel<4){this.credits-=10;this.capacity+=15;this.bagLevel++;return true;}if(type==='magnet'&&this.credits>=15&&!this.magnet){this.credits-=15;this.magnet=true;return true;}return false;}
  rescue(){this.mode='foot';if(this.solid)this.n=advance(this.rocket.n,basis(this.rocket.n).right,4);else{const p=safeDeckPoint(this.rocket.x+4,this.rocket.z+4);this.x=p.x;this.z=p.z;this.checkpoint={x:this.x,z:this.z};}this.alt=this.vy=0;this.cancelNavigation();this.energy=Math.max(30,this.energy);this.rocketFuel=Math.max(30,this.rocketFuel);}
  recoverFromFall(){const p=safeDeckPoint(this.checkpoint.x,this.checkpoint.z);this.x=p.x;this.z=p.z;this.alt=this.vy=0;this.cancelNavigation();this.recoveries++;}
  step(dt,input={},view={right:SPAWN_BASIS.right,back:SPAWN_BASIS.back}){
    dt=clamp(Number.isFinite(dt)?dt:0,0,.05);if(this.mode==='docked'||dt===0)return;
    const ix=clamp(input.x||0,-1,1),iz=clamp(input.z||0,-1,1),manual=Math.hypot(ix,iz)>.001||!!input.up;
    const jump=!!input.jump&&!this.jumpHeld;this.jumpHeld=!!input.jump;
    if(manual||(jump&&this.ground))this.cancelNavigation();
    if(this.mode==='flight'){
      const target=this.target;let d=target?[target.x-this.space.x,target.y-this.space.y,target.z-this.space.z]:[ix,0,iz];const size=length(d);
      const throttle=target?1:Math.min(1,size),speed=this.rocketFuel<=0?12:input.boost?100:target?65:32;
      if(size>0)d=scale(d,1/size);const travel=Math.min(target?size:Infinity,speed*dt*throttle);
      this.space.x+=d[0]*travel;this.space.z+=d[2]*travel;this.space.y=clamp(this.space.y+d[1]*travel+(input.up||0)*18*dt,-90,140);
      if(size>.01)this.space.heading=Math.atan2(d[0],d[2]);
      if(size>.01||input.up)this.rocketFuel=Math.max(0,this.rocketFuel-.09*dt);
      if(target&&Math.hypot(target.x-this.space.x,target.y-this.space.y,target.z-this.space.z)<.25){
        const destination=this.route?.destination;
        if(this.path.length)this.target=this.path.shift();
        else if(destination==='station'){this.mode='docked';this.cancelNavigation();}
        else if(Number.isInteger(destination))this.land(destination);
        else this.target=null;
      }
      const r=Math.hypot(this.space.x,this.space.z);if(r>650){this.space.x*=649/r;this.space.z*=649/r;this.cancelNavigation();}return;
    }
    if(this.route?.phase==='rocket'&&this.distanceTo(this.rocket)<5&&this.alt<.1&&this.alt>=0&&this.supported){const destination=this.route.destination;this.launch();this.setCourse(destination);return;}
    const supportedBeforeMovement=this.supported;
    let dir=add(scale(view.right,ix),scale(view.back,iz)),dx=0,dz=0,remaining=Infinity;
    if(this.target){
      remaining=this.distanceTo(this.target);
      if(remaining<.55){if(this.path.length)this.target=this.path.shift();else this.target=null;}
      if(this.target){remaining=this.distanceTo(this.target);if(this.solid){dir=tangent(this.target.n,this.n);if(length(dir)<1e-8&&remaining>1)dir=basis(this.n).right;}else{dx=this.target.x-this.x;dz=this.target.z-this.z;}}
    }
    const auto=!!this.target;
    let speed=this.mode==='rover'?(input.run&&this.roverFuel>0?24:15):(input.run&&this.energy>0?10:5.8);
    if(this.water&&this.mode==='foot')speed*=.65;if(this.mode==='rover'&&this.roverFuel<=0)speed=7;
    const throttle=auto?1:Math.min(1,Math.hypot(ix,iz));speed*=throttle;
    let moving=false,autoJump=false;
    if(this.solid){dir=tangent(dir,this.n);if(length(dir)>.001&&speed>0){this.n=advance(this.n,dir,Math.min(speed*dt,remaining));this.heading=norm(tangent(dir,this.n));moving=true;}}
    else{
      if(!auto){dx=dot(dir,SPAWN_BASIS.right);dz=dot(dir,SPAWN_BASIS.back);}const mag=Math.hypot(dx,dz);
      if(mag>.001&&speed>0){
        dx/=mag;dz/=mag;
        autoJump=auto&&this.mode==='foot'&&this.alt<=.001&&this.supported&&!platformAt(this.x+dx*.85,this.z+dz*.85);
        const stride=Math.min(speed*dt,remaining),nx=this.x+dx*stride,nz=this.z+dz*stride;
        if(this.mode!=='rover'||platformAt(nx,nz,1)){this.x=nx;this.z=nz;moving=true;}else if(auto)this.cancelNavigation();
        this.heading=norm(add(scale(SPAWN_BASIS.right,dx),scale(SPAWN_BASIS.back,dz)));
      }
    }
    if((jump||autoJump)&&this.alt<=.001&&this.alt>=-.01&&supportedBeforeMovement&&this.mode==='foot')this.vy=7.5;
    const previousAlt=this.alt;this.vy-=clamp(this.info.gravity,3.7,12)*dt;this.alt+=this.vy*dt;
    if(this.supported&&this.alt<=0&&previousAlt>=-.1){this.alt=0;this.vy=0;}
    if(!this.solid&&this.alt===0&&platformAt(this.x,this.z,1.5))this.checkpoint={x:this.x,z:this.z};
    if(!this.solid&&this.alt<-18){this.recoverFromFall();return;}
    if(this.mode==='rover'){this.rover.n=[...this.n];this.rover.x=this.x;this.rover.z=this.z;this.rover.heading=[...this.heading];this.alt=0;this.vy=0;if(moving)this.roverFuel=Math.max(0,this.roverFuel-.08*dt);}
    else if(input.run&&moving)this.energy=Math.max(0,this.energy-.14*dt);else this.energy=Math.min(100,this.energy+.45*dt);
  }
}
