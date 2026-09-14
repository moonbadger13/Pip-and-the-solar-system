const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class Joystick {
  constructor(){this.reset();}
  reset(){this.id=null;this.x=0;this.z=0;this.run=false;}
  start(id,x,y,rect){if(this.id!==null)return false;this.id=id;this.rect=rect;this.move(id,x,y);return true;}
  move(id,x,y){
    if(id!==this.id)return;
    const r=this.rect.width*.34,dx=(x-this.rect.left-this.rect.width/2)/r,dz=(y-this.rect.top-this.rect.height/2)/r,m=Math.hypot(dx,dz);
    const strength=clamp((m-.12)/.88,0,1);this.x=m?dx/m*strength:0;this.z=m?dz/m*strength:0;this.run=m>.93;
  }
  end(id){if(id===this.id)this.reset();}
}
export class CameraGestures {
  constructor(){this.points=new Map();}
  reset(){this.points.clear();}
  down(id,x,y,rotate=true){
    this.points.set(id,{x,y,startX:x,startY:y,rotate,tap:true});
    if(this.points.size>1)for(const p of this.points.values())p.tap=false;
  }
  move(id,x,y){
    const p=this.points.get(id);if(!p)return null;
    const before=[...this.points.values()],oldDistance=before.length===2?Math.hypot(before[0].x-before[1].x,before[0].y-before[1].y):0;
    const dx=x-p.x,dy=y-p.y;p.x=x;p.y=y;if(Math.hypot(x-p.startX,y-p.startY)>7)p.tap=false;
    if(this.points.size===2){const a=[...this.points.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);return{zoom:clamp(oldDistance/Math.max(10,distance),.65,1.5)};}
    return p.rotate?{dx,dy}:null;
  }
  up(id,x,y){const p=this.points.get(id);this.points.delete(id);return!!p&&p.tap&&Math.hypot(x-p.startX,y-p.startY)<=7;}
}

export function attachTouchControls({canvas,joystick,knob,buttons,active,look,zoom,tap,manual}){
  const stick=new Joystick(),gestures=new CameraGestures(),pressed=new Map();
  const draw=()=>{knob.style.transform=`translate(${stick.x*42}px,${stick.z*42}px)`;joystick.classList.toggle('engaged',stick.id!==null);joystick.classList.toggle('running',stick.run);};
  const stop=e=>{e.preventDefault();e.stopPropagation();};
  joystick.addEventListener('pointerdown',e=>{stop(e);if(!active())return;if(stick.start(e.pointerId,e.clientX,e.clientY,joystick.getBoundingClientRect())){joystick.setPointerCapture(e.pointerId);manual();draw();}});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id)return;stop(e);stick.move(e.pointerId,e.clientX,e.clientY);draw();});
  for(const name of['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(name,e=>{stick.end(e.pointerId);draw();});
  for(const button of buttons){
    button.addEventListener('pointerdown',e=>{stop(e);if(!active())return;pressed.set(e.pointerId,button.dataset.key);button.setPointerCapture(e.pointerId);button.classList.add('held');});
    for(const name of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>{pressed.delete(e.pointerId);if(![...pressed.values()].includes(button.dataset.key))button.classList.remove('held');});
  }
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    if(!active()||e.button===1)return;e.preventDefault();canvas.focus({preventScroll:true});
    gestures.down(e.pointerId,e.clientX,e.clientY,e.pointerType!=='mouse'||e.button===2);canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{if(!active())return;const change=gestures.move(e.pointerId,e.clientX,e.clientY);if(change?.zoom)zoom(change.zoom);else if(change)look(change.dx,change.dy);});
  canvas.addEventListener('pointerup',e=>{const clicked=gestures.up(e.pointerId,e.clientX,e.clientY);if(active()&&e.button===0&&clicked)tap(e.clientX,e.clientY);});
  for(const name of['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{gestures.points.delete(e.pointerId);});
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(active())zoom(Math.exp(clamp(e.deltaY,-300,300)*.0012));},{passive:false});
  // Safari's native page gesture must not compete with the game's pinch.
  for(const name of['gesturestart','gesturechange','gestureend'])document.addEventListener(name,e=>e.preventDefault(),{passive:false});
  document.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey)e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
  return{
    read(){const values=[...pressed.values()];return{x:stick.x,z:stick.z,run:stick.run||values.includes('ShiftLeft'),jump:values.includes('Space'),boost:values.includes('Space'),up:(values.includes('KeyR')?1:0)-(values.includes('KeyF')?1:0)};},
    reset(){stick.reset();gestures.reset();pressed.clear();buttons.forEach(b=>b.classList.remove('held'));draw();}
  };
}
