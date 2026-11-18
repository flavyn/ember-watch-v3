// Explicit frozen tableaux built from live game objects, never external artwork.
export function setupShot(g, name) {
  g.time = 36; g.tide.reset(); g.hollows.reset(); g.weapon.reset(); g.rounds.reset();
  g.state = 'title';
  if (name === 'play') {
    g.state='play'; g.rounds.wave=4; g.rounds.beacon=84; g.rounds.salvage=12;g.rounds.kills=27;g.rounds.pending=5;
    g.tide.rise(4);g.tide.level=g.tide.target;
    g.player.position.set(9,g.world.height(9,8)+1.8,8);g.player.yaw=.3;g.player.pitch=.08;g.player.sync();
    [[7.1,1.5,true],[11,-3,false],[4.8,-5,false],[15,-2,true],[-5,-7,false],[14.5,6,false]].forEach(([x,z,a])=>g.hollows.spawn(x,z,a,4));
    g.hollows.active.forEach(h=>h.group.rotation.y=Math.atan2(g.player.position.x-h.position.x,g.player.position.z-h.position.z));
    g.weapon.heat=63;g.weapon.shots=58;g.weapon.hits=43;g.weapon.headshots=16;
    g.weapon.flare(g.player,g.world);g.weapon.flash=.04;g.weapon.update(0,g.time,g.player);
    const target=g.hollows.active[0];g.hollows.damage(target,6,false,'lance');
    g.weapon.trace(g.player.position.clone(),target.position.clone().add({x:0,y:1.4,z:0}),true);
    g.hud.plateTime=100;g.hud.hitTime=100;g.hud.message('TIDE IV · THE OUTER FOUR PATHS ARE UNDER WATER',100);
  } else if (name === 'upgrade') {
    g.state='upgrade';g.rounds.wave=4;g.rounds.cleared=4;g.rounds.salvage=14;g.rounds.beacon=76;g.tide.rise(4);g.tide.level=g.tide.target;
  } else if (name === 'end') {
    g.state='end';g.rounds.wave=8;g.rounds.cleared=8;g.rounds.kills=112;g.rounds.tideKills=17;g.rounds.score=26450;g.rounds.result='DAWN HELD';
    g.weapon.shots=288;g.weapon.hits=219;g.weapon.headshots=54;g.tide.rise(8);g.tide.level=g.tide.target;
  }
  g.hud.screen(g.state,g);g.hud.update(0,g);g.weapon.model.visible=name==='play';
  g.world.update(g.time,g.tide);
  if(name!=='play') g.scenicCamera();
}
