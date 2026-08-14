import Phaser from "phaser";

export type MovementKeys = {
  up: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
};

export function createMovementKeys(scene: Phaser.Scene): MovementKeys {
  const keyboard = scene.input.keyboard;

  if (!keyboard) {
    throw new Error("Keyboard input is not available");
  }

  keyboard.addCapture([
    Phaser.Input.Keyboard.KeyCodes.Z,
    Phaser.Input.Keyboard.KeyCodes.Q,
    Phaser.Input.Keyboard.KeyCodes.S,
    Phaser.Input.Keyboard.KeyCodes.D,
    Phaser.Input.Keyboard.KeyCodes.SPACE,
  ]);

  return {
    up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
    down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    cursors: keyboard.createCursorKeys(),
  };
}

export function readMoveAxis(keys: MovementKeys): { x: number; y: number } {
  const left = keys.left.isDown || keys.cursors.left.isDown;
  const right = keys.right.isDown || keys.cursors.right.isDown;
  const up = keys.up.isDown || keys.cursors.up.isDown;
  const down = keys.down.isDown || keys.cursors.down.isDown;

  return {
    x: Number(right) - Number(left),
    y: Number(down) - Number(up),
  };
}
