import * as THREE from 'three';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const gameWrap = document.getElementById('game-wrap');

// Hide the legacy 2D canvas and render with Three.js instead.
canvas.style.display = 'none';

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
const initialWidth = gameWrap?.clientWidth || window.innerWidth;
const initialHeight = gameWrap?.clientHeight || window.innerHeight;
renderer.setSize(initialWidth, initialHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setClearColor(0x1a120a);
renderer.domElement.id = 'three-canvas';
renderer.domElement.style.display = 'block';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.visibility = 'visible';
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.pointerEvents = 'none';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.backgroundColor = '#1a120a';

document.body.style.minHeight = '100vh';

if (gameWrap) {
  gameWrap.style.width = '100%';
  gameWrap.style.height = '100%';
  gameWrap.style.maxWidth = 'none';
  gameWrap.style.position = 'absolute';
  gameWrap.style.top = '0';
  gameWrap.style.left = '0';
  gameWrap.style.zIndex = '1';
  gameWrap.insertBefore(renderer.domElement, canvas);
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, initialWidth / initialHeight, 0.1, 100);
camera.position.set(0, 20, 20);
camera.lookAt(0, 0, 0);

const resizeRenderer = () => {
  const width = gameWrap?.clientWidth || window.innerWidth;
  const height = gameWrap?.clientHeight || window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

window.addEventListener('resize', resizeRenderer);

scene.add(new THREE.AmbientLight(0x404040));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const TILE_SIZE = 1;
const COLS = 80;
const ROWS = 60;

const materialPalette = {
  grass: new THREE.MeshToonMaterial({ color: 0x6aaa6a }),
  path: new THREE.MeshToonMaterial({ color: 0xc8a97a }),
  water: new THREE.MeshToonMaterial({ color: 0x5a8aaa }),
  wall: new THREE.MeshToonMaterial({ color: 0xe8b89a })
};

const geometries = {
  floor: new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
  block: new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE)
};
geometries.floor.rotateX(-Math.PI / 2);

function getPositionFromGrid(col: number, row: number) {
  return {
    x: (col - COLS / 2) * TILE_SIZE + TILE_SIZE / 2,
    y: 0,
    z: (row - ROWS / 2) * TILE_SIZE + TILE_SIZE / 2
  };
}

function build3DWorld(mapArray: number[][]) {
  const counts = { grass: 0, path: 0, water: 0, wall: 0 };
  const pathTiles = [1, 24];
  const waterTiles = [5, 22];
  const wallTiles = [2, 4, 6, 16];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tileId = mapArray[r][c];
      if (waterTiles.includes(tileId)) counts.water++;
      else if (pathTiles.includes(tileId)) counts.path++;
      else if (wallTiles.includes(tileId)) counts.wall++;
      else counts.grass++;
    }
  }

  const instancedMeshes = {
    grass: new THREE.InstancedMesh(geometries.floor, materialPalette.grass, counts.grass),
    path: new THREE.InstancedMesh(geometries.floor, materialPalette.path, counts.path),
    water: new THREE.InstancedMesh(geometries.floor, materialPalette.water, counts.water),
    wall: new THREE.InstancedMesh(geometries.block, materialPalette.wall, counts.wall)
  };

  const dummy = new THREE.Object3D();
  const indices = { grass: 0, path: 0, water: 0, wall: 0 };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tileId = mapArray[r][c];
      const pos = getPositionFromGrid(c, r);
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      if (waterTiles.includes(tileId)) {
        instancedMeshes.water.setMatrixAt(indices.water++, dummy.matrix);
      } else if (pathTiles.includes(tileId)) {
        instancedMeshes.path.setMatrixAt(indices.path++, dummy.matrix);
      } else if (wallTiles.includes(tileId)) {
        dummy.position.y = TILE_SIZE / 2;
        dummy.updateMatrix();
        instancedMeshes.wall.setMatrixAt(indices.wall++, dummy.matrix);
      } else {
        instancedMeshes.grass.setMatrixAt(indices.grass++, dummy.matrix);
      }
    }
  }

  Object.values(instancedMeshes).forEach(mesh => scene.add(mesh));
}

const playerMesh = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.35, 0.9, 4, 8),
  new THREE.MeshToonMaterial({ color: 0xe8d5a3 })
);
playerMesh.position.set(0, 0.5, 0);
scene.add(playerMesh);

let isMoving = false;
let walkTime = 0;
let targetRotationY = 0;
const CAMERA_SMOOTHNESS = 0.12;
const BOB_HEIGHT = 0.12;
const SWAY_ANGLE = 0.18;

function normalizePlayerPosition() {
  const player = (window as any).player;
  const TILE = (window as any).TILE || 16;
  const normalizedCol = player.x / TILE;
  const normalizedRow = player.y / TILE;
  const targetPos = getPositionFromGrid(normalizedCol, normalizedRow);
  playerMesh.position.x = targetPos.x;
  playerMesh.position.z = targetPos.z;
}

function updatePlayerDirection() {
  const keys = (window as any).keys || {};
  let dx = 0;
  let dz = 0;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) dz -= 1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) dz += 1;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
  if (dx !== 0 || dz !== 0) {
    targetRotationY = Math.atan2(dx, dz);
  }
  const currentRotation = playerMesh.rotation.y;
  let diff = targetRotationY - currentRotation;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  playerMesh.rotation.y += diff * 0.2;
}

function animatePlayer() {
  const player = (window as any).player;
  const prevX = playerMesh.position.x;
  const prevZ = playerMesh.position.z;
  normalizePlayerPosition();
  isMoving = Math.hypot(playerMesh.position.x - prevX, playerMesh.position.z - prevZ) > 0.001;

  if (isMoving) {
    walkTime += 0.2;
    playerMesh.position.y = 0.5 + Math.abs(Math.sin(walkTime)) * BOB_HEIGHT;
    playerMesh.rotation.z = Math.cos(walkTime) * SWAY_ANGLE;
  } else {
    walkTime = 0;
    playerMesh.position.y = THREE.MathUtils.lerp(playerMesh.position.y, 0.5, 0.2);
    playerMesh.rotation.z = THREE.MathUtils.lerp(playerMesh.rotation.z, 0, 0.2);
    playerMesh.rotation.x = THREE.MathUtils.lerp(playerMesh.rotation.x, 0, 0.2);
  }
}

function updateCamera() {
  const cameraTarget = new THREE.Vector3(playerMesh.position.x, 18, playerMesh.position.z + 12);
  camera.position.lerp(cameraTarget, CAMERA_SMOOTHNESS);
  camera.lookAt(playerMesh.position);
}

function render3D() {
  const player = (window as any).player;
  if (!player) {
    renderer.render(scene, camera);
    return;
  }

  updatePlayerDirection();
  animatePlayer();
  updateCamera();
  renderer.render(scene, camera);
}

window.draw = render3D;

if ((window as any).MAP) {
  build3DWorld((window as any).MAP);
}
