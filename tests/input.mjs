import assert from 'node:assert/strict';
import {Joystick,CameraGestures,attachTouchControls} from '../dist/input.mjs';
import * as THREE from '../dist/vendor/three.module.min.js';
import {GameState,PLATFORMS,SPAWN,SPAWN_BASIS,platformAt} from '../dist/core.mjs';
import {makeSurface,platformPoint,pointFor,textures,orbitalGlobe} from '../dist/planet-world.js';

const results=[];
function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
function near(a,b,epsilon=1e-8){assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);}
const rect={left:10,top:20,width:148,height:148},cx=84,cy=94,r=148*.34;
test('Joystick dead zone, smooth magnitude, clamp and run',()=>{
  const s=new Joystick();assert.equal(s.start(1,cx,cy,rect),true);near(s.x,0);near(s.z,0);
  s.move(1,cx+r*.1,cy);near(s.x,0);
  s.move(1,cx+r*.56,cy);near(s.x,.5);near(s.z,0);assert.equal(s.run,false);
  s.move(1,cx+r*2,cy);near(s.x,1);assert.equal(s.run,true);
  s.move(1,cx+r,cy+r);near(Math.hypot(s.x,s.z),1);
});
test('Joystick pointer ownership, release and reset',()=>{
  const s=new Joystick();s.start(1,cx+r,cy,rect);assert.equal(s.start(2,cx,cy,rect),false);
  s.move(2,cx,cy);near(s.x,1);s.end(2);near(s.x,1);s.end(1);assert.equal(s.id,null);near(s.x,0);assert.equal(s.run,false);
  s.start(3,cx,cy-r,rect);near(s.z,-1);s.reset();near(s.z,0);assert.equal(s.id,null);
});
test('Camera drag, click and drag-return suppression',()=>{
  const g=new CameraGestures();g.down(1,100,100);assert.deepEqual(g.move(1,110,105),{dx:10,dy:5});assert.equal(g.up(1,100,100),false);
  g.down(2,100,100,false);assert.equal(g.move(2,101,100),null);assert.equal(g.up(2,101,100),true);
});
test('Pinch never turns into tap, remaining pointer has no jump',()=>{
  const g=new CameraGestures();g.down(1,100,100);g.down(2,200,100);near(g.move(2,220,100).zoom,100/120);
  assert.equal(g.up(2,220,100),false);assert.deepEqual(g.move(1,102,103),{dx:2,dy:3});assert.equal(g.up(1,102,103),false);
});
test('Pinch bounds, absent pointer and reset',()=>{
  const g=new CameraGestures();g.down(1,0,0);g.down(2,100,0);near(g.move(2,1000,0).zoom,.65);near(g.move(2,1,0).zoom,1.5);
  assert.equal(g.move(3,1,1),null);g.reset();assert.equal(g.points.size,0);assert.equal(g.up(1,0,0),false);
});
class StubElement{
  constructor(key){this.handlers={};this.dataset={key};this.style={};this.tokens=new Set();this.classList={add:t=>this.tokens.add(t),remove:t=>this.tokens.delete(t),toggle:(t,v)=>v?this.tokens.add(t):this.tokens.delete(t)};}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  setPointerCapture(id){this.captured=id;}focus(){}getBoundingClientRect(){return rect;}
  emit(name,args={}){const e={preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},pointerId:1,clientX:cx,clientY:cy,pointerType:'touch',button:0,...args};for(const fn of this.handlers[name]||[])fn(e);return e;}
}
test('Attached controls: move+jump+camera together, cancel and modal reset',()=>{
  globalThis.document=new StubElement();const canvas=new StubElement(),joystick=new StubElement(),knob=new StubElement(),jump=new StubElement('Space'),run=new StubElement('ShiftLeft'),up=new StubElement('KeyR');
  let lookCalls=0,taps=0,manualCalls=0,active=true;
  const input=attachTouchControls({canvas,joystick,knob,buttons:[jump,run,up],active:()=>active,look:()=>lookCalls++,zoom:()=>{},tap:()=>taps++,manual:()=>manualCalls++});
  joystick.emit('pointerdown',{clientX:cx+r});jump.emit('pointerdown',{pointerId:2});canvas.emit('pointerdown',{pointerId:3});canvas.emit('pointermove',{pointerId:3,clientX:cx+25});
  near(input.read().x,1);assert.equal(input.read().jump,true);assert.equal(lookCalls,1);assert.equal(manualCalls,1);
  canvas.emit('pointerup',{pointerId:3,clientX:cx+25});assert.equal(taps,0);near(input.read().x,1);
  jump.emit('pointerdown',{pointerId:4});jump.emit('pointerup',{pointerId:2});assert.equal(input.read().jump,true);jump.emit('pointercancel',{pointerId:4});assert.equal(input.read().jump,false);
  input.reset();assert.deepEqual(input.read(),{x:0,z:0,run:false,jump:false,boost:false,up:0});assert.equal(joystick.tokens.has('engaged'),false);
  active=false;joystick.emit('pointerdown',{clientX:cx+r});near(input.read().x,0);
  assert.equal(document.emit('gesturechange').prevented,true);assert.equal(document.emit('wheel',{ctrlKey:true}).prevented,true);assert.equal(document.emit('touchmove',{touches:[{},{}]}).prevented,true);
});
test('Core retains analogue ground and flight speed',()=>{
  const a=new GameState(),b=new GameState();a.land(4);b.land(4);a.step(.05,{x:1});b.step(.05,{x:.25});near(a.x/b.x,4);
  a.launch();b.launch();const x=a.space.x;a.step(.05,{x:1});b.step(.05,{x:.25});near((a.space.x-x)/(b.space.x-x),4);
});
for(const key of ['mercury','venus','venusClouds','earth','earthClouds','mars','jupiter','saturn','uranus','neptune','rings'])textures[key]=new THREE.Texture();
test('Every gas island orientation and top plane match collision',()=>{
  for(let index=4;index<8;index++){
    const game=new GameState();game.land(index);const s=makeSurface(game);assert.equal(s.deck.children.length,PLATFORMS.length);s.root.updateMatrixWorld(true);
    for(let i=0;i<PLATFORMS.length;i++){
      const p=PLATFORMS[i],pod=s.deck.children[i];for(const [x,z]of[[0,0],[p.w/2,0],[0,p.d/2],[-p.w/2,-p.d/2]]){
        const actual=pod.localToWorld(new THREE.Vector3(x,0,z)),expected=platformPoint(p.x+x,p.z+z);near(actual.distanceTo(expected),0,1e-6);
      }
      const upperFace=pod.children[0].position.y+pod.children[0].geometry.parameters.height/2;near(upperFace,0);
      assert.equal(platformAt(p.x,p.z)?.id,i);
    }
    for(const c of game.crystals){assert.ok(platformAt(c.x,c.z));near(pointFor(game,c).dot(new THREE.Vector3(...SPAWN)),108,1e-6);}
    s.dispose();
  }
});
test('Earth shader patch scope, uniforms, fade and globe separation',()=>{
  const game=new GameState();game.land(2);const s=makeSurface(game),material=s.terrain.material;
  assert.equal(material.bumpMap,null);const shader={vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader,uniforms:{}};material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.earthDetail,material.userData.earthDetail);assert.equal(shader.uniforms.earthTime,material.userData.clock);
  assert.ok(shader.vertexShader.includes('vEarthLocal=position;'));
  assert.ok(shader.fragmentShader.indexOf('float earthWater=')<shader.fragmentShader.indexOf('roughnessFactor=mix'));
  assert.equal((shader.fragmentShader.match(/float earthWater=/g)||[]).length,1);
  assert.ok(shader.fragmentShader.includes('#include <map_fragment>'));assert.ok(shader.fragmentShader.includes('#include <roughnessmap_fragment>'));
  s.update(3,22);near(material.userData.earthDetail.value,1);near(material.userData.clock.value,3);s.update(4,240);near(material.userData.earthDetail.value,0);
  assert.equal(orbitalGlobe(2,4).planet.material.userData.earthDetail,undefined);
  s.dispose();
});
test('Surface disposes InstancedMesh instance buffer resources',()=>{
  const game=new GameState(),s=makeSurface(game);let disposed=0;const meshes=[];s.root.traverse(o=>{if(o.isInstancedMesh){meshes.push(o);o.addEventListener('dispose',()=>disposed++);}});assert.ok(meshes.length);s.dispose();assert.equal(disposed,meshes.length,'InstancedMesh.dispose() is required for instanceMatrix GPU cleanup');
});
console.log(JSON.stringify(results,null,2));const failed=results.filter(r=>!r.pass);console.log(`${results.length-failed.length}/${results.length} tests passed`);if(failed.length)process.exitCode=1;
