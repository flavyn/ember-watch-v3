import * as THREE from 'three';
import { seeded } from './rng.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Hollows } from './hollow.js';
import { Weapon } from './weapon.js';
import { Rounds } from './rounds.js';
import { HUD } from './hud.js';
import { Tide } from './tide.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { setupShot } from './shots.js';

const params=new URLSearchParams(location.search), seed=params.get('seed')||'1', shot=params.get('shot');
const canvas=document.getElementById('view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.08,350);
const g={scene,camera,renderer,state:'title',time:0,rng:seeded(seed)};
g.audio=new Audio();g.input=new Input(canvas);g.world=new World(scene,seeded(seed+'-land'));g.tide=new Tide();g.player=new Player(camera,g.input,g.world);
g.hollows=new Hollows(scene,g.world);g.weapon=new Weapon(scene,camera,g.rng,g.audio);g.hud=new HUD();g.rounds=new Rounds(g);
g.scenicCamera=()=>{camera.position.set(31,22,36);camera.lookAt(3,4,0);camera.rotation.z=0;};
g.start=()=>{
  g.rng=seeded(seed);g.weapon.rng=g.rng;g.rounds.reset();g.player.reset();g.weapon.reset();g.hollows.reset();g.tide.reset();g.time=0;g.hud.hitTime=0;g.hud.plateTime=0;
  g.player.position.y=g.world.height(0,12)+1.8;g.player.sync();g.weapon.model.visible=true;g.audio.start();g.rounds.begin();g.hud.screen('play',g);g.input.lock();
};
g.resume=()=>{g.audio.start();g.state='play';g.hud.screen('play',g);g.input.lock();};
g.next=()=>{g.rounds.begin();g.player.sync();g.weapon.model.visible=true;g.hud.screen('play',g);g.input.lock();};
g.input.onLock=locked=>{if(!locked&&g.state==='play'&&!shot){g.state='pause';g.hud.screen('pause',g);}};
document.getElementById('sound').onclick=()=>{g.audio.enabled=!g.audio.enabled;document.getElementById('sound').textContent=g.audio.enabled?'SOUND ON':'SOUND OFF';if(g.audio.enabled)g.audio.start();};

// Resolve the nearest target, stopping at the lighthouse. One pipeline owns all hits.
function shoot() {
  const s=g.weapon.fire(g.player);if(!s)return;
  const ray=new THREE.Ray(s.origin,s.direction),center=new THREE.Vector3(0,7,0);
  const blocker=ray.intersectBox(new THREE.Box3(new THREE.Vector3(-1.5,4,-1.5),new THREE.Vector3(1.5,13,1.5)),center);
  const limit=blocker?blocker.distanceTo(s.origin):65;
  const hit=g.hollows.hit(s.origin,s.direction,limit);
  const end=hit?hit.point:s.origin.clone().addScaledVector(s.direction,limit);
  g.weapon.trace(s.origin.clone().add(new THREE.Vector3(.1,-.15,0)),end,!!hit);
  if(hit){
    const plate=hit.hollow.armored&&!hit.head;g.weapon.hits++;if(hit.head)g.weapon.headshots++;
    g.hud.hit(hit.head,plate);if(plate)g.audio.plate();else g.audio.hit(hit.head);
    g.hollows.damage(hit.hollow,g.weapon.damage*(hit.head?2.6:plate?.2:1),hit.head,'lance',(h,c,head)=>g.rounds.kill(h,c,head));
  }
}
function step(dt){
  if(g.state!=='play')return;
  g.time+=dt;g.player.update(dt,g.tide);g.weapon.update(dt,g.time,g.player);
  if(g.input.take('KeyR'))g.weapon.vent();if(g.input.take('KeyQ'))g.weapon.flare(g.player,g.world);
  if(g.input.take('Escape')){g.state='pause';g.input.unlock();g.hud.screen('pause',g);return;}
  if(g.input.fire)shoot();
  g.tide.update(dt,g.hollows,g.world,(h,c)=>g.rounds.kill(h,c));
  g.hollows.update(dt,g.time,g.player,g.weapon,g.rounds,g.audio);g.rounds.update(dt);g.hud.update(dt,g);
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(shot)window.__shotReady=false;}
window.addEventListener('resize',resize);resize();
g.weapon.model.visible=false;g.scenicCamera();g.hud.screen('title',g);
if(shot)setupShot(g,shot);
let previous,accumulator=0;
function frame(ms){
  const elapsed=previous===undefined?0:Math.min(.1,(ms-previous)/1000);previous=ms;
  if(!shot){accumulator+=elapsed;while(accumulator>=1/60){step(1/60);accumulator-=1/60;}if(g.state==='title'){g.time+=elapsed;g.scenicCamera();}g.world.update(g.time,g.tide);}
  if(!shot || !window.__shotReady) renderer.render(scene,camera);
  if(shot && !window.__shotReady){requestAnimationFrame(()=>{window.__shotReady=true;});}
  requestAnimationFrame(frame);
}
// Inspectable local state for reproducible QA; no network, storage, or wall clock.
window.__ember={game:g,step,shoot,version:3};
window.addEventListener('error',e=>{window.__emberError=String(e.message);});
requestAnimationFrame(frame);
