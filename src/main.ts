import * as THREE from 'three';

// ════════════════════════════════════════════════════════════════════════════
//  main.ts — Three.js 3D renderer for Dewdrop Valley
//  Hooks into the legacy 2D game loop by overriding window.draw.
//
//  FIX HISTORY
//  Step 5: Tightened camera offsets.
//  Step 6: Added window resize listener.
//  Step 7: Resolved game-wrap CSS conflicts; read clientWidth from gameWrap.
//  Step 8 (current):
//    • Fixed renderer-size-zero bug (game-wrap is display:none on load,
//      so clientWidth/Height === 0 → must fall back to window.inner*).
//    • Expanded tile categorisation from 4 → 25+ types with correct colors.
//    • Extracted geometry cache so BoxGeometry objects are never duplicated.
//    • Added beginGame hook so 3D world rebuilds cleanly on restart.
//    • Renderer canvas fixed-positioned behind DOM UI (z-index: -1).
// ════════════════════════════════════════════════════════════════════════════

// ── DOM refs ────────────────────────────────────────────────────────────────
const canvas   = document.getElementById('canvas') as HTMLCanvasElement | null;
const gameWrap = document.getElementById('game-wrap') as HTMLDivElement | null;
const loadingScreen = document.getElementById('loading-screen') as HTMLDivElement | null;

function showLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.style.display = 'flex';
  loadingScreen.classList.remove('fade-out');
}

function hideLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.classList.add('fade-out');
  setTimeout(() => {
    if (loadingScreen.parentElement) loadingScreen.parentElement.removeChild(loadingScreen);
  }, 500);
}

// Hide legacy 2D canvas — Three.js owns rendering from here on.
if (canvas) canvas.style.display = 'none';

// ── Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x1a120a);
renderer.shadowMap.enabled = false;   // toon shading; no shadows needed

// game-wrap starts with display:none, so clientWidth === 0.
// Always use window dimensions as the source of truth for initial size.
function viewSize(): { w: number; h: number } {
  return { w: window.innerWidth, h: window.innerHeight };
}
const { w: initW, h: initH } = viewSize();
renderer.setSize(initW, initH);

// ── Attach canvas behind DOM UI ──────────────────────────────────────────────
Object.assign(renderer.domElement.style, {
  position:      'fixed',
  inset:         '0',
  width:         '100%',
  height:        '100%',
  zIndex:        '0',       // Three.js canvas sits behind game-wrap (z=1)
  pointerEvents: 'none',
  display:       'block',
});
renderer.domElement.id = 'three-canvas';
document.body.appendChild(renderer.domElement);

// Ensure game-wrap is a transparent full-screen overlay over the 3D canvas.
if (gameWrap) {
  Object.assign(gameWrap.style, {
    position:   'fixed',
    inset:      '0',
    width:      '100%',
    height:     '100%',
    maxWidth:   'none',
    maxHeight:  'none',
    background: 'transparent',
    zIndex:     '1',
  });
}

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a120a);
// Atmospheric fog — gives depth without any expensive effects
scene.fog = new THREE.FogExp2(0x1a120a, 0.014);

// ── Lighting ──────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x605060, 0.9));
const sun = new THREE.DirectionalLight(0xffe8c8, 1.3);
sun.position.set(20, 40, 20);
scene.add(sun);

// ── Camera ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(55, initW / initH, 0.1, 120);
// Initial position will be updated immediately in the first render3D() call
camera.position.set(0, 16, 14);

// ── Resize handler ───────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const { w, h } = viewSize();
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ════════════════════════════════════════════════════════════════════════════
//  TILE DEFINITIONS
//  Full map of the 26 tile IDs used by the 2D game (from drawTile / buildMap).
//
//  Tile IDs:
//    0  grass          1  path          2  tree (deciduous)
//    3  house-A        4  well          5  water/sea
//    6  fence          7  house-B       8  house-P
//    9  flower         10 sign          11 forest floor
//    12 mountain base  13 snow          14 sand
//    15 pine tree      16 ruins         17 farm soil
//    18 crop           19 bridge        20 house-C
//    21 cottage        22 lake          23 mountain flower
//    24 mountain path  25 mountain grass
//
//  Color values match the P palette in index.html exactly.
// ════════════════════════════════════════════════════════════════════════════

type GeoType = 'floor' | 'water' | 'raised' | 'box';

interface TileDef {
  geo:    GeoType;
  color:  number;
  /** For 'box' type: [width, height, depth] */
  size?:  [number, number, number];
}

