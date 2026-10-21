import * as THREE from './vendor/three.module.js';
import { sliceProfile, scoreProfile } from './geometry.mjs';
import { TurntableSound } from './sound.mjs';

const stage = document.querySelector('#stage'), status = document.querySelector('#status');
const colors = [0xd85363, 0x178a91, 0xb88617];
const heights = [.26, .51, .77];
const names = ['低处 · 木音', '中间 · 琴音', '高处 · 铃音'];
let profiles = [], scores = [], geometry, specimen, kind = 'vase', step = -1;
let radius = 1, minY = .2, spanY = 1.5;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#dceaf5');
const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
camera.position.set(5, 4.2, 6.2); camera.lookAt(.15, .45, 0);
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
catch(error) {
  stage.innerHTML='<p style="padding:220px 20px 20px;max-width:400px;margin:auto">唱片机需要 WebGL 2。请在支持三维图形的浏览器中打开，或开启浏览器的硬件加速。</p>';
  status.textContent='当前浏览器的三维图形暂不可用。';
  document.querySelector('#play').disabled=true;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor('#dceaf5'); stage.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x7396ad, 2.7));
const light = new THREE.DirectionalLight(0xfff8e4, 3.3);light.position.set(-3, 7, 5);scene.add(light);
const fill = new THREE.DirectionalLight(0xffffff, 1.2);fill.position.set(4, 2, -3);scene.add(fill);
const material = (color, roughness = .5) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .08 });
const deck = new THREE.Mesh(new THREE.BoxGeometry(3.15, .32, 2.8), material(0x8daec5));
deck.position.set(.22, -.28, 0);scene.add(deck);
const lower = new THREE.Mesh(new THREE.BoxGeometry(3.02, .12, 2.66), material(0x526f92));
lower.position.set(.22, -.49, 0);scene.add(lower);
for (const x of [-.94, 1.38]) for (const z of [-.96, .96]) {
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.15,.13,.15,20),material(0x304361));
  foot.position.set(x,-.61,z);scene.add(foot);
}
const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.36,1.36,.15,96), material(0x293853));
platter.position.y = -.02;scene.add(platter);
for (const r of [1.12,1.20,1.28]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r,.004,4,96),material(0x66809a));
  ring.rotation.x = Math.PI/2;ring.position.y=.06;scene.add(ring);
}
const center = new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.03,24),material(0xf6db41));
center.position.y=.08;scene.add(center);
// A soft static shadow keeps the physical toy grounded without a shadow-map pass.
const shadowCanvas = document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
const paint=shadowCanvas.getContext('2d'), gradient=paint.createRadialGradient(64,64,2,64,64,63);
gradient.addColorStop(0,'rgba(36,52,78,.3)');gradient.addColorStop(1,'rgba(36,52,78,0)');
paint.fillStyle=gradient;paint.fillRect(0,0,128,128);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5.4,4.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.set(.2,-.7,0);scene.add(shadow);

const rotor = new THREE.Group();scene.add(rotor);
const needles = colors.map((color,i)=>{
  const anchor=new THREE.Vector3(1.70,1.55,-.50+i*.50);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,1.75,10),material(0x718ba4));
  post.position.set(anchor.x,.63,anchor.z);scene.add(post);
  const grip=new THREE.Mesh(new THREE.SphereGeometry(.085,14,10),material(color));scene.add(grip);grip.userData.track=i;
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,1,12),material(color));scene.add(arm);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.043,12,8),material(color));scene.add(tip);
  return {anchor,grip,arm,tip,color,hit:0};
});

