// State/UI integration, not a browser or visual-rendering test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as Three from '../dist/vendor/three.module.min.js';
import * as Core from '../dist/core.mjs';
import * as Models from '../dist/models.js';
import * as World from '../dist/planet-world.js';
import * as Input from '../dist/input.mjs';
import * as Challenges from '../dist/challenges.mjs';
const read = file => readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');

function makeDOM(html) {
  const ids=new Map();
  const noop=()=>{};
  function context2D() {
    return new Proxy({
      createRadialGradient:()=>({addColorStop:noop}),
      createLinearGradient:()=>({addColorStop:noop}),
      measureText:text=>({width:String(text).length*8}),
      getImageData:()=>({data:new Uint8ClampedArray(512*256*4)})
    },{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
  }
  class Events {
    constructor(){this.listeners=new Map();}
    addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
    removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(x=>x!==fn));}
    dispatch(type,extra={}){
      const e={type,target:this,currentTarget:this,button:0,pointerId:1,pointerType:'mouse',repeat:false,shiftKey:false,ctrlKey:false,metaKey:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){},...extra};
      for(const fn of [...(this.listeners.get(type)||[])])fn(e);
      this['on'+type]?.(e);return e;
    }
  }
  function matches(el,selector){
    return selector.split(',').some(part=>{
      let q=part.trim();const enabled=q.includes(':not(:disabled)');q=q.replace(':not(:disabled)','');
      if(enabled&&el.disabled)return false;
      if(q.startsWith('#'))return el.id===q.slice(1);
      const cls=q.match(/\.([\w-]+)/);if(cls&&!el.classList.contains(cls[1]))return false;
      const tag=q.match(/^[\w-]+/);if(tag&&el.tagName!==tag[0].toUpperCase())return false;
      for(const attr of q.matchAll(/\[([\w-]+)(?:=['"]?([^'"\]]+)['"]?)?\]/g)){
        if(!el.attributes.has(attr[1]))return false;
        if(attr[2]!==undefined&&el.getAttribute(attr[1])!==attr[2])return false;
      }
      return true;
    });
  }
  class Element extends Events {
    constructor(tag='div'){
      super();this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.attributes=new Map();this.dataset={};this.hidden=false;this.disabled=false;this._text='';
      this.style={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};
      const classes=new Set();this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v),toggle(v,force){const on=force??!classes.has(v);if(on)classes.add(v);else classes.delete(v);return on;},toString:()=>[...classes].join(' ')};
      this.width=1024;this.height=768;this.value='';this.onclick=null;
    }
    set id(value){this._id=value;ids.set(value,this);}
    get id(){return this._id||'';}
    set className(value){this.classList.remove(...this.classList.toString().split(' ').filter(Boolean));this.classList.add(...String(value).split(/\s+/).filter(Boolean));}
    get className(){return this.classList.toString();}
    set textContent(value){this.children=[];this._text=String(value??'');}
    get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
    set innerHTML(value){this.replaceChildren();parse(String(value),this);}
    get innerHTML(){return this.textContent;}
    get firstChild(){return this.children[0]||null;}
    get childNodes(){return this.children;}
    setAttribute(name,value=''){
      this.attributes.set(name,String(value));
      if(name==='id')this.id=String(value);
      if(name==='class')this.className=value;
      if(name==='hidden')this.hidden=true;
      if(name==='disabled')this.disabled=true;
      if(name==='value')this.value=value;
      if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);
    }
    getAttribute(name){return this.attributes.get(name)??null;}
    removeAttribute(name){this.attributes.delete(name);if(name==='hidden')this.hidden=false;if(name==='disabled')this.disabled=false;}
    append(...nodes){for(let node of nodes){if(typeof node==='string'){const t=new Element('#text');t.textContent=node;node=t;}if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);node.parentNode=this;this.children.push(node);}}
    appendChild(node){this.append(node);return node;}
    replaceChildren(...nodes){for(const c of this.children)c.parentNode=null;this.children=[];this._text='';this.append(...nodes);}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}
    querySelectorAll(selector){const out=[];const walk=node=>{for(const c of node.children){if(matches(c,selector))out.push(c);walk(c);}};walk(this);return out;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){for(let n=this;n;n=n.parentNode)if(matches(n,selector))return n;return null;}
    contains(other){for(let n=other;n;n=n.parentNode)if(n===this)return true;return false;}
    focus(){document.activeElement=this;}
    click(){if(!this.disabled)this.dispatch('click');}
    getBoundingClientRect(){const width=this.id==='joystick'?140:this.id==='solar'?700:1024,height=this.id==='joystick'?140:this.id==='solar'?400:768;return{left:0,top:0,right:width,bottom:height,width,height};}
    getContext(type){if(type!=='2d')throw new Error('Only 2D label/map canvas is mocked');return this._ctx??=context2D();}
    setPointerCapture(){}
    releasePointerCapture(){}
    hasPointerCapture(){return false;}
  }
  function parse(markup,parent){
    const stack=[parent],voids=new Set(['AREA','BASE','BR','COL','EMBED','HR','IMG','INPUT','LINK','META','PARAM','SOURCE','TRACK','WBR']);
    for(const token of markup.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/g)||[]){
      if(token.startsWith('<!'))continue;
      if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
      if(token.startsWith('<')){
        const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;
        const el=new Element(tag),attrs=token.slice(tag.length+1,-1);
        for(const match of attrs.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g))el.setAttribute(match[1],match[2]??match[3]??match[4]??'');
        stack.at(-1).append(el);if(!voids.has(el.tagName)&&!token.endsWith('/>'))stack.push(el);
      }else{const node=new Element('#text');node.textContent=token;stack.at(-1).append(node);}
    }
  }
  const document=new Events(),root=new Element('document');
  parse(html,root);
  Object.assign(document,{hidden:false,activeElement:null,fullscreenElement:null,
    getElementById:id=>ids.get(id)||null,
    createElement:tag=>new Element(tag),
    createElementNS:(_,tag)=>new Element(tag),
    querySelectorAll:selector=>root.querySelectorAll(selector),
    querySelector:selector=>root.querySelector(selector)
  });
  document.documentElement=root.querySelector('html')||root;
  document.body=root.querySelector('body')||root;
  document.documentElement.requestFullscreen=async()=>{document.fullscreenElement=document.documentElement;};
  document.exitFullscreen=async()=>{document.fullscreenElement=null;};
  const window=new Events();
  return{document,window,ids};
}

