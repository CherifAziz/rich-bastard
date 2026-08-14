import Phaser from "phaser";
import type { ZoneRect } from "../../game/world/geometry";
import { DEPTH } from "../art/depth";

export function createBlockers(
  scene: Phaser.Scene,
  walls: ZoneRect[],
  obstacles: ZoneRect[],
): Phaser.Physics.Arcade.StaticGroup {
  const blockers = scene.physics.add.staticGroup();

  for (const wall of walls) {
    addInvisibleBlocker(scene, blockers, wall);
  }

  for (const obstacle of obstacles) {
    addInvisibleBlocker(scene, blockers, obstacle);
  }

  blockers.refresh();
  return blockers;
}

function addInvisibleBlocker(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.StaticGroup,
  rect: ZoneRect,
): void {
  const blocker = scene.add.rectangle(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width,
    rect.height,
    0x000000,
    0,
  );
  blocker.setDepth(DEPTH.prop);
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
