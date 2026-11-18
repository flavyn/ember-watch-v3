export class Audio {
  constructor() { this.enabled = true; this.ctx = null; }
  start() { if (!this.ctx) this.ctx = new AudioContext(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  tone(freq, duration, type = 'sine', volume = .08, end = freq) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + duration);
  }
  shot() { this.tone(160, .13, 'sawtooth', .055, 35); this.tone(900, .045, 'triangle', .05, 200); }
  hit(head) { this.tone(head ? 1000 : 440, .08, 'triangle', .06, head ? 1500 : 250); }
  plate() { this.tone(230, .14, 'square', .035, 90); }
  vent() { this.tone(1300, .5, 'sawtooth', .025, 90); }
  flare() { this.tone(240, .5, 'triangle', .1, 1600); }
  wave() { this.tone(146.8, .8, 'sine', .11); this.tone(220, 1.2, 'sine', .07); }
  buy() { this.tone(660, .3, 'sine', .1, 1320); }
  hurt() { this.tone(80, .2, 'sawtooth', .045, 30); }
}