class RendererDouble {
  constructor({canvas}){this.domElement=canvas;this.shadowMap={};this.frames=0;this.capabilities={getMaxAnisotropy:()=>4};}
  setPixelRatio(){}
  setSize(){}
  render(scene,camera){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.frames++;
    if(!camera.position.toArray().every(Number.isFinite))throw new Error('Non-finite camera position');
    if(!camera.quaternion.toArray().every(Number.isFinite))throw new Error('Non-finite camera orientation');
  }
  dispose(){}
}
function makeClock(){
  let now=1000,nextId=0,raf=null;const timers=new Map();
  return {
    performance:{now:()=>now},
    setTimeout(fn,delay=0){const id=++nextId;timers.set(id,{fn,due:now+Math.max(0,delay)});return id;},
    clearTimeout:id=>timers.delete(id),
    requestAnimationFrame(fn){raf=fn;return 1;},
    cancelAnimationFrame(){raf=null;},
    advance(ms=1000/60,{render=true}={}){
      now+=ms;let due;
      for(let i=0;i<100&&(due=[...timers].filter(([,v])=>v.due<=now)).length;i++)for(const[id,item]of due){timers.delete(id);item.fn();}
      if(render&&raf){const fn=raf;raf=null;fn(now);}
    },
    get now(){return now;}
  };
}

