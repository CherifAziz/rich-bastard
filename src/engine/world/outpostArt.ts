import Phaser from "phaser";
import { OUTPOST_MERCHANT } from "../../data/merchants";
import { THEME } from "../../data/theme";
import {
  OUTPOST_EXIT,
  OUTPOST_HEIGHT,
  OUTPOST_OBSTACLES,
  OUTPOST_SPAWN,
  OUTPOST_WALLS,
  OUTPOST_WIDTH,
} from "../../game/world/outpost";
import { DEPTH } from "../art/depth";
import {
  addBarrel,
  addCrate,
  addGroundSpecks,
  addPalisadeLine,
  addPath,
  addSignPost,
  addWoodPile,
  dressObstacle,
  dressWalls,
} from "../art/props";
import { TEX, addTiledFloor, ensureWorldTextures } from "../art/textures";

export function drawOutpostWorld(scene: Phaser.Scene): void {
  ensureWorldTextures(scene);
  addTiledFloor(scene, OUTPOST_WIDTH, OUTPOST_HEIGHT, TEX.dryFloor, DEPTH.floor);
  scene.add
    .rectangle(
      OUTPOST_WIDTH / 2,
      OUTPOST_HEIGHT / 2,
      OUTPOST_WIDTH,
      OUTPOST_HEIGHT,
      THEME.wildDirt,
      0.28,
    )
    .setDepth(DEPTH.floorDetail);
  dressWalls(scene, OUTPOST_WALLS, TEX.woodWall);

  addPalisadeLine(scene, { x: 70, y: 70 }, { x: OUTPOST_WIDTH - 70, y: 70 });
  addPalisadeLine(
    scene,
    { x: 70, y: OUTPOST_HEIGHT - 70 },
    { x: OUTPOST_WIDTH - 70, y: OUTPOST_HEIGHT - 70 },
  );
  addPalisadeLine(scene, { x: 70, y: 90 }, { x: 70, y: 250 });
  addPalisadeLine(scene, { x: 70, y: 400 }, { x: 70, y: OUTPOST_HEIGHT - 90 });
  addPalisadeLine(
    scene,
    { x: OUTPOST_WIDTH - 70, y: 90 },
    { x: OUTPOST_WIDTH - 70, y: OUTPOST_HEIGHT - 90 },
  );

  addPath(
    scene,
    [
      OUTPOST_EXIT,
      OUTPOST_SPAWN,
      { x: OUTPOST_MERCHANT.x - 40, y: OUTPOST_MERCHANT.y + 50 },
      { x: OUTPOST_MERCHANT.x, y: OUTPOST_MERCHANT.y + 40 },
    ],
    20,
    THEME.wildDirt,
  );

  addGroundSpecks(
    scene,
    { width: OUTPOST_WIDTH, height: OUTPOST_HEIGHT, margin: 56 },
    17,
    THEME.dangerGroundDark,
    28,
  );

  addSignPost(scene, 250, 180, "AVANT-POSTE");
  addCrate(scene, 430, 180);
  addCrate(scene, 448, 194);
  addCrate(scene, 620, 200);
  addBarrel(scene, 640, 210);
  addBarrel(scene, 200, 470);
  addWoodPile(scene, 800, 520);
  addCrate(scene, 840, 540);
  addCrate(scene, 180, 200);

  for (const obstacle of OUTPOST_OBSTACLES) {
    dressObstacle(scene, obstacle, "town");
  }
}
