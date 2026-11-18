import * as THREE from 'three';
import { mesh, material } from './world.js';
export class Weapon {
  constructor(scene, camera, rng, audio) {
    this.rng = rng; this.audio = audio; this.scene = scene; this.camera = camera;
    this.model = new THREE.Group(); this.model.scale.setScalar(.65); camera.add(this.model); scene.add(camera);
    const iron = material('#27434e', { metalness: .8, roughness: .35 }), brass = material('#c8995f', { metalness: .7, roughness: .3 });
    mesh(new THREE.BoxGeometry(.24, .26, .63), iron, this.model, .3, -.26, -.56);
    mesh(new THREE.BoxGeometry(.13, .31, .18), material('#704c3b'), this.model, .3, -.46, -.4);
    const barrel = mesh(new THREE.CylinderGeometry(.065, .09, .73, 10), brass, this.model, .3, -.23, -1.04); barrel.rotation.x = Math.PI / 2;
    this.coil = mesh(new THREE.BoxGeometry(.13, .11, .37), material('#ffc570', { emissive: '#ff762a', emissiveIntensity: 1.4 }), this.model, .3, -.2, -.65);
    for (let i = 0; i < 5; i++) { const ring = mesh(new THREE.TorusGeometry(.11, .018, 5, 12), brass, this.model, .3, -.23, -.8 - i * .1); ring.rotation.y = 0; }
    mesh(new THREE.BoxGeometry(.035, .1, .035), iron, this.model, .3, -.13, -1.35);
    this.muzzle = mesh(new THREE.IcosahedronGeometry(.17, 0), new THREE.MeshBasicMaterial({ color: '#fff1ba' }), this.model, .3, -.23, -1.44); this.muzzle.visible = false;
    this.flashLight = new THREE.PointLight('#ffb050', 0, 7); this.model.add(this.flashLight); this.flashLight.position.set(.3, -.2, -1.4);
    this.tracers = []; this.flares = []; this.reset();
  }
  reset() {
    this.heat = 0; this.locked = false; this.venting = false; this.cooldown = 0; this.recoil = 0; this.flash = 0; this.damage = 30; this.cooling = 19; this.flareCount = 3; this.shots = 0; this.hits = 0; this.headshots = 0;
    for (const t of this.tracers) this.scene.remove(t.mesh); this.tracers = [];
    for (const f of this.flares) this.scene.remove(f.group); this.flares = [];
  }
  vent() { if (!this.venting && this.heat > 0) { this.venting = true; this.audio.vent(); } }
  fire(player) {
    if (player.wet || this.venting || this.locked || this.cooldown > 0) return null;
    this.cooldown = .17; this.heat = Math.min(100, this.heat + 12); this.locked = this.heat >= 100; this.recoil = .08; this.flash = .055; this.shots++; this.audio.shot();
    const spread = (player.crouch ? .002 : .007) + this.heat * .000045;
    const direction = new THREE.Vector3((this.rng() - .5) * spread, (this.rng() - .5) * spread, -1).normalize().applyQuaternion(this.camera.quaternion);
    return { origin: this.camera.position.clone(), direction };
  }
  trace(start, end, hit) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: hit ? '#fff1b8' : '#ffb05d', transparent: true, opacity: .85 }));
    this.scene.add(line); this.tracers.push({ mesh: line, life: .085 });
  }
  flare(player, world) {
    if (!this.flareCount || player.wet) return false;
    this.flareCount--; this.audio.flare();
    const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
    const position = player.position.clone().addScaledVector(direction, 7);
    const r = Math.hypot(position.x, position.z); if (r > 21) { position.x *= 21 / r; position.z *= 21 / r; }
    position.y = world.height(position.x, position.z) + .4;
    const group = new THREE.Group(); group.position.copy(position); this.scene.add(group);
    mesh(new THREE.IcosahedronGeometry(.18, 1), new THREE.MeshBasicMaterial({ color: '#fff4b0' }), group);
    const light = new THREE.PointLight('#ff8542', 40, 16); group.add(light);
    const ring = mesh(new THREE.TorusGeometry(1, .04, 4, 64), new THREE.MeshBasicMaterial({ color: '#ffc079', transparent: true, opacity: .6 }), group); ring.rotation.x = Math.PI / 2;
    this.flares.push({ position, group, light, ring, life: 7 }); return true;
  }
  update(dt, time, player) {
    this.cooldown = Math.max(0, this.cooldown - dt); this.flash = Math.max(0, this.flash - dt); this.recoil *= Math.exp(-dt * 17);
    this.heat = Math.max(0, this.heat - dt * (this.venting ? 82 : this.cooling));
    if (this.heat === 0) this.venting = false;
    if (this.heat < 28) this.locked = false;
    this.model.position.set(.09 + Math.sin(player.walk) * .008, -.08 + Math.cos(player.walk * 2) * .006 - (this.venting ? .13 : 0), -.12 + this.recoil);
    this.model.rotation.z = this.venting ? -.15 : 0; this.muzzle.visible = this.flash > 0; this.flashLight.intensity = this.flash > 0 ? 8 : 0;
    this.coil.material.emissiveIntensity = 1 + this.heat * .03;
    for (const t of this.tracers) { t.life -= dt; t.mesh.material.opacity = Math.max(0, t.life * 10); }
    this.tracers = this.tracers.filter(t => { if (t.life > 0) return true; this.scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.dispose(); return false; });
    for (const f of this.flares) { f.life -= dt; f.ring.scale.setScalar(1.3 + Math.sin(time * 4) * .35); f.light.intensity = Math.min(40, f.life * 12); }
    this.flares = this.flares.filter(f => { if (f.life > 0) return true; this.scene.remove(f.group); return false; });
  }
}