async function bootGame(){
  const dom=makeDOM(read('index.html')),clock=makeClock(),errors=[],storage=new Map();
  const previous=new Map(['document','window'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const key of ['document','window'])Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:dom[key]});
  const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
  const THREE={...Three,WebGLRenderer:RendererDouble};
  const matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  Object.assign(dom.window,{document:dom.document,localStorage,innerWidth:1024,innerHeight:768,devicePixelRatio:1,matchMedia,performance:clock.performance});
  const dependencies={
    THREE,...Core,...Models,...World,...Input,...Challenges,
    document:dom.document,window:dom.window,localStorage,
    navigator:{userAgent:'RuntimeIntegration',maxTouchPoints:0},
    innerWidth:1024,innerHeight:768,devicePixelRatio:1,matchMedia,
    performance:clock.performance,
    setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout,
    requestAnimationFrame:clock.requestAnimationFrame,cancelAnimationFrame:clock.cancelAnimationFrame,
    console:{...console,error:(...parts)=>errors.push(parts.map(String).join(' '))},
    loadTextures:async progress=>{
      for(const key of ['mercury','venus','venusClouds','earth','earthClouds','mars','jupiter','saturn','uranus','neptune','rings']){
        World.textures[key]=new Three.Texture({width:2,height:2});
      }
      progress?.(11,11);
    }
  };
  const body=read('game.js').replace(/^import[^;]*;\s*/gm,'');
  const exported=';return {get game(){return game},sprint,get supplies(){return supplies},get explorationGame(){return explorationGame},get modal(){return modal},get ready(){return ready},get started(){return started},get renderer(){return renderer},camera,startSprint,finishSprint,returnToExploration,openQuiz,closeQuiz,frame,syncWorld,openModal,closeModal,stationUI,pauseOnBlur,updateCamera,setZoom};';
  const api=new Function(...Object.keys(dependencies),body+exported)(...Object.values(dependencies));
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.deepEqual(errors,[],'game initialization errors');
  assert.equal(api.ready,true);
  assert.equal(dom.ids.get('startBtn').disabled,false);
  dom.ids.get('startBtn').click();clock.advance();
  assert.equal(api.started,true);assert.equal(api.modal,null);
  return{
    ...dom,clock,api,errors,storage,
    el:id=>{const el=dom.ids.get(id);assert.ok(el,'missing HTML element '+id);return el;},
    click(id){this.el(id).click();},
    dispose(){
      for(const[key,descriptor]of previous){
        if(descriptor)Object.defineProperty(globalThis,key,descriptor);
        else delete globalThis[key];
      }
    }
  };
}

const resourceState = game => ({
  energy:game.energy,roverFuel:game.roverFuel,rocketFuel:game.rocketFuel,
  credits:game.credits,cargo:game.cargo,capacity:game.capacity,magnet:game.magnet
});
const locationState = game => ({n:[...game.n],x:game.x,z:game.z,alt:game.alt});

