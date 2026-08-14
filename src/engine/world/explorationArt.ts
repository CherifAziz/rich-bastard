import Phaser from "phaser";
import { THEME, THEME_HEX } from "../../data/theme";
import {
  DANGER_ZONE,
  EXPLORATION_EAST_EXIT,
  EXPLORATION_EAST_SPAWN,
  EXPLORATION_HEIGHT,
  EXPLORATION_OBSTACLES,
  EXPLORATION_WALLS,
  EXPLORATION_WEST_EXIT,
  EXPLORATION_WEST_SPAWN,
  EXPLORATION_WIDTH,
} from "../../game/world/exploration";
import { DEPTH } from "../art/depth";
import {
  addBush,
  addGroundSpecks,
  addPath,
  addSignPost,
  addTree,
  dressObstacle,
  dressWalls,
} from "../art/props";
import { TEX, addTiledFloor, ensureWorldTextures } from "../art/textures";

const TRANSITION_WIDTH = 180;

export function drawExplorationWorld(scene: Phaser.Scene): void {
  ensureWorldTextures(scene);
  addTiledFloor(
    scene,
    EXPLORATION_WIDTH,
    EXPLORATION_HEIGHT,
    TEX.wildFloor,
    DEPTH.floor,
  );

  scene.add
    .tileSprite(
      DANGER_ZONE.x - TRANSITION_WIDTH / 2,
      EXPLORATION_HEIGHT / 2,
      TRANSITION_WIDTH,
      EXPLORATION_HEIGHT,
      TEX.dryFloor,
    )
    .setDepth(DEPTH.floorDetail);

  scene.add
    .tileSprite(
      DANGER_ZONE.x + DANGER_ZONE.width / 2,
      DANGER_ZONE.y + DANGER_ZONE.height / 2,
      DANGER_ZONE.width,
      DANGER_ZONE.height,
      TEX.dangerFloor,
    )
    .setDepth(DEPTH.floorDetail);

  scene.add
    .tileSprite(
      DANGER_ZONE.x + 50,
      EXPLORATION_HEIGHT / 2,
      100,
      EXPLORATION_HEIGHT,
      TEX.dryFloor,
    )
    .setAlpha(0.45)
    .setDepth(DEPTH.floorDetail);

  const fade = scene.add.graphics();
  fade.setDepth(DEPTH.floorDetail);
  for (let i = 0; i < 10; i++) {
    fade.fillStyle(THEME.dryGrass, 0.05 + i * 0.025);
    fade.fillRect(DANGER_ZONE.x - 50 + i * 10, 0, 12, EXPLORATION_HEIGHT);
  }

  dressWalls(scene, EXPLORATION_WALLS, TEX.earthWall);

  addPath(
    scene,
    [
      EXPLORATION_WEST_EXIT,
      EXPLORATION_WEST_SPAWN,
      { x: 520, y: 360 },
      { x: 900, y: 420 },
      { x: DANGER_ZONE.x - 20, y: 480 },
    ],
    18,
    THEME.wildDirt,
  );
  addPath(
    scene,
    [
      { x: DANGER_ZONE.x + 40, y: 500 },
      { x: 1580, y: 560 },
      { x: 1900, y: 900 },
      { x: 2100, y: 720 },
      EXPLORATION_EAST_SPAWN,
      EXPLORATION_EAST_EXIT,
    ],
    16,
    THEME.dangerGroundDark,
  );

  addGroundSpecks(
    scene,
    { width: EXPLORATION_WIDTH, height: EXPLORATION_HEIGHT, margin: 64 },
    21,
    THEME.wildGrassDark,
    42,
  );

  const safeTrees = [
    [120, 240],
    [340, 140],
    [640, 160],
    [860, 300],
    [1100, 180],
    [160, 760],
    [480, 1100],
    [900, 980],
    [1180, 700],
    [430, 430],
    [1020, 860],
  ];
  for (const [x, y] of safeTrees) {
    addTree(scene, x, y, { scale: 0.8 + ((x + y) % 5) * 0.07 });
  }

  const deadTrees = [
    [1360, 220],
    [1480, 700],
    [1720, 360],
    [2100, 480],
    [1880, 1200],
    [2300, 900],
    [1400, 1100],
    [2040, 300],
  ];
  for (const [x, y] of deadTrees) {
    addTree(scene, x, y, { dead: true, scale: 0.75 + (x % 4) * 0.05 });
  }

  addBush(scene, 400, 360);
  addBush(scene, 700, 700);
  addBush(scene, 1000, 500);
  addBush(scene, 250, 420);
  addBush(scene, 820, 240);
  addBush(scene, 1500, 260, true);
  addBush(scene, 2000, 640, true);
  addBush(scene, 1680, 980, true);
  addBush(scene, 1320, 500, true);

  addSignPost(scene, DANGER_ZONE.x + 36, 260, "DANGER", undefined, THEME_HEX.damage);
  addSignPost(scene, DANGER_ZONE.x + 36, 920, "DANGER", undefined, THEME_HEX.damage);
  addSignPost(scene, EXPLORATION_WEST_EXIT.x + 70, EXPLORATION_WEST_EXIT.y + 50, "BOURG");
  addSignPost(
    scene,
    EXPLORATION_EAST_EXIT.x - 80,
    EXPLORATION_EAST_EXIT.y - 70,
    "AVANT-POSTE",
  );

  for (const obstacle of EXPLORATION_OBSTACLES) {
    const kind =
      obstacle.x + obstacle.width / 2 >= DANGER_ZONE.x ? "danger" : "wild";
    dressObstacle(scene, obstacle, kind);
  }
}
