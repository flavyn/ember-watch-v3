export class Input {
  constructor(canvas) {
    this.keys = new Set(); this.pressed = new Set(); this.fire = false; this.dx = 0; this.dy = 0; this.locked = false;
    window.addEventListener('keydown', e => {
      if (['Space','ControlLeft','ControlRight','Tab','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; this.clear(); this.onLock?.(this.locked); });
    document.addEventListener('mousemove', e => { if (this.locked) { this.dx += e.movementX; this.dy += e.movementY; } });
    canvas.addEventListener('mousedown', e => { if (e.button === 0 && this.locked) this.fire = true; });
    window.addEventListener('mouseup', () => this.fire = false);
    canvas.addEventListener('contextmenu', e => e.preventDefault()); this.canvas = canvas;
  }
  lock() { const p = this.canvas.requestPointerLock(); p?.catch(() => {}); }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
  down(code) { return this.keys.has(code); }
  take(code) { const yes = this.pressed.has(code); this.pressed.delete(code); return yes; }
  clear() { this.keys.clear(); this.pressed.clear(); this.fire = false; this.dx = 0; this.dy = 0; }
}
