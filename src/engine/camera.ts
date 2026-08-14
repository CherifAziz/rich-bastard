import Phaser from "phaser";

export const CAMERA_ZOOM = 1.18;

export function followPlayer(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
): void {
  scene.cameras.main.startFollow(target, true, 0.16, 0.16);
  scene.cameras.main.setZoom(CAMERA_ZOOM);
}
