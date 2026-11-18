import * as THREE from 'three';
export function material(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .82, ...extra }); }
export function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
}
export class World {
  constructor(scene, rng) {
    this.scene = scene; scene.background = new THREE.Color('#294e65'); scene.fog = new THREE.FogExp2('#294e65', .0045);
    scene.add(new THREE.HemisphereLight('#c6e8ee', '#536777', 2.6));
    const moonlight = new THREE.DirectionalLight('#c8e8ff', 2.6); moonlight.position.set(-25, 40, 15); scene.add(moonlight);
    const warm = new THREE.DirectionalLight('#ffc385', 1.6); warm.position.set(14, 15, -14); scene.add(warm);
    this.land = new THREE.Group(); scene.add(this.land); this.paths = [];
    const rock = material('#3f626a', { flatShading: true });
    const slate = [material('#7b9190'), material('#647f82'), material('#90a29b')];
    for (let i = 0; i <= 8; i++) {
      const radius = 22 - i * 2, top = .45 + i * .46;
      mesh(new THREE.CylinderGeometry(radius, radius + .4, i ? .46 : 3.4, 64), rock, this.land, 0, i ? top - .23 : top - 1.7, 0);
      const tiles = new THREE.Group(); this.land.add(tiles); this.paths.push(tiles);
      const n = Math.round(radius * 3.6);
      const batches = slate.map(mat => new THREE.InstancedMesh(new THREE.BoxGeometry(1.42,.09,1.52), mat, Math.ceil(n/3)));
      const counts=[0,0,0], dummy=new THREE.Object3D();
      for (let j = 0; j < n; j++) {
        const a = j / n * Math.PI * 2, r = radius - .9;
        dummy.position.set(Math.sin(a)*r,top+.025,Math.cos(a)*r);dummy.rotation.set(0,a,(rng()-.5)*.025);
        dummy.scale.set(.92+rng()*.12,1,.94+rng()*.09);dummy.updateMatrix();
        const b=j%3;batches[b].setMatrixAt(counts[b]++,dummy.matrix);
      }
      batches.forEach((b,j)=>{b.count=counts[j];tiles.add(b);});
      const rim = mesh(new THREE.TorusGeometry(radius - .14, .045, 4, 96), material('#c5bb91'), this.land, 0, top + .09, 0); rim.rotation.x = Math.PI / 2;
    }
    for (let i = 0; i < 100; i++) {
      const a = rng() * Math.PI * 2, r = 23 + rng() * 22, h = .5 + rng() * 4;
      const stone = mesh(new THREE.ConeGeometry(1 + rng() * 1.8, h, 5), rock, scene, Math.sin(a) * r, -1 + h * .15, Math.cos(a) * r);
      stone.rotation.set(rng() * .3, rng() * 6, rng() * .3);
    }
    const waterGeo = new THREE.PlaneGeometry(260, 260, 90, 90); waterGeo.rotateX(-Math.PI / 2);
    this.water = mesh(waterGeo, material('#378b9d', { metalness: .35, roughness: .28, transparent: true, opacity: .87 }), scene);
    this.foam = new THREE.Group(); scene.add(this.foam);
    const foamMat = new THREE.MeshBasicMaterial({ color: '#b3e6d9', transparent: true, opacity: .7 });
    for (let i = 0; i < 3; i++) { const f = mesh(new THREE.TorusGeometry(1, .025, 4, 140), foamMat, this.foam); f.rotation.x = Math.PI / 2; }
    this.beacon = new THREE.Group(); this.beacon.position.y = 4.13; scene.add(this.beacon);
    mesh(new THREE.CylinderGeometry(2.2, 2.6, .38, 12), material('#b4aa8d'), this.beacon, 0, .18);
    mesh(new THREE.CylinderGeometry(.96, 1.6, 6.2, 12), material('#c7c4a6'), this.beacon, 0, 3.3);
    mesh(new THREE.CylinderGeometry(1.13, 1.32, 1.4, 12), material('#9b6b50'), this.beacon, 0, 3.7);
    const iron = material('#284650', { metalness: .65, roughness: .4 });
    mesh(new THREE.CylinderGeometry(2.05, 1.5, .25, 16), iron, this.beacon, 0, 6.5);
    mesh(new THREE.CylinderGeometry(1.75, 1.75, .1, 16, 1, true), iron, this.beacon, 0, 7.15);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; mesh(new THREE.CylinderGeometry(.035, .035, 1.3, 5), iron, this.beacon, Math.sin(a) * 1.7, 7.15, Math.cos(a) * 1.7); }
    const glow = material('#ffe6a6', { emissive: '#ffac41', emissiveIntensity: 2.2, roughness: .25 });
    mesh(new THREE.CylinderGeometry(.65, .65, 1.25, 12), glow, this.beacon, 0, 7.3);
    mesh(new THREE.ConeGeometry(2.05, 1.1, 12), iron, this.beacon, 0, 8.45);
    this.beaconLight = new THREE.PointLight('#ffb967', 65, 32, 1.5); this.beaconLight.position.set(0, 11.4, 0); scene.add(this.beaconLight);
    this.beams = new THREE.Group(); this.beams.position.set(0, 11.4, 0); scene.add(this.beams);
    const beamMat = new THREE.MeshBasicMaterial({ color: '#fff2bd', transparent: true, opacity: .045, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    for (const sign of [-1, 1]) { const b = mesh(new THREE.ConeGeometry(5.5, 52, 24, 1, true), beamMat, this.beams, sign * 26, 0, 0); b.rotation.z = sign * Math.PI / 2; }
    this.lamps = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, r = i % 2 ? 13 : 19, x = Math.sin(a) * r, z = Math.cos(a) * r, y = this.height(x, z);
      mesh(new THREE.CylinderGeometry(.05, .08, 1.8, 5), iron, scene, x, y + .9, z);
      mesh(new THREE.BoxGeometry(.27, .38, .27), glow, scene, x, y + 1.8, z);
      if(i%4===0){const l = new THREE.PointLight('#ffb45d', 5, 6, 2); l.position.set(x, y + 1.8, z); scene.add(l); this.lamps.push(l);}
    }
    const farMat = material('#3f6574', { flatShading: true });
    for (let i = 0; i < 30; i++) { const a = i * .24, r = 105 + rng() * 20; mesh(new THREE.ConeGeometry(9 + rng() * 8, 12 + rng() * 16, 4), farMat, scene, Math.sin(a) * r, 1, Math.cos(a) * r); }
    mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff1ca' }), scene, -58, 48, -90);
    const points = [];
    for (let i = 0; i < 170; i++) { const a = rng() * 6.283; points.push(Math.sin(a) * 140, 24 + rng() * 120, Math.cos(a) * 140); }
    const stars = new THREE.BufferGeometry(); stars.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#f5f2d8', size: .24 })));
  }
  height(x, z) { const r = Math.hypot(x, z); return r > 22 ? -.6 : .45 + Math.min(8, Math.floor((22 - r) / 2)) * .46; }
  move(position, dx, dz) {
    const x = position.x + dx, z = position.z + dz, r = Math.hypot(x, z);
    if (r <= 22 && r >= 2.65) { position.x = x; position.z = z; }
    else if (r < 2.65) { position.x = x / r * 2.66; position.z = z / r * 2.66; }
    else { position.x = x / r * 21.99; position.z = z / r * 21.99; }
  }
  update(time, tide) {
    this.water.position.y = tide.level;
    const p = this.water.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, Math.sin(x * .22 + time * .8) * .065 + Math.sin(z * .34 - time) * .055); }
    p.needsUpdate = true; this.water.geometry.computeVertexNormals();
    const shore = 22 - Math.max(0, (tide.level - .45) / .46 + 1) * 2;
    this.foam.children.forEach((f, i) => { const r = Math.max(5.7, shore) + i * .32 + Math.sin(time + i) * .12; f.scale.set(r, r, 1); f.position.y = tide.level + .1 + i * .01; });
    this.beams.rotation.y = time * .22; this.beaconLight.intensity = 65 + Math.sin(time * 3) * 4;
  }
}
