export class Tide {
  constructor() { this.reset(); }
  reset() { this.wave = 0; this.level = -.2; this.target = -.2; this.radius = 22; }
  rise(wave) { this.wave = wave; this.target = .67 + (wave - 1) * .46; this.radius = 22 - wave * 2; }
  submerged(x, z, world) { return world.height(x, z) < this.level - .06; }
  update(dt, hollows, world, onKill) {
    this.level = Math.min(this.target, this.level + dt * .34);
    for (const h of hollows.active) {
      h.wet = this.submerged(h.position.x, h.position.z, world);
      if (h.wet) hollows.damage(h, dt * 13, false, 'tide', onKill);
    }
  }
  get drownedPaths() { return Array.from({ length: this.wave }, (_, i) => i + 1); }
}
