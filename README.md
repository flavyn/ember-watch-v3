# Ember Watch

[![make.fun bounty](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![Ember Watch live rank](https://make.fun/badge/best-game-01/flavyn/ember-watch-v3/rank.svg)](https://make.fun/bounty/best-game-01)
[![Ember Watch live reward](https://make.fun/badge/best-game-01/flavyn/ember-watch-v3/reward.svg)](https://make.fun/bounty/best-game-01)

A keeper, an ember lance, and the last lighthouse on Blackthorn Rock. Survive eight waves of Hollow while the Atlantic swallows one circular terrace each wave. Written from scratch for the free [Make the best game bounty](https://make.fun/bounty/best-game-01).

The beacon begins at 100 integrity. If it breaks or the keeper dies, the watch ends. Water damages Hollow over time, so lure them into flooded paths with flares. Wading slows the keeper and prevents firing. Retreat uphill as the shore contracts from 22 metres to 6. Armored wardens resist body shots: aim for the exposed head.

## Play

Requires Node.js 22.18+ and desktop Chrome with WebGL2.

```powershell
node serve.ts
```

Open `http://localhost:8080` and click **Begin the watch**. The mouse locks to the game. Escape pauses and releases it; Resume recaptures it. All runtime resources are local files inside `game/` or data URIs. No CDN, downloads, fetch calls, external fonts, build, or installation. Serve the files over localhost; browser security prevents ES modules from loading through `file://`.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Walk; climb terraces automatically |
| Mouse | Aim |
| Left mouse, hold | Fire ember lance |
| R | Vent heat quickly; cannot fire while venting |
| Q | Flare: lure nearby Hollow for seven seconds |
| Ctrl / C, hold | Crouch: slower movement, tighter spread |
| Esc | Pause |

Lance heat locks firing at 100%; vent or cool below 28%. Each head hit deals 2.6 times normal damage; armor reduces body damage to 20%. Kills earn salvage; between waves install damage, cooling, or repair upgrades, or save salvage for later. Two flares replenish per wave, up to five. The final wave wins when all Hollow are gone.

## Capture & reproduce

`shots.json` lists four frozen scenes. Each uses `?shot=start|play|upgrade|end&seed=19`, a fixed simulation time of 36 seconds, live scene objects, and a readiness flag set after rendering: `window.__shotReady`. Capture at 1280×720 as JPEG. No gameplay clock advances during capture. `?seed=your-seed` controls procedural terrain accents, enemy spawns, and weapon spread; the game simulation advances at a fixed 1/60 second step.

```powershell
$env:MAKEFUN_OUTPUT_DIR = 'out'
node main.ts
node main.ts
```

The entry copies `game/` and `screenshots/` into the output directory (default `/output`) and builds `dossier.json` using the unchanged make.fun vendor utility. No timestamps or generated identifiers enter the output. Screenshot files ship with the entry.

## Source map

`main.js` owns bootstrap, fixed steps, and hit resolution. `world.js` owns rock geometry, paths, lighting, sea rendering, and collision. `player.js` owns movement and camera. `input.js` owns keyboard, mouse, and pointer lock. `hollow.js` pools enemies and resolves body/head intersections. `weapon.js` owns heat, vent, spread, recoil, tracer and flare effects. `rounds.js` owns wave ramps, salvage, upgrades and outcomes. `tide.js` owns the sea level, submerged paths, and water damage. `hud.js` only writes text when it changes. `audio.js` synthesizes every sound with WebAudio. `shots.js` composes the four deterministic screenshots; `rng.js` supplies seeded streams.

All authored geometry, gameplay, styles, and sound synthesis were created for this entry. The sole runtime dependency is the supplied local three.js distribution; its license remains in `game/vendor/three/LICENSE`.

## Verification

`qa-results.json` records 16 browser simulation checks, including an eight-wave victory using the actual hitscan pipeline (112 kills), beacon destruction, keeper death, and restart. The automated victory test positions and aims the keeper; it validates game logic rather than measuring human difficulty. `shot-verification.json` records byte-identical repeat captures for all four scenes.

For reproducible browser QA, start `node serve.ts --port 8083` and launch an isolated Chrome debugging session. For example, in PowerShell:

```powershell
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
Start-Process $chrome -WindowStyle Hidden -ArgumentList '--headless=new', '--no-first-run', "--user-data-dir=$env:TEMP\ember-watch-qa", '--remote-debugging-port=9334', 'about:blank'
node tools/verify.mjs
node tools/chrome-cdp.mjs capture
powershell -NoProfile -ExecutionPolicy Bypass -File tools/measure-shots.ps1
```

The scripts use Node's built-in WebSocket/CDP support and Windows System.Drawing. They require no installed packages. On a computer without an available GPU, Chrome can render with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Capture uses a 1280×720 viewport, JPEG quality 87, fixed seed 19, and waits for the game's readiness signal. The live-input check also exercised Chrome pointer lock, keyboard movement/crouch/flare/pause, mouse aiming, and firing.