const TILE_DEFS: Record<number, TileDef> = {
  // ── Ground / floor tiles ─────────────────────────────────────────────────
  0:  { geo: 'floor',  color: 0x6aaa6a },          // grass
  1:  { geo: 'floor',  color: 0xc8a97a },          // path / road
  11: { geo: 'floor',  color: 0x5a9a5a },          // forest floor (dark grass)
  12: { geo: 'floor',  color: 0x8a8a8a },          // mountain base
  13: { geo: 'floor',  color: 0xe8e8f0 },          // snow
  14: { geo: 'floor',  color: 0xd4c090 },          // sand
  17: { geo: 'floor',  color: 0x8a6040 },          // farm soil
  19: { geo: 'floor',  color: 0xa08050 },          // bridge planks
  24: { geo: 'floor',  color: 0xb09878 },          // mountain path
  25: { geo: 'floor',  color: 0x4a8a4a },          // mountain grass
  // ── Water tiles (slightly sunken) ─────────────────────────────────────────
  5:  { geo: 'water',  color: 0x5a8aaa },          // sea / ocean
  22: { geo: 'water',  color: 0x7aaaca },          // lake
  // ── Raised flat tiles (crops, flowers) ───────────────────────────────────
  9:  { geo: 'raised', color: 0xe88a6a },          // flower (warm orange)
  18: { geo: 'raised', color: 0x90c840 },          // crop row (bright green)
  23: { geo: 'raised', color: 0x6ae8c8 },          // mountain flower (teal)
  // ── 3-D block tiles ───────────────────────────────────────────────────────
  2:  { geo: 'box',    color: 0x3a6a3a, size: [0.65, 2.0, 0.65] },  // tree
  15: { geo: 'box',    color: 0x2a5a2a, size: [0.55, 2.5, 0.55] },  // pine
  3:  { geo: 'box',    color: 0xe8b89a, size: [1.0,  1.4, 1.0 ] },  // house-A (terracotta)
  7:  { geo: 'box',    color: 0xb8d898, size: [1.0,  1.4, 1.0 ] },  // house-B (sage green)
  8:  { geo: 'box',    color: 0xd4b89a, size: [1.0,  1.4, 1.0 ] },  // house-P (earthy)
  20: { geo: 'box',    color: 0xd8c8a8, size: [1.0,  1.4, 1.0 ] },  // house-C (cream)
  21: { geo: 'box',    color: 0xc8d8e8, size: [1.0,  1.4, 1.0 ] },  // cottage (light blue)
  4:  { geo: 'box',    color: 0x7a5a3a, size: [0.7,  0.9, 0.7 ] },  // well/fountain
  6:  { geo: 'box',    color: 0x8a6a3a, size: [1.0,  0.4, 0.25] },  // fence
  10: { geo: 'box',    color: 0xa87a4a, size: [0.65, 0.7, 0.15] },  // sign post
  16: { geo: 'box',    color: 0x8a7a6a, size: [1.0,  0.45, 1.0] },  // ruins
};

// ── Geometry cache — never create duplicate BufferGeometry objects ──────────
const _geoCache = new Map<string, THREE.BufferGeometry>();

function getBoxGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const k = `${w}:${h}:${d}`;
  if (!_geoCache.has(k)) _geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return _geoCache.get(k)!;
}

// Floor/raised planes — shared across all instances of the same type
const _floorGeo = new THREE.PlaneGeometry(1, 1);
_floorGeo.rotateX(-Math.PI / 2);

const _waterGeo = new THREE.PlaneGeometry(1, 1);
_waterGeo.rotateX(-Math.PI / 2);

const _raisedGeo = new THREE.PlaneGeometry(1, 1);
_raisedGeo.rotateX(-Math.PI / 2);

// ── Grid → world-space conversion ────────────────────────────────────────────
function tileXZ(col: number, row: number, COLS = 80, ROWS = 60) {
  return {
    x: (col - COLS / 2) + 0.5,
    z: (row - ROWS / 2) + 0.5,
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  BUILD 3D WORLD
//  Creates one InstancedMesh per unique tile ID present in the map.
//  Each mesh is added to `scene` and stored in `tileMeshes` so it can be
//  cleared and rebuilt on game restart.
// ════════════════════════════════════════════════════════════════════════════
const tileMeshes: THREE.InstancedMesh[] = [];
const _dummy = new THREE.Object3D();

function clearTileMeshes() {
  tileMeshes.forEach(m => scene.remove(m));
  tileMeshes.length = 0;
}

function build3DWorld(mapArray: number[][]) {
  clearTileMeshes();

  const ROWS = mapArray.length;
  const COLS = mapArray[0]?.length ?? 0;

  // Count how many instances each tile ID needs
  const counts = new Map<number, number>();
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t = mapArray[r][c];
      if (TILE_DEFS[t]) counts.set(t, (counts.get(t) ?? 0) + 1);
    }

  // Create one InstancedMesh per tile ID
  const meshMap = new Map<number, { im: THREE.InstancedMesh; idx: number }>();

  counts.forEach((count, tileId) => {
    const def = TILE_DEFS[tileId];
    const mat = new THREE.MeshToonMaterial({ color: def.color });

    let geo: THREE.BufferGeometry;
    switch (def.geo) {
      case 'floor':  geo = _floorGeo;  break;
      case 'water':  geo = _waterGeo;  break;
      case 'raised': geo = _raisedGeo; break;
      case 'box': {
        const [w, h, d] = def.size!;
        geo = getBoxGeo(w, h, d);
        break;
      }
    }

    const im = new THREE.InstancedMesh(geo, mat, count);
    im.frustumCulled = false;     // small world — culling adds CPU overhead for no gain
    meshMap.set(tileId, { im, idx: 0 });
    tileMeshes.push(im);
    scene.add(im);
  });

  // Place each instance
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tileId = mapArray[r][c];
      const entry  = meshMap.get(tileId);
      if (!entry) continue;

      const def = TILE_DEFS[tileId];
      const { x, z } = tileXZ(c, r, COLS, ROWS);

      let y = 0;
      switch (def.geo) {
        case 'water':  y = -0.08; break;
        case 'raised': y =  0.06; break;
        case 'box': {
          const [, h] = def.size!;
          y = h / 2;              // BoxGeometry is centred; lift so base sits on ground
          break;
        }
      }

      _dummy.position.set(x, y, z);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      entry.im.setMatrixAt(entry.idx++, _dummy.matrix);
    }
  }

  meshMap.forEach(({ im }) => { im.instanceMatrix.needsUpdate = true; });
}

