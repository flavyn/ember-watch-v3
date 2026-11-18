import * as THREE from 'three';
export class Player {
  constructor(camera, input, world) { this.camera = camera; this.input = input; this.world = world; this.reset(); }
  reset() { this.position = new THREE.Vector3(0, 0, 12); this.yaw = 0; this.pitch = -.08; this.health = 100; this.wet = false; this.crouch = false; this.walk = 0; this.hurt = 0; this.camera.rotation.order = 'YXZ'; }
  update(dt, tide) {
    const i = this.input;
    this.yaw -= i.dx * .0022; this.pitch = THREE.MathUtils.clamp(this.pitch - i.dy * .0022, -1.25, 1.25); i.dx = i.dy = 0;
    this.crouch = i.down('ControlLeft') || i.down('ControlRight') || i.down('KeyC');
    this.wet = tide.submerged(this.position.x, this.position.z, this.world);
    const f = Number(i.down('KeyW') || i.down('ArrowUp')) - Number(i.down('KeyS') || i.down('ArrowDown'));
    const s = Number(i.down('KeyD') || i.down('ArrowRight')) - Number(i.down('KeyA') || i.down('ArrowLeft'));
    const speed = (this.wet ? 1.9 : this.crouch ? 2.5 : 5.6) * dt / Math.max(1, Math.hypot(f, s));
    this.world.move(this.position, (s * Math.cos(this.yaw) - f * Math.sin(this.yaw)) * speed, (-f * Math.cos(this.yaw) - s * Math.sin(this.yaw)) * speed);
    if (f || s) this.walk += dt * 9;
    const eye = this.world.height(this.position.x, this.position.z) + (this.crouch ? 1.05 : 1.8);
    this.position.y += (eye - this.position.y) * Math.min(1, dt * 18);
    this.hurt = Math.max(0, this.hurt - dt * 2); this.sync();
  }
  sync() { this.camera.position.copy(this.position); this.camera.rotation.set(this.pitch, this.yaw, 0); }
  damage(n) { this.health = Math.max(0, this.health - n); this.hurt = .6; }
}
