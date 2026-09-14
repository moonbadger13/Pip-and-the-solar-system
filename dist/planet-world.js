import * as THREE from './vendor/three.module.min.js';
import {PLANETS,RADIUS,SPAWN,SPAWN_BASIS,heightFor,seedRandom,advance,basis,PLATFORMS} from './core.mjs?v=2.1.0';
import {mat,mesh,box,sphere,cylinder,white,dark,silver,orange,glow} from './models.js?v=2.1.0';
export const textures={};let earthPixels=null;
const textureFiles={mercury:'2k_mercury.jpg',venus:'2k_venus_surface.jpg',venusClouds:'2k_venus_atmosphere.jpg',earth:'2k_earth_daymap.jpg',earthClouds:'2k_earth_clouds.jpg',mars:'2k_mars.jpg',jupiter:'2k_jupiter.jpg',saturn:'2k_saturn.jpg',uranus:'2k_uranus.jpg',neptune:'2k_neptune.jpg',rings:'2k_saturn_ring_alpha.png'};
export async function loadTextures(onProgress){let completed=0;const loader=new THREE.TextureLoader();await Promise.all(Object.entries(textureFiles).map(async([key,file])=>{const t=await loader.loadAsync('./assets/planets/'+file);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures[key]=t;onProgress?.(++completed,Object.keys(textureFiles).length);}));textures.earth.wrapS=THREE.RepeatWrapping;textures.earth.offset.x=.30;textures.earthClouds.wrapS=THREE.RepeatWrapping;textures.earthClouds.offset.x=.30;try{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(textures.earth.image,0,0,512,256);earthPixels=x.getImageData(0,0,512,256).data;}catch{}}
export function isWater(n){if(!earthPixels)return false;let u=((Math.atan2(n[2],-n[0])/(2*Math.PI)+.30)%1+1)%1,v=Math.acos(THREE.MathUtils.clamp(n[1],-1,1))/Math.PI;const i=(Math.min(255,Math.floor(v*256))*512+Math.min(511,Math.floor(u*512)))*4,r=earthPixels[i],g=earthPixels[i+1],b=earthPixels[i+2];return b>r*1.22&&b>g*1.1;}
export const V=a=>new THREE.Vector3(...a);
export function groundPoint(index,n,alt=0){return V(n).multiplyScalar(RADIUS+heightFor(index,n)+alt);}
export function orient(object,n,heading=null){const up=V(n),forward=heading?V(heading).addScaledVector(up,-V(heading).dot(up)).normalize():V(basis(n).back);if(forward.lengthSq()<.1)forward.copy(V(basis(n).back));const right=new THREE.Vector3().crossVectors(up,forward).normalize();forward.crossVectors(right,up).normalize();object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,forward));}
export function platformPoint(x,z,y=0){return V(SPAWN).multiplyScalar(RADIUS+12+y).addScaledVector(V(SPAWN_BASIS.right),x).addScaledVector(V(SPAWN_BASIS.back),z);}
export function pointFor(game,obj=game,alt=0){return game.solid?groundPoint(game.planet,obj.n,(obj.alt||0)+alt):platformPoint(obj.x,obj.z,(obj.alt||0)+alt);}
function globeMaterial(index,closeDetail=false){
  const p=PLANETS[index],m=mat(0xffffff,.92,.02,{map:textures[p.key],bumpMap:index===2?null:textures[p.key],bumpScale:p.solid?.38:0});
  if(index===2&&closeDetail){
    const detail={value:1},clock={value:0};m.userData.earthDetail=detail;m.userData.clock=clock;
    m.onBeforeCompile=s=>{
      s.uniforms.earthDetail=detail;s.uniforms.earthTime=clock;
      s.vertexShader='varying vec3 vEarthLocal;\n'+s.vertexShader;
      s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthLocal=position;');
      s.fragmentShader=`varying vec3 vEarthLocal;
        uniform float earthDetail;uniform float earthTime;
        float earthHash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        float earthNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(earthHash(i),earthHash(i+vec3(1,0,0)),f.x),mix(earthHash(i+vec3(0,1,0)),earthHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(earthHash(i+vec3(0,0,1)),earthHash(i+vec3(1,0,1)),f.x),mix(earthHash(i+vec3(0,1,1)),earthHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        `+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float earthWater=smoothstep(.02,.09,diffuseColor.b-max(diffuseColor.r*1.15,diffuseColor.g*1.08));
        float grain=earthNoise(vEarthLocal*3.4)*.6+earthNoise(vEarthLocal*13.)*.28+earthNoise(vEarthLocal*39.)*.12;
        float rockDetail=mix(.78,1.20,grain);
        float wave=sin(vEarthLocal.x*8.+vEarthLocal.z*6.+earthTime*.55)*sin(vEarthLocal.y*9.-vEarthLocal.z*3.-earthTime*.35);
        vec3 land=diffuseColor.rgb*rockDetail;
        vec3 sea=diffuseColor.rgb*(.96+wave*.055)+vec3(.005,.015,.022);
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(land,sea,earthWater),earthDetail);
      `);
      s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,mix(.94,.24,earthWater),earthDetail);
      `);
    };
    m.customProgramCacheKey=()=> 'earth-ground-detail-v1';
  }
  if(index===7){m.color.setHex(0xc2e3dc);m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.43,0.69,0.72), 0.58);');};}
  if(index===6)m.color.setHex(0xc2ece4);return m;
}
export function atmosphere(index,radius){const p=PLANETS[index];if(!p.atmos)return null;return new THREE.Mesh(new THREE.SphereGeometry(radius*(1+p.atmos),72,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms:{tint:{value:new THREE.Color(p.atmosColor)},intensity:{value:index===3?.48:index===2?.8:.85}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 wp=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-wp.xyz);gl_Position=projectionMatrix*wp;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 tint;uniform float intensity;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),2.7);gl_FragColor=vec4(tint,rim*intensity);}' }));}
function addRings(group,index,radius){if(index!==5&&index!==6)return null;const geo=new THREE.RingGeometry(radius*1.30,radius*2.04,128,3);const pos=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){const rr=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(rr-radius*1.30)/(radius*.74),.5);}const ring=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:textures.rings,side:THREE.DoubleSide,transparent:true,opacity:index===6?.26:.87,roughness:.9,depthWrite:false,color:index===6?0x667d83:0xffead0}));ring.rotation.x=index===6?.12:Math.PI/2-.47;group.add(ring);return ring;}
function cloudShell(index,radius){if(index!==1&&index!==2)return null;const tex=index===1?textures.venusClouds:textures.earthClouds;const material=new THREE.MeshStandardMaterial({map:tex,alphaMap:index===2?tex:null,transparent:true,opacity:index===1?.94:.62,depthWrite:false,roughness:1,color:0xffffff});const cloud=new THREE.Mesh(new THREE.SphereGeometry(radius*(index===1?1.045:1.018),96,64),material);return cloud;}
export function orbitalGlobe(index,radius){const group=new THREE.Group(),planet=new THREE.Mesh(new THREE.SphereGeometry(radius,64,48),globeMaterial(index));group.add(planet);let cloud=cloudShell(index,radius);if(cloud)group.add(cloud);const air=atmosphere(index,radius);if(air)group.add(air);addRings(group,index,radius);return{group,planet,cloud};}
export function makeSurface(game){const index=game.planet,p=game.info,root=new THREE.Group(),terrainGeo=new THREE.SphereGeometry(RADIUS,192,128);if(p.solid){const attr=terrainGeo.attributes.position;for(let i=0;i<attr.count;i++){const n=new THREE.Vector3().fromBufferAttribute(attr,i).normalize(),height=heightFor(index,n.toArray());attr.setXYZ(i,n.x*(RADIUS+height),n.y*(RADIUS+height),n.z*(RADIUS+height));}terrainGeo.computeVertexNormals();}
const terrain=new THREE.Mesh(terrainGeo,globeMaterial(index,true));terrain.receiveShadow=true;root.add(terrain);const air=atmosphere(index,RADIUS);if(air)root.add(air);const cloud=cloudShell(index,RADIUS);if(cloud)root.add(cloud);const ring=addRings(root,index,RADIUS);const detail=new THREE.Group();root.add(detail);let deck=null;
if(!p.solid){
  deck=new THREE.Group();root.add(deck);
  const deckMat=mat(0x354e63,.62,.28),floorMat=mat(0x6a818c,.78,.12),accent=mat(p.crystal,.3,.3,{emissive:p.crystal,emissiveIntensity:.55});
  const railMat=mat(0x9fb5bc,.55,.25),engineMat=mat(p.crystal,.2,.3,{emissive:p.crystal,emissiveIntensity:1.1});
  for(const platform of PLATFORMS){
    const {x,z,w,d,id,links}=platform,pod=new THREE.Group();pod.position.copy(platformPoint(x,z));orient(pod,SPAWN,SPAWN_BASIS.back);deck.add(pod);
    // The top face is exactly y=0, matching the walk and jump collision plane.
    box(pod,deckMat,w,.9,d,0,-.45,0);box(pod,floorMat,w-.4,.025,d-.4,0,-.013,0);
    for(let a=-w/2+4;a<w/2;a+=4)box(pod,dark,.055,.018,d-.8,a,.008,0);
    for(let a=-d/2+4;a<d/2;a+=4)box(pod,dark,w-.8,.018,.055,0,.009,a);
    for(const side of[-1,1]){
      box(pod,accent,.18,.08,d-.6,side*(w/2-.3),.07,0);box(pod,accent,w-.6,.08,.18,0,.07,side*(d/2-.3));
      // Corner rails leave the middle open as a clear launch/landing lane.
      for(const corner of[-1,1]){
        box(pod,railMat,.12,.12,(d-8)/2,side*(w/2-.4),1.2,corner*(d+8)/4);
        box(pod,railMat,(w-8)/2,.12,.12,corner*(w+8)/4,1.2,side*(d/2-.4));
        cylinder(pod,railMat,.1,.1,1.3,side*(w/2-.4),.6,corner*(d/2-.4));
      }
    }
    cylinder(pod,dark,id===0?7:3.3,id===0?6:2.5,1.8,0,-1.6,0);
    cylinder(pod,engineMat,id===0?4:1.9,id===0?2.8:1,1.6,0,-3.2,0);
    for(const linked of links){const next=PLATFORMS[linked],dx=Math.sign(next.x-x),dz=Math.sign(next.z-z);
      // Small strips point to the next island without drawing a false bridge.
      for(let n=0;n<3;n++)box(pod,accent,dx?1:4,.035,dz?1:4,dx*(w/2-2.5-n*1.6),.06,dz*(d/2-2.5-n*1.6));
    }
  }
}
const rng=seedRandom(index*125+626),rocks=[];
if(p.solid){
  const rg=new THREE.DodecahedronGeometry(1,1),rm=mat(index===0?0x868280:index===1?0x85755c:index===2?0x83908a:0xa65739,.94);
  const rocksMesh=new THREE.InstancedMesh(rg,rm,150),dummy=new THREE.Object3D();let count=0;
  for(let i=0;i<150;i++){
    const n=new THREE.Vector3(rng()-.5,rng()-.5,rng()-.5).normalize();
    if(index===2&&isWater(n.toArray()))continue;
    if(game.crystals.some(c=>V(c.n).distanceTo(n)*RADIUS<3.7))continue;
    const size=.3+rng()*1.4;dummy.position.copy(groundPoint(index,n.toArray(),size*.16));orient(dummy,n.toArray());dummy.scale.set(size,size*.6,size*.9);dummy.rotateY(rng()*6.28);dummy.updateMatrix();rocksMesh.setMatrixAt(count++,dummy.matrix);
  }
  rocksMesh.count=count;rocksMesh.receiveShadow=true;rocksMesh.castShadow=false;rocksMesh.computeBoundingSphere();detail.add(rocksMesh);rocks.push(rocksMesh);
}
const crystals=[],cm=new THREE.MeshPhysicalMaterial({color:p.crystal,emissive:p.crystal,emissiveIntensity:.46,metalness:.22,roughness:.13,clearcoat:1,clearcoatRoughness:.08}),cg=new THREE.CylinderGeometry(0,.4,1.8,5);
const crystalMesh=new THREE.InstancedMesh(cg,cm,game.crystals.length*3),hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);crystalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);detail.add(crystalMesh);
for(const c of game.crystals){
  const g=new THREE.Object3D();g.position.copy(pointFor(game,c));orient(g,p.solid?c.n:SPAWN,p.solid?null:SPAWN_BASIS.back);if(c.value>1)g.scale.setScalar(1.3);g.updateMatrix();
  const matrices=[];
  for(let j=0;j<3;j++){const shard=new THREE.Object3D();shard.position.set((j-1)*.43,1+(j===1?.4:0),j===1?0:.2);shard.scale.y=j===1?1.45:1;shard.rotation.z=(j-1)*-.27;shard.updateMatrix();matrices.push(new THREE.Matrix4().multiplyMatrices(g.matrix,shard.matrix));}
  let visible=true;
  const record={get visible(){return visible;},set visible(value){visible=value;matrices.forEach((matrix,j)=>crystalMesh.setMatrixAt(c.id*3+j,value?matrix:hiddenMatrix));crystalMesh.instanceMatrix.needsUpdate=true;}};
  record.visible=!game.collected.has(c.id);crystals.push(record);
}
// Keep all possible crystals in the bounds even while deposits are hidden.
crystalMesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(),RADIUS+90);
const pad=new THREE.Group();pad.position.copy(pointFor(game,game.rocket,-.1));orient(pad,p.solid?game.rocket.n:SPAWN,p.solid?null:SPAWN_BASIS.back);cylinder(pad,mat(0x657e89,.6,.4),6.5,6.7,.25,0,0,0,48);for(let i=0;i<12;i++){const a=i*Math.PI/6;sphere(pad,glow,.13,6*Math.cos(a),.2,6*Math.sin(a));}detail.add(pad);
return{root,terrain,detail,deck,air,cloud,ring,crystals,rocks,index,update(time,distance){if(terrain.material.userData.earthDetail){terrain.material.userData.earthDetail.value=1-THREE.MathUtils.smoothstep(distance,38,105);terrain.material.userData.clock.value=time;}},dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(![white,dark,silver,orange,glow].includes(m))materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};}
