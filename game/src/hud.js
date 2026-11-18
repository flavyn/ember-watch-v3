import { UPGRADES } from './rounds.js';
const $ = id => document.getElementById(id);
export class HUD {
  constructor() { this.cache = new Map(); this.hitTime = 0; this.plateTime = 0; this.messageTime = 0; this.messageText = ''; this.overlay = $('overlay'); this.radar = $('map').getContext('2d'); }
  text(id, value) { if (this.cache.get(id) !== value) { $(id).textContent = value; this.cache.set(id, value); } }
  style(id, key, value) { const token = id + key; if (this.cache.get(token) !== value) { $(id).style[key] = value; this.cache.set(token, value); } }
  message(text, seconds = 3) { this.messageText = text; this.messageTime = seconds; }
  hit(head, plate) { this.hitTime = .15; this.plateTime = plate ? 2.5 : 0; this.style('hitmarker', 'color', head ? '#a4ffee' : '#ffc47b'); }
  screen(state, g) {
    $('hud').hidden = state !== 'play'; this.overlay.innerHTML = '';
    if (state === 'play') return;
    if (state === 'title') {
      this.overlay.innerHTML = `<section class="panel title-panel"><div class="kicker">A TIDAL SURVIVAL GAME</div><h1>Ember<br><span>Watch.</span></h1><div class="tagline">Hold the light. Yield to the sea.</div><p class="intro">One keeper. One ember lance. An ocean of Hollow.<br>Keep the beacon burning until the eighth wave breaks.</p><div class="rule"><b>The sea takes a ring every wave.</b><br>Climb to higher stone. Water hurts the Hollow,<br>but slows you and silences your lance.</div><button class="primary" id="start">BEGIN THE WATCH <span>→</span></button><div class="controls"><span><kbd>W A S D</kbd> Move</span><span><kbd>MOUSE</kbd> Aim & fire</span><span><kbd>R</kbd> Vent heat</span><span><kbd>Q</kbd> Cast a flare</span><span><kbd>CTRL</kbd> Crouch / steady aim</span><span><kbd>ESC</kbd> Pause</span></div></section><div class="caption">BLACKTHORN ROCK · WATCH VIII<b>There is still a light out here.</b>8 WAVES · 100 INTEGRITY · NO RETREAT</div>`;
      $('start').onclick = () => g.start();
    }
    if (state === 'pause') {
      this.overlay.innerHTML = `<section class="panel pause-panel"><span class="eyebrow">WATCH SUSPENDED</span><h2>A breath between<br>the breakers.</h2><p>The tide waits while you are away.<br>Click below to recapture your mouse and return.</p><button id="resume" class="primary">RESUME WATCH <span>→</span></button><p>R vent · Q flare · Ctrl steady aim · Esc pause</p></section>`;
      $('resume').onclick = () => g.resume();
    }
    if (state === 'upgrade') {
      this.overlay.innerHTML = `<section class="panel upgrade-panel"><div class="upgrade-heading"><div><span class="eyebrow">WAVE ${String(g.rounds.wave).padStart(2,'0')} SURVIVED · THE SEA IS STILL RISING</span><h2>A moment to mend.</h2><p>Recover what the Hollow left. Prepare for the next, smaller shore.</p></div><div class="bank">◈ ${g.rounds.salvage}<small>SALVAGE AVAILABLE</small></div></div><div class="cards">${UPGRADES.map((u,i)=>`<article class="card"><span class="number">0${i+1} / FIELD UPGRADE</span><h3>${u.name}</h3><p>${u.detail}</p><button id="buy${i}" ${g.rounds.bought.has(i)||g.rounds.salvage<u.cost?'disabled':''}>${g.rounds.bought.has(i)?'EQUIPPED ✓':`INSTALL · ${u.cost} SALVAGE`}</button></article>`).join('')}</div><div class="upgrade-foot"><p>Next tide: ${g.rounds.wave+1} rings lost. Flare supply +2.<br>Unspent salvage carries into the next wave.</p><button class="primary" id="continue">SAVE & FACE WAVE ${g.rounds.wave+1} <span>→</span></button></div></section>`;
      UPGRADES.forEach((u,i)=> $('buy'+i).onclick=()=>g.rounds.buy(i));
      $('continue').onclick = () => g.next();
    }
    if (state === 'end') {
      const won = g.rounds.cleared === 8;
      this.overlay.innerHTML = `<section class="panel end-panel"><div class="kicker">${won?'THE EIGHTH WAVE HAS BROKEN':'BLACKTHORN ROCK · FINAL REPORT'}</div><h2>${won?'Dawn held.':'The light<br>went out.'}</h2><p>${won?'Eight waves. One keeper. The beacon sees another dawn.':g.player.health<=0?'The keeper fell. The ocean remembers the watch.':'The beacon fell silent. Another keeper will take the watch.'}</p><div class="endstats"><div><strong class="score">${g.rounds.score.toLocaleString('en-US')}</strong><span>WATCH SCORE</span></div><div><strong>${g.rounds.wave} / 8</strong><span>WAVES REACHED</span></div><div><strong>${g.rounds.kills}</strong><span>HOLLOW VANQUISHED</span></div><div><strong>${g.weapon.shots?Math.round(g.weapon.hits/g.weapon.shots*100):0}%</strong><span>SHOT ACCURACY</span></div></div><p>${g.rounds.tideKills} claimed by the tide · ${g.weapon.headshots} headshots</p><button class="primary" id="restart">TAKE THE WATCH AGAIN <span>↻</span></button></section><div class="caption">THE ATLANTIC ALWAYS RETURNS.<b>So does the light.</b></div>`;
      $('restart').onclick=()=>g.start();
    }
  }
  update(dt, g) {
    this.hitTime = Math.max(0, this.hitTime-dt); this.plateTime=Math.max(0,this.plateTime-dt); this.messageTime=Math.max(0,this.messageTime-dt);
    const r=g.rounds,w=g.weapon,p=g.player,t=g.tide;
    this.text('wave', `${String(r.wave).padStart(2,'0')} / 08`); this.text('remaining', `${r.pending+g.hollows.active.filter(h=>h.alive).length} HOLLOW REMAIN`);
    this.text('beaconText', `${Math.ceil(r.beacon)} / 100`); this.style('beaconBar','width',`${r.beacon}%`);
    this.text('healthText', `${Math.ceil(p.health)} / 100`); this.style('healthBar','width',`${p.health}%`);
    this.text('heatText', `${Math.ceil(w.heat)}%`); this.style('heatBar','width',`${w.heat}%`);
    this.text('heatLabel', w.venting?'VENTING / LANCE DISABLED':w.locked?'OVERHEATED · PRESS R':'EMBER LANCE / HEAT');
    this.text('flareText', `Q  FLARES ${w.flareCount}`); this.text('salvageText', `◈  SALVAGE ${r.salvage}`); this.text('killsText', `KILLS ${r.kills}`);
    this.text('tideText', `${t.wave} / 8 RINGS LOST`); this.text('tideDetail', `${t.radius}m of high ground · water hurts Hollow`);
    this.text('message', this.messageTime>0?this.messageText:''); this.style('hitmarker','opacity',this.hitTime>0?'1':'0'); this.style('plateHint','display',this.plateTime>0?'block':'none');
    this.style('submerged','display',p.wet?'block':'none'); this.style('damage','opacity',`${p.hurt}`); this.map(g);
  }
  map(g) {
    const c=this.radar; c.clearRect(0,0,160,160); c.fillStyle='#102f3cbb'; c.beginPath(); c.arc(80,80,74,0,Math.PI*2);c.fill();
    for(let i=0;i<9;i++){c.strokeStyle=i<g.tide.wave?'#69cbd055':'#b7d3ba66';c.beginPath();c.arc(80,80,(22-i*2)*3,0,Math.PI*2);c.stroke();}
    c.fillStyle='#ffc47b';c.fillRect(77,77,6,6);
    for(const h of g.hollows.active){if(!h.alive)continue;c.fillStyle=h.armored?'#ffc47b':'#ff9985';c.beginPath();c.arc(80+h.position.x*3,80+h.position.z*3,2.5,0,7);c.fill();}
    c.save();c.translate(80+g.player.position.x*3,80+g.player.position.z*3);c.rotate(-g.player.yaw);c.fillStyle='#b7fff1';c.beginPath();c.moveTo(0,-5);c.lineTo(4,4);c.lineTo(-4,4);c.fill();c.restore();
  }
}
