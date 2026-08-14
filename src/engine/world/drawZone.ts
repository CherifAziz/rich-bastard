import Phaser from "phaser";
import type { ZoneRect } from "../../game/world/geometry";

const GRID_COLOR = 0xffffff;
const WALL_COLOR = 0x1c1c26;
const OBSTACLE_COLOR = 0x4a4558;

export function drawFloor(
  scene: Phaser.Scene,
  width: number,
  height: number,
  color: number,
): void {
  scene.add.rectangle(width / 2, height / 2, width, height, color).setDepth(0);

  const grid = scene.add.graphics();
  grid.setDepth(1);
  grid.lineStyle(1, GRID_COLOR, 0.06);

  for (let x = 0; x <= width; x += 64) {
    grid.lineBetween(x, 0, x, height);
  }

  for (let y = 0; y <= height; y += 64) {
    grid.lineBetween(0, y, width, y);
  }
}

export function createBlockers(
  scene: Phaser.Scene,
  walls: ZoneRect[],
  obstacles: ZoneRect[],
): Phaser.Physics.Arcade.StaticGroup {
  const blockers = scene.physics.add.staticGroup();

  for (const wall of walls) {
    addBlocker(scene, blockers, wall, WALL_COLOR);
  }

  for (const obstacle of obstacles) {
    addBlocker(scene, blockers, obstacle, OBSTACLE_COLOR);
  }

  blockers.refresh();
  return blockers;
}

function addBlocker(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  rect: ZoneRect,
  color: number,
): void {
  const blocker = scene.add.rectangle(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width,
    rect.height,
    color,
  );
  blocker.setDepth(5);
  group.add(blocker);
}

export function createActionKeys(scene: Phaser.Scene): {
  interactKey: Phaser.Input.Keyboard.Key;
  dashKey: Phaser.Input.Keyboard.Key;
} {
  const keyboard = scene.input.keyboard;
  if (!keyboard) {
    throw new Error("Keyboard input is not available");
  }

  keyboard.addCapture([
    Phaser.Input.Keyboard.KeyCodes.E,
    Phaser.Input.Keyboard.KeyCodes.SPACE,
  ]);

  return {
    interactKey: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    dashKey: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
  };
}
