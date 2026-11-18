import * as THREE from 'three';
import { mesh, material } from './world.js';
export class Hollows {
  constructor(scene, world) {
    this.world = world; this.pool = []; this.active = []; this.temp = new THREE.Vector3();
    const skin = material('#53736e', { flatShading: true }), coat = material('#344e57'), plate = material('#af9c81', { metalness: .7, roughness: .35 });
    const eye = new THREE.MeshBasicMaterial({ color: '#ffb274' });
    for (let i = 0; i < 40; i++) {
      const group = new THREE.Group(); scene.add(group); group.visible = false;
      const body = mesh(new THREE.CylinderGeometry(.33, .48, 1.15, 7), coat, group, 0, 1.1);
      mesh(new THREE.IcosahedronGeometry(.32, 1), skin, group, 0, 1.95);
      mesh(new THREE.BoxGeometry(.41, .065, .1), eye, group, 0, 2.01, .28);
      const armor = mesh(new THREE.BoxGeometry(.88, .8, .52), plate, group, 0, 1.25, .08);
      const limbs = [];
      for (const s of [-1, 1]) {
        const arm = mesh(new THREE.BoxGeometry(.19, .88, .23), skin, group, s * .52, 1.18); arm.rotation.z = s * -.22; limbs.push(arm);
        limbs.push(mesh(new THREE.BoxGeometry(.22, .75, .24), coat, group, s * .23, .4));
        mesh(new THREE.BoxGeometry(.28, .15, .43), skin, group, s * .23, .08, .09);
      }
      const h = { group, body, armor, limbs, position: group.position, alive: false, hp: 0, phase: i * .7, flash: 0, wet: false };
      this.pool.push(h);
    }
  }
  reset() { for (const h of this.pool) { h.alive = false; h.group.visible = false; } this.active = []; }
  spawn(x, z, armored = false, wave = 1) {
    const h = this.pool.find(h => !h.alive); if (!h) return null;
    Object.assign(h, { alive: true, hp: armored ? 110 + wave * 3 : 60 + wave * 3, armored, speed: (armored ? .95 : 1.35) + wave * .08, cooldown: 1, flash: 0, wet: false });
    h.position.set(x, this.world.height(x, z), z); h.group.visible = true; h.armor.visible = armored; h.group.scale.setScalar(armored ? 1.18 : 1); this.active.push(h); return h;
  }
  update(dt, time, player, weapon, rounds, audio) {
    for (const h of this.active) {
      if (!h.alive) continue;
      h.cooldown -= dt; h.flash = Math.max(0, h.flash - dt);
      let tx = 0, tz = 0;
      const pd = Math.hypot(player.position.x - h.position.x, player.position.z - h.position.z);
      if (pd < 6) { tx = player.position.x; tz = player.position.z; }
      const lure = weapon.flares.find(f => f.life > 0 && f.position.distanceTo(h.position) < 10);
      if (lure) { tx = lure.position.x; tz = lure.position.z; }
      const dx = tx - h.position.x, dz = tz - h.position.z, d = Math.hypot(dx, dz);
      const beaconDistance = Math.hypot(h.position.x, h.position.z);
      const touchingPlayer = pd < 1.6 && !lure;
      const touchingBeacon = tx === 0 && tz === 0 && beaconDistance < 2.9;
      if (touchingPlayer || touchingBeacon) {
        if (h.cooldown <= 0) { h.cooldown = 1.1; if (touchingPlayer) { player.damage(h.armored ? 13 : 9); audio.hurt(); } else rounds.beacon = Math.max(0, rounds.beacon - (h.armored ? 5 : 3)); }
      } else if (d > (lure ? 1.5 : .1)) {
        const speed = h.speed * (h.wet ? .68 : 1) * dt;
        h.position.x += dx / d * speed; h.position.z += dz / d * speed;
      }
      h.position.y = this.world.height(h.position.x, h.position.z);
      h.group.rotation.y = Math.atan2(dx, dz);
      h.limbs.forEach((limb, i) => limb.rotation.x = Math.sin(time * 6 + h.phase + i * Math.PI) * .38);
      h.body.scale.x = h.flash > 0 ? 1.15 : 1;
      if (lure && d < 4) this.damage(h, dt * 9, false, 'flare', (enemy, cause) => rounds.kill(enemy, cause));
    }
    this.active = this.active.filter(h => h.alive);
  }
  damage(h, amount, head, cause, onKill) {
    if (!h.alive) return;
    h.hp -= amount; h.flash = .12;
    if (h.hp <= 0) { h.alive = false; h.group.visible = false; onKill?.(h, cause, head); }
  }
  hit(origin, direction, maxDistance = 65) {
    const ray = new THREE.Ray(origin, direction); let best = null;
    for (const h of this.active) {
      if (!h.alive) continue;
      const scale = h.armored ? 1.18 : 1;
      for (const head of [true, false]) {
        const center = h.position.clone().add(new THREE.Vector3(0, (head ? 1.95 : 1.05) * scale, 0));
        const sphere = new THREE.Sphere(center, (head ? .34 : .65) * scale);
        const point = ray.intersectSphere(sphere, this.temp);
        if (!point) continue;
        const distance = point.distanceTo(origin);
        if (distance < maxDistance && (!best || distance < best.distance)) best = { hollow: h, head, distance, point: point.clone() };
      }
    }
    return best;
  }
}