test('real game state and UI integration (renderer double)', async t => {
  const r=await bootGame(),a=r.api;
  let exploration,explorationQuiz,explorationSnapshot,oldAnswerHandler;
  try {
    await t.test('10 FPS and 60 FPS receive equal movement and sprint time',()=>{
      const distances=[];
      for(const fps of[10,60]){
        a.startSprint();const origin=[...a.game.n];
        r.window.dispatch('keydown',{code:'KeyW'});
        r.window.dispatch('keydown',{code:'ShiftRight'});
        for(let i=0;i<fps*2;i++)r.clock.advance(1000/fps);
        distances.push(Core.arc(origin,a.game.n));
        assert.ok(Math.abs(a.sprint.remaining-298)<1e-7,'Clock differs from simulated play time');
        r.click('helpBtn');assert.equal(r.el('endSprint').hidden,false);
        r.click('endSprint');assert.equal(a.modal,'sprintResults');
        r.click('returnExplore');assert.equal(a.modal,null);
      }
      assert.ok(distances[0]>18&&distances[1]>18,'Slow display lost movement time');
      assert.ok(Math.abs(distances[0]-distances[1])<.2,'Frame rate changes race distance');
    });

    await t.test('camera remains finite across pole/ground/globe transitions',()=>{
      const original=[...a.game.n];
      for(const normal of [Core.SPAWN,[0,-1,0],Core.norm([1e-8,-1,1e-8]),[0,1,0]]){
        a.game.n=[...normal];
        for(const distance of [18,70,102.5,160,240]){
          a.setZoom(distance);a.updateCamera(.1,true);
          assert.ok(a.camera.position.toArray().every(Number.isFinite));
          assert.ok(a.camera.quaternion.toArray().every(Number.isFinite));
          assert.ok(Math.abs(a.camera.quaternion.length()-1)<1e-6);
          assert.ok(a.camera.up.lengthSq()>.9,'camera up collapsed near south pole');
        }
      }
      a.game.n=original;a.setZoom(18);a.updateCamera(.1,true);
    });

    await t.test('UI starts an equal fresh sprint and preserves exploration objects',()=>{
      exploration=a.game;explorationQuiz=a.supplies;
      exploration.cargo=7;exploration.cargoColors[3]=7;exploration.credits=6;
      exploration.capacity=45;exploration.bagLevel=1;exploration.magnet=true;
      exploration.energy=42;exploration.world.collected.add(9);
      explorationSnapshot=resourceState(exploration);
      r.click('sprintBtn');assert.equal(a.modal,'sprintIntro');
      r.click('beginSprint');
      assert.equal(a.modal,null);assert.equal(a.sprint.active,true);
      assert.notEqual(a.game,exploration);assert.notEqual(a.supplies,explorationQuiz);
      assert.equal(a.game.planet,3);assert.equal(a.game.cargo,0);
      assert.equal(a.game.capacity,30);assert.equal(a.game.magnet,false);
      assert.equal(a.sprint.score,0);
      assert.deepEqual(resourceState(exploration),explorationSnapshot);
      assert.equal(exploration.world.collected.has(9),true);
    });

    await t.test('actual delivery button scores once; retry resets game and questions',()=>{
      const originalRound=a.game;
      const deposits=a.game.crystals.map(c=>({n:c.n,x:c.x,z:c.z,value:c.value}));
      a.game.mode='docked';a.game.cargo=4;a.game.cargoColors=[0,0,0,4,0,0,0,0];
      a.syncWorld();a.openModal('stationModal');a.stationUI();
      r.click('depositBtn');
      assert.equal(a.game.cargo,0);assert.equal(a.sprint.score,60);
      r.click('depositBtn');assert.equal(a.sprint.score,60);
      a.finishSprint();assert.equal(a.modal,'sprintResults');
      assert.equal(r.el('resultScore').textContent,'60');
      r.click('retrySprint');
      assert.equal(a.modal,null);assert.equal(a.sprint.active,true);
      assert.notEqual(a.game,originalRound);
      assert.equal(a.sprint.score,0);assert.equal(a.game.credits,0);
      assert.equal(a.supplies.attempts,0);
      assert.deepEqual(a.game.crystals.map(c=>({n:c.n,x:c.x,z:c.z,value:c.value})),deposits);
      assert.deepEqual(resourceState(exploration),explorationSnapshot);
    });

    await t.test('quiz close/reopen keeps the card, pauses countdown and clears held input',()=>{
      r.window.dispatch('keydown',{code:'KeyW'});
      r.click('quizBtn');assert.equal(a.modal,'quizModal');
      const card=a.supplies.pending;
      assert.ok(card);assert.equal(r.el('quizQuestion').textContent,card.question.question);
      const remaining=a.sprint.remaining,location=locationState(a.game);
      r.clock.advance(90_000);
      assert.equal(a.sprint.remaining,remaining);assert.deepEqual(locationState(a.game),location);
      r.click('quizClose');assert.equal(a.modal,null);
      r.clock.advance(50);
      assert.deepEqual(locationState(a.game),location,'held key leaked out of quiz');
      r.click('quizBtn');assert.equal(a.supplies.pending,card);
      assert.equal(a.supplies.pending.token,card.token);
    });

    await t.test('rendered answers award resources once and ignore stale callbacks',()=>{
      const card=a.supplies.pending,buttons=r.el('quizAnswers').querySelectorAll('button');
      assert.equal(buttons.length,card.question.options.length);
      assert.deepEqual(buttons.map(b=>b.textContent),card.question.options);
      a.game.energy=20;a.game.roverFuel=25;a.game.rocketFuel=30;
      const before=resourceState(a.game);
      oldAnswerHandler=buttons[card.question.correct].onclick;
      buttons[card.question.correct].click();
      assert.equal(card.answered,true);assert.equal(card.result.correct,true);
      assert.equal(a.game.energy,45);assert.equal(a.game.roverFuel,50);
      assert.equal(a.game.rocketFuel,55);assert.equal(a.game.credits,before.credits+5);
      const after=resourceState(a.game);
      oldAnswerHandler({});buttons[card.question.correct].click();
      assert.deepEqual(resourceState(a.game),after,'answer reward repeated');
      assert.ok(r.el('quizAnswers').querySelectorAll('button').every(b=>b.disabled));
      assert.equal(r.el('quizFeedback').hidden,false);
      r.click('quizDone');assert.equal(a.modal,null);
      oldAnswerHandler({});
      assert.deepEqual(resourceState(a.game),after,'closed quiz callback changed state');
    });

    await t.test('deadline ends before another movement step and locks quiz entry',()=>{
      r.window.dispatch('keydown',{code:'KeyW'});
      const location=locationState(a.game),score=a.sprint.score;
      a.sprint.remaining=.01;
      r.clock.advance(50);
      assert.equal(a.modal,'sprintResults');assert.equal(a.sprint.active,false);
      assert.equal(a.sprint.remaining,0);
      assert.deepEqual(locationState(a.game),location,'physics ran after deadline');
      assert.equal(a.sprint.score,score);
      r.click('quizBtn');assert.equal(a.modal,'sprintResults');
      a.finishSprint();assert.equal(a.sprint.score,score);
      r.click('returnExplore');
      assert.equal(a.game,exploration);assert.equal(a.supplies,explorationQuiz);
      assert.equal(a.explorationGame,null);assert.equal(a.modal,null);
      assert.deepEqual(resourceState(a.game),explorationSnapshot);
      oldAnswerHandler({});
      assert.deepEqual(resourceState(a.game),explorationSnapshot,'old sprint answer rewarded exploration');
    });

    await t.test('station quiz returns to docking screen; sprint restores docked expedition',()=>{
      a.game.mode='docked';a.syncWorld();a.openModal('stationModal');a.stationUI();
      r.click('refuelBtn');assert.equal(a.modal,'quizModal');
      const pending=a.supplies.pending;
      r.click('quizClose');assert.equal(a.modal,'stationModal');
      assert.equal(r.el('stationModal').hidden,false);
      assert.equal(a.game.mode,'docked');assert.equal(a.supplies.pending,pending);
      a.startSprint();assert.equal(a.game.mode,'foot');assert.equal(a.modal,null);
      a.finishSprint();r.click('returnExplore');
      assert.equal(a.game,exploration);assert.equal(a.game.mode,'docked');
      assert.equal(a.modal,'stationModal');assert.equal(r.el('stationModal').hidden,false);
      assert.equal(a.supplies.pending,pending);
    });

    await t.test('blur/resume excludes suspended-tab time even without paused RAF frames',()=>{
      a.startSprint();
      r.clock.advance(20);const remaining=a.sprint.remaining;
      a.pauseOnBlur();assert.equal(a.modal,'pause');
      r.clock.advance(1_000_000,{render:false});
      a.closeModal();assert.equal(a.modal,null);
      r.clock.advance(20);
      assert.equal(a.sprint.active,true,'suspended time expired the resumed sprint');
      assert.ok(Math.abs(a.sprint.remaining-(remaining-.02))<1e-8);
      a.finishSprint();r.click('returnExplore');
    });

    assert.deepEqual(r.errors,[],'runtime console errors');
    assert.ok(a.renderer.frames>0,'actual frame callback did not execute');
  } finally {r.dispose();}
});
