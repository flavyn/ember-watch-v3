import { call, evaluate, ws, errors, requests } from './chrome-cdp.mjs';
import { writeFile } from 'node:fs/promises';
await call('Page.navigate',{url:'http://localhost:8083/?seed=19'});
for(let i=0;i<100;i++){if(await evaluate('!!window.__ember'))break;await new Promise(r=>setTimeout(r,100));}
const button=await evaluate('(()=>{const r=document.querySelector("#start").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
await call('Input.dispatchMouseEvent',{type:'mousePressed',...button,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',...button,button:'left',clickCount:1});
console.log('start',await evaluate('({state:__ember.game.state,locked:__ember.game.input.locked,health:__ember.game.player.health,beacon:__ember.game.rounds.beacon})'));
const checks=await evaluate(`(()=>{
 const {game:g,step,shoot}=__ember, checks=[];
 const test=(name,ok,details)=>{checks.push({name,pass:!!ok,details});};
 const ticks=n=>{for(let i=0;i<n;i++)step(1/60);};
 // Pause the RAF-driven branch while exercising the same fixed simulation step.
 g.state='play';g.input.clear();g.input.keys.add('KeyW');const z=g.player.position.z;ticks(30);g.input.clear();test('walk',g.player.position.z<z-2,{from:z,to:g.player.position.z});
 g.input.keys.add('ControlLeft');ticks(1);test('crouch',g.player.crouch,{eye:g.player.position.y});g.input.clear();
 g.weapon.cooldown=0;const shots=g.weapon.shots;shoot();test('lance fires',g.weapon.shots===shots+1&&g.weapon.heat>0,{shots:g.weapon.shots,heat:g.weapon.heat});
 g.weapon.heat=100;g.weapon.locked=true;g.weapon.cooldown=0;shoot();test('overheat blocks fire',g.weapon.shots===shots+1);
 g.input.pressed.add('KeyR');ticks(80);test('vent clears heat',!g.weapon.locked&&g.weapon.heat===0,{heat:g.weapon.heat});
 const flares=g.weapon.flareCount;g.input.pressed.add('KeyQ');ticks(1);test('flare cast',g.weapon.flareCount===flares-1&&g.weapon.flares.length===1);
 g.tide.rise(4);g.tide.level=g.tide.target;g.player.position.set(19,2,0);g.player.update(1/60,g.tide);g.weapon.cooldown=0;const s=g.weapon.shots;shoot();
 test('submerged cannot shoot',g.player.wet&&g.weapon.shots===s,{rings:g.tide.drownedPaths,safeRadius:g.tide.radius});
 g.input.keys.add('KeyW');const x0=g.player.position.clone();g.player.yaw=0;g.player.update(1,g.tide);g.input.clear();test('wading slow',Math.abs(g.player.position.z-x0.z)<=1.91);
 g.hollows.reset();const wet=g.hollows.spawn(19,0,false,1),hp=wet.hp;g.tide.update(1,g.hollows,g.world,(h,c)=>g.rounds.kill(h,c));test('tide hurts hollow',wet.hp<hp,{before:hp,after:wet.hp});
 g.hollows.reset();const warden=g.hollows.spawn(10,0,true,3);g.player.position.set(15,g.world.height(15,0)+1.8,0);g.player.sync();
 const head=warden.position.clone();head.y+=1.95*1.18;const body=warden.position.clone();body.y+=1.05*1.18;
 const hh=g.hollows.hit(g.player.position,head.clone().sub(g.player.position).normalize());const bh=g.hollows.hit(g.player.position,body.clone().sub(g.player.position).normalize());
 test('head and armor hit detection',hh?.head&&!bh?.head&&bh?.hollow.armored);
 g.rounds.salvage=10;g.state='upgrade';const d=g.weapon.damage;const bought=g.rounds.buy(0);test('upgrade purchase',bought&&g.weapon.damage>d&&g.rounds.salvage===5);test('upgrade once per interval',!g.rounds.buy(0));
 // Run a complete watch using the real hitscan, damage, heat, spawn and round systems.
 g.rounds.reset();g.hollows.reset();g.weapon.reset();g.player.reset();g.tide.reset();g.rng=(()=>{let n=7;return ()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};})();g.weapon.rng=g.rng;g.rounds.begin();
 let frames=0,upgrades=0;
 while(g.state!=='end'&&frames<40000){
  if(g.state==='upgrade'){g.rounds.buy(0);g.rounds.buy(1);g.rounds.buy(2);upgrades++;g.rounds.begin();}
  const h=g.hollows.active.find(h=>h.alive);
  if(h){
   const a=Math.atan2(h.position.x,h.position.z),r=Math.min(5,g.tide.radius-1);
   g.player.position.set(Math.sin(a)*r,g.world.height(Math.sin(a)*r,Math.cos(a)*r)+1.8,Math.cos(a)*r);
   const target=h.position.clone();target.y+=1.95*(h.armored?1.18:1);const delta=target.sub(g.player.position);
   g.player.yaw=Math.atan2(-delta.x,-delta.z);g.player.pitch=Math.atan2(delta.y,Math.hypot(delta.x,delta.z));g.input.fire=true;
  }else g.input.fire=false;
  if(g.weapon.heat>85)g.weapon.vent();
  step(1/60);frames++;
 }
 test('eight-wave victory with live weapon',g.state==='end'&&g.rounds.cleared===8,{frames,wave:g.rounds.wave,kills:g.rounds.kills,shots:g.weapon.shots,hits:g.weapon.hits,health:g.player.health,beacon:g.rounds.beacon,upgrades,result:g.rounds.result});
 // Restart and let actual enemy attacks resolve a loss.
 g.rounds.reset();g.hollows.reset();g.weapon.reset();g.player.reset();g.player.position.set(0,g.world.height(0,20)+1.8,20);g.tide.reset();g.input.clear();g.rounds.begin();
 let idle=0;while(g.state!=='end'&&idle<20000){step(1/60);idle++;}
 test('natural loss',g.state==='end'&&(g.rounds.beacon===0||g.player.health===0),{frames:idle,beacon:g.rounds.beacon,health:g.player.health,result:g.rounds.result});
 // A fatal melee hit must also end the watch, independently of beacon integrity.
 g.rounds.reset();g.hollows.reset();g.weapon.reset();g.player.reset();g.tide.reset();g.input.clear();g.rounds.begin();g.player.health=1;
 const attacker=g.hollows.spawn(g.player.position.x,g.player.position.z,false,1);attacker.cooldown=0;step(1/60);
 test('keeper death loses',g.state==='end'&&g.player.health===0&&g.rounds.beacon===100);
 g.start();test('restart resets the watch',g.state==='play'&&g.rounds.wave===1&&g.rounds.kills===0&&g.rounds.beacon===100&&g.player.health===100&&g.weapon.heat===0);
 return checks;
})()`);
console.log(JSON.stringify({checks,errors,external:requests.filter(u=>!u.startsWith('http://localhost:8083/')&&!u.startsWith('data:'))},null,2));
await writeFile(new URL('../qa-results.json',import.meta.url),JSON.stringify({checks,errors,external:requests.filter(u=>!u.startsWith('http://localhost:8083/')&&!u.startsWith('data:'))},null,2)+'\n');
ws.close();
if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;
