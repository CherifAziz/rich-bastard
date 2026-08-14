import Phaser from "phaser";
import { THEME } from "../../data/theme";
import {
  TOWN_HEIGHT,
  TOWN_OBSTACLES,
  TOWN_SPAWN,
  TOWN_WALLS,
  TOWN_WIDTH,
  TOWN_EXIT,
} from "../../game/world/town";
import { TOWN_MERCHANT } from "../../data/merchants";
import { DEPTH } from "../art/depth";
import {
  addBarrel,
  addBench,
  addBuildingFacade,
  addBush,
  addCrate,
  addGroundSpecks,
  addPath,
  addPot,
  addSignPost,
  addTree,
  addWoodPile,
  dressObstacle,
  dressWalls,
} from "../art/props";
import { TEX, addTiledFloor, ensureWorldTextures } from "../art/textures";

export function drawTownWorld(scene: Phaser.Scene): void {
  ensureWorldTextures(scene);
  addTiledFloor(scene, TOWN_WIDTH, TOWN_HEIGHT, TEX.townFloor, DEPTH.floor);
  dressWalls(scene, TOWN_WALLS, TEX.stoneWall);

  addPath(
    scene,
    [
      TOWN_SPAWN,
      { x: 420, y: 400 },
      { x: TOWN_MERCHANT.x + 40, y: TOWN_MERCHANT.y + 40 },
    ],
    22,
    THEME.townPath,
  );
  addPath(
    scene,
    [
      { x: 420, y: 400 },
      { x: 780, y: 400 },
      TOWN_EXIT,
      { x: TOWN_WIDTH - 24, y: TOWN_EXIT.y },
    ],
    20,
    THEME.townPath,
  );

  addGroundSpecks(
    scene,
    { width: TOWN_WIDTH, height: TOWN_HEIGHT, margin: 56 },
    9,
    THEME.townWoodDark,
    36,
  );

  addBuildingFacade(scene, 220, 52, 170, 56);
  addBuildingFacade(scene, 470, 52, 150, 56);
  addBuildingFacade(scene, 760, 52, 180, 56);
  addBuildingFacade(scene, 1040, 52, 140, 56);

  addTree(scene, 110, 120, { scale: 0.85 });
  addTree(scene, 980, 140, { scale: 0.7 });
  addTree(scene, 160, 700, { scale: 0.9 });
  addTree(scene, 1080, 680, { scale: 0.75 });
  addBush(scene, 500, 120);
  addBush(scene, 900, 700);
  addBush(scene, 240, 640);
  addCrate(scene, 330, 200);
  addCrate(scene, 348, 214);
  addBarrel(scene, 200, 220);
  addBarrel(scene, 218, 228);
  addBarrel(scene, 1080, 340);
  addSignPost(scene, 430, 300, "BOURG");
  addBench(scene, 500, 430);
  addBench(scene, 860, 470);
  addPot(scene, 150, 130);
  addPot(scene, 300, 130);
  addPot(scene, 620, 130);
  addPot(scene, 880, 130);
  addWoodPile(scene, 1000, 560);
  addCrate(scene, 1040, 580);
  addBarrel(scene, 120, 500);
  addBarrel(scene, 138, 508);
  addBush(scene, 640, 680);
  addBush(scene, 1100, 240);

  for (const obstacle of TOWN_OBSTACLES) {
    dressObstacle(scene, obstacle, "town");
  }
}
