export const UPGRADES = [
  { name: 'Forged ember', detail: '+25% lance damage. Make every opening count.', cost: 5, apply: g => { g.weapon.damage *= 1.25; } },
  { name: 'Salt-cooled coil', detail: '+35% passive cooling. Longer bursts before venting.', cost: 4, apply: g => { g.weapon.cooling *= 1.35; } },
  { name: 'Mend the light', detail: 'Restore 30 beacon integrity and 35 keeper vitality.', cost: 4, apply: g => { g.rounds.beacon = Math.min(100, g.rounds.beacon + 30); g.player.health = Math.min(100, g.player.health + 35); } },
];
export class Rounds {
  constructor(game) { this.game = game; this.reset(); }
  reset() { this.wave = 0; this.beacon = 100; this.salvage = 0; this.kills = 0; this.tideKills = 0; this.score = 0; this.pending = 0; this.spawnTimer = 0; this.cleared = 0; this.bought = new Set(); this.result = ''; }
  begin() {
    this.wave++; this.pending = 5 + this.wave * 2; this.spawnTimer = 1.5; this.bought.clear();
    this.game.tide.rise(this.wave); this.game.state = 'play'; this.game.weapon.flareCount = Math.min(5, this.game.weapon.flareCount + (this.wave === 1 ? 0 : 2));
    this.game.hud.message(`WAVE ${this.wave} / 8  ·  TIDE RISING — MOVE INWARD`, 5); this.game.audio.wave();
  }
  kill(h, cause, head = false) {
    this.kills++; this.salvage += h.armored ? 2 : 1; this.score += (h.armored ? 180 : 100) + (head ? 50 : 0);
    if (cause === 'tide') { this.tideKills++; this.score += 30; }
  }
  buy(index) {
    const upgrade = UPGRADES[index];
    if (this.game.state !== 'upgrade' || this.bought.has(index) || this.salvage < upgrade.cost) return false;
    this.salvage -= upgrade.cost; upgrade.apply(this.game); this.bought.add(index); this.game.audio.buy(); this.game.hud.screen('upgrade', this.game); return true;
  }
  update(dt) {
    const g = this.game;
    if (this.beacon <= 0 || g.player.health <= 0) { this.end(false); return; }
    this.spawnTimer -= dt;
    if (this.pending > 0 && this.spawnTimer <= 0) {
      const a = g.rng() * Math.PI * 2, r = Math.min(21, g.tide.radius + 1.2);
      g.hollows.spawn(Math.sin(a) * r, Math.cos(a) * r, this.wave >= 2 && this.pending % 3 === 0, this.wave);
      this.pending--; this.spawnTimer = Math.max(.55, 1.65 - this.wave * .12);
    }
    if (!this.pending && !g.hollows.active.some(h => h.alive)) {
      this.cleared = this.wave; this.score += this.wave * 200; this.salvage += 3;
      if (this.wave === 8) { this.end(true); return; }
      g.state = 'upgrade'; g.input.unlock();g.weapon.model.visible=false;g.scenicCamera();g.hud.screen('upgrade', g); g.audio.wave();
    }
  }
  end(won) {
    const g = this.game; this.result = won ? 'DAWN HELD' : 'THE LIGHT WENT OUT';
    if (won) this.score += Math.round(this.beacon * 25 + g.player.health * 10);
    g.state = 'end'; g.input.unlock(); g.weapon.model.visible = false;g.scenicCamera();g.hud.screen('end', g); g.audio.wave();
  }
}
