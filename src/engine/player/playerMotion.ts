import Phaser from "phaser";
import {
  dashVelocity,
  isDashing,
  tryStartDash,
} from "../../game/player/dash";
import { PlayerAvatar } from "./PlayerAvatar";
import {
  readMoveAxis,
  type MovementKeys,
} from "../input/movementInput";

export function tickPlayerMotion(
  scene: Phaser.Scene,
  player: PlayerAvatar,
  moveKeys: MovementKeys,
  dashKey: Phaser.Input.Keyboard.Key,
  time: number,
  locked: boolean,
  wasDashing: boolean,
): boolean {
  const axis = readMoveAxis(moveKeys);
  const moving = axis.x !== 0 || axis.y !== 0;

  if (locked) {
    player.applyMoveInput(0, 0);
    player.syncState();
    player.tickVisual(time, false);
    if (wasDashing) {
      player.endDashVisual();
    }
    return false;
  }

  if (Phaser.Input.Keyboard.JustDown(dashKey)) {
    if (tryStartDash(player.state, axis.x, axis.y, time)) {
      player.flashDash(scene);
    }
  }

  const dashing = isDashing(player.state, time);
  if (wasDashing && !dashing) {
    player.endDashVisual();
  }

  if (dashing) {
    const velocity = dashVelocity(player.state);
    player.applyVelocity(velocity.x, velocity.y);
  } else if (time >= player.state.hitStunUntil) {
    player.applyMoveInput(axis.x, axis.y);
  }

  player.syncState();
  player.tickVisual(time, moving || dashing);
  return dashing;
}