function surface(nu,nv,point) {
  const positions=[],indices=[];
  for(let u=0;u<=nu;u++)for(let v=0;v<=nv;v++)positions.push(...point(u/nu,v/nv));
  for(let u=0;u<nu;u++)for(let v=0;v<nv;v++){
    const a=u*(nv+1)+v,b=a+nv+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function fixture(type) {
  if(type==='vase')return surface(96,32,(u,v)=>{
    const a=u*Math.PI*2,r=.61+.12*Math.cos(v*6.28)+(.12+.16*v)*Math.cos(a*3+v*5)+.04*Math.sin(a*7-v*8);
    return [r*Math.cos(a),v*1.65,r*Math.sin(a)];
  });
  if(type==='moon')return surface(96,24,(u,v)=>{
    const a=(u-.5)*Math.PI*1.65,b=v*Math.PI*2,t=.04+.28*Math.sin(u*Math.PI);
    return [(.82+t*Math.cos(b))*Math.cos(a),t*Math.sin(b)+.12*Math.cos(a*2),(.82+t*Math.cos(b))*Math.sin(a)];
  });
  return surface(112,20,(u,v)=>{
    const a=u*Math.PI*4.8,b=v*Math.PI*2,r=.22+.60*u,t=.10+.05*u;
    return [(r+t*Math.cos(b))*Math.cos(a),u*1.42+t*Math.sin(b),(r+t*Math.cos(b))*Math.sin(a)];
  });
}
function updateTrack(i) {
  const y=minY+heights[i]*spanY;
  profiles[i]=sliceProfile(geometry.attributes.position.array,geometry.index.array,y);
  scores[i]=scoreProfile(profiles[i],radius,i);
  const root=document.querySelector(`#track${i}`);
  root.querySelector('input').value=Math.round(heights[i]*100);
  root.querySelector('output').value=`${Math.round(heights[i]*100)}% 高度`;
  root.querySelector('.notes').innerHTML=scores[i].map((n,s)=>`<i class="note ${n?'on':''} ${step===s?'current':''}" style="--pitch:${n?(n.midi%12)+1:0}"></i>`).join('');
}
function choose(next) {
  kind=next;
  if(specimen){rotor.remove(specimen);geometry.dispose();specimen.material.dispose();}
  geometry=fixture(kind);geometry.computeBoundingBox();
  const box=geometry.boundingBox,size=new THREE.Vector3();box.getSize(size);
  const scale=1.98/Math.max(size.x,size.z);geometry.scale(scale,scale,scale);
  geometry.computeBoundingBox();const bounds=geometry.boundingBox;
  geometry.translate(-(bounds.min.x+bounds.max.x)/2,.14-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  geometry.computeBoundingBox();minY=geometry.boundingBox.min.y;spanY=geometry.boundingBox.max.y-minY;
  radius=0;const ps=geometry.attributes.position.array;
  for(let i=0;i<ps.length;i+=3)radius=Math.max(radius,Math.hypot(ps[i],ps[i+2]));
  specimen=new THREE.Mesh(geometry,material({vase:0xdd7580,moon:0xf3c847,shell:0x41adb1}[kind]));
  specimen.material.side=THREE.DoubleSide;rotor.add(specimen);
  for(let i=0;i<3;i++)updateTrack(i);
  document.querySelectorAll('[data-kind]').forEach(el=>{const selected=el.dataset.kind===kind;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',selected);});
  document.querySelector('#objectName').textContent={vase:'浪纹花瓶',moon:'弯月',shell:'盘旋管'}[kind];
  status.textContent='这次，轮廓写好了另一首。';
}
document.querySelector('#tracks').innerHTML=colors.map((c,i)=>`<div class="track" id="track${i}" style="--ink:#${c.toString(16).padStart(6,'0')}"><div class="track-head"><label for="height${i}">${names[i]}</label><output></output></div><input id="height${i}" aria-label="${names[i]}唱针高度" type="range" min="5" max="95" value="${heights[i]*100}"><div class="notes" aria-hidden="true"></div></div>`).join('');
heights.forEach((_,i)=>document.querySelector(`#height${i}`).addEventListener('input',event=>{heights[i]=Number(event.target.value)/100;updateTrack(i);status.textContent='听，这一层长得不一样。';}));
document.querySelectorAll('[data-kind]').forEach(el=>el.addEventListener('click',()=>choose(el.dataset.kind)));
choose('vase');
const sound=new TurntableSound(()=>scores,s=>{
  step=s;
  for(let i=0;i<3;i++){
    const dots=document.querySelectorAll(`#track${i} .note`);dots.forEach((dot,j)=>dot.classList.toggle('current',j===step));
    if(scores[i][s])needles[i].hit=performance.now();
  }
});
document.querySelector('#play').addEventListener('click',async()=>{
  const button=document.querySelector('#play');button.disabled=true;
  try {
    if(sound.playing){await sound.stop();button.innerHTML='<span aria-hidden="true">▶</span> 开始播放';status.textContent='唱针停在这里。';}
    else{await sound.start();button.innerHTML='<span aria-hidden="true">Ⅱ</span> 暂停';status.textContent='拖动唱针，听形状改变旋律。';}
  } catch(error){status.textContent='声音启动失败，请再次点播放。';console.error(error);}finally{button.disabled=false;}
});
document.querySelector('#tempo').addEventListener('input',event=>{
  const phase=sound.phase();sound.bpm=Number(event.target.value);
  if(sound.playing)sound.epoch=sound.context.currentTime-phase*(960/sound.bpm);
  document.querySelector('#bpm').value=sound.bpm;
});
document.querySelector('#about').addEventListener('click',event=>{
  const panel=document.querySelector('#explanation');panel.hidden=!panel.hidden;event.target.setAttribute('aria-expanded',!panel.hidden);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&sound.playing)document.querySelector('#play').click();});
const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let dragging=null;
stage.addEventListener('pointerdown',event=>{
  const r=stage.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
  raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(needles.map(n=>n.grip));
  if(hits.length){dragging={track:hits[0].object.userData.track,y:event.clientY,initial:heights[hits[0].object.userData.track]};stage.setPointerCapture(event.pointerId);stage.style.cursor='grabbing';}
});
stage.addEventListener('pointermove',event=>{
  if(!dragging)return;
  heights[dragging.track]=Math.max(.05,Math.min(.95,dragging.initial+(dragging.y-event.clientY)/180));updateTrack(dragging.track);
});
for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,()=>{dragging=null;stage.style.cursor='grab';});
stage.style.cursor='grab';
const unitY=new THREE.Vector3(0,1,0),end=new THREE.Vector3(),difference=new THREE.Vector3();
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function frame(){
  const phase=sound.phase(),index=(phase*64)%64,low=Math.floor(index),fraction=index-low;
  rotor.rotation.y=phase*Math.PI*2;
  for(let i=0;i<3;i++){
    const n=needles[i],p=profiles[i],r=p[low]*(1-fraction)+p[(low+1)%64]*fraction,y=minY+heights[i]*spanY;
    end.set(Math.max(.05,r),y,0);n.tip.position.copy(end);n.tip.visible=r>.02;
    n.grip.position.set(n.anchor.x,y+.18,n.anchor.z);
    n.arm.position.copy(n.grip.position).add(end).multiplyScalar(.5);
    difference.copy(end).sub(n.grip.position);n.arm.scale.y=difference.length();n.arm.quaternion.setFromUnitVectors(unitY,difference.normalize());
    n.tip.scale.setScalar(1+Math.max(0,1-(performance.now()-n.hit)/160)*.85);
  }
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
frame();
// Small observable surface for the one mechanical acceptance check.
window.sideB={get state(){return {kind,heights:[...heights],profiles:profiles.map(x=>[...x]),scores,playing:sound.playing,step,triangles:geometry.index.count/3};},sound};
status.textContent='点播放，让它开口。';