// ════════════════════════════════════════════════════════════════════════════
//  PLAYER MESH
// ════════════════════════════════════════════════════════════════════════════
const playerMesh = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.35, 0.7, 4, 8),
  new THREE.MeshToonMaterial({ color: 0xe8d5a3 })
);
playerMesh.position.y = 0.7;
scene.add(playerMesh);

let isMoving     = false;
let walkTime     = 0;
let targetRotY   = 0;

const LERP_CAM   = 0.12;
const BOB        = 0.10;
const SWAY       = 0.14;

// Camera sits behind and above the player
const CAM_OFFSET = { x: 0, y: 14, z: 10 };

function syncPlayerPosition() {
  const g    = window as any;
  const p    = g.player;
  const TILE = g.TILE ?? 16;
  const COLS = g.COLS ?? 80;
  const ROWS = g.ROWS ?? 60;
  if (!p) return;

  const col = p.x / TILE;
  const row = p.y / TILE;
  const { x, z } = tileXZ(col, row, COLS, ROWS);

  const prevX = playerMesh.position.x;
  const prevZ = playerMesh.position.z;
  playerMesh.position.x = x;
  playerMesh.position.z = z;
  isMoving = Math.hypot(x - prevX, z - prevZ) > 0.001;
}

function animatePlayer() {
  const keys: Record<string, boolean> = (window as any).keys ?? {};
  let dx = 0, dz = 0;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dz -= 1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dz += 1;

  if (dx || dz) targetRotY = Math.atan2(dx, dz);

  // Smooth rotation towards movement direction
  let diff = targetRotY - playerMesh.rotation.y;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  playerMesh.rotation.y += diff * 0.18;

  if (isMoving) {
    walkTime += 0.18;
    playerMesh.position.y = 0.7 + Math.abs(Math.sin(walkTime)) * BOB;
    playerMesh.rotation.z = Math.cos(walkTime) * SWAY;
  } else {
    walkTime = 0;
    playerMesh.position.y = THREE.MathUtils.lerp(playerMesh.position.y, 0.7, 0.15);
    playerMesh.rotation.z = THREE.MathUtils.lerp(playerMesh.rotation.z, 0, 0.15);
  }
}

function updateCamera() {
  const target = new THREE.Vector3(
    playerMesh.position.x + CAM_OFFSET.x,
    CAM_OFFSET.y,
    playerMesh.position.z + CAM_OFFSET.z
  );
  camera.position.lerp(target, LERP_CAM);
  camera.lookAt(playerMesh.position.x, 0, playerMesh.position.z);
}

// ════════════════════════════════════════════════════════════════════════════
//  RENDER FUNCTION — replaces the 2D game's draw()
// ════════════════════════════════════════════════════════════════════════════
function render3D() {
  const g = window as any;
  if (!g.player) {
    renderer.render(scene, camera);
    return;
  }
  syncPlayerPosition();
  animatePlayer();
  updateCamera();
  renderer.render(scene, camera);
}

// Override the 2D game's global draw() function.
// The 2D loop is:  function loop() { update(); draw(); requestAnimationFrame(loop); }
// By setting window.draw here, "draw" resolves to render3D on the next tick.
(window as any).draw = render3D;

// ════════════════════════════════════════════════════════════════════════════
//  INITIALISATION — build world & hook into beginGame for restart support
// ════════════════════════════════════════════════════════════════════════════

// MAP is populated synchronously by the inline <script> before this ES module
// runs (modules are deferred), so MAP is already complete here.
const initialMap = (window as any).MAP as number[][] | undefined;
if (initialMap?.length) {
  build3DWorld(initialMap);
  requestAnimationFrame(() => {
    render3D();
    hideLoadingScreen();
  });
} else {
  requestAnimationFrame(hideLoadingScreen);
}

// Wrap beginGame so that the 3D world is rebuilt cleanly on every new game
// (including restarts, where buildMap() may have re-randomised the forest).
const _origBeginGame = (window as any).beginGame as ((...a: unknown[]) => void) | undefined;
if (typeof _origBeginGame === 'function') {
  (window as any).beginGame = function (...args: unknown[]) {
    _origBeginGame.apply(window, args);
    const map = (window as any).MAP as number[][] | undefined;
    if (map?.length) build3DWorld(map);
  };
}