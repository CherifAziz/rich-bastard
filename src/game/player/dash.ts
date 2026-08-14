import type { PlayerState } from "./player";

export const DASH_DURATION_MS = 130;
export const DASH_SPEED = 650;
export const DASH_COOLDOWN_MS = 900;

export function isDashing(player: PlayerState, now: number): boolean {
  return now < player.dashUntil;
}

export function canDash(player: PlayerState, now: number): boolean {
  return player.hp > 0 && now >= player.dashCooldownUntil;
}

export function tryStartDash(
  player: PlayerState,
  dirX: number,
  dirY: number,
  now: number,
): boolean {
  if (!canDash(player, now)) {
    return false;
  }

  let x = dirX;
  let y = dirY;

  if (x === 0 && y === 0) {
    x = player.facingX;
    y = player.facingY;
  }

  const length = Math.hypot(x, y);
  if (length === 0) {
    x = 1;
    y = 0;
  } else {
    x /= length;
    y /= length;
  }

  player.dashDirX = x;
  player.dashDirY = y;
  player.facingX = x;
  player.facingY = y;
  player.dashUntil = now + DASH_DURATION_MS;
  player.dashCooldownUntil = now + DASH_COOLDOWN_MS;
  player.invulnerableUntil = Math.max(
    player.invulnerableUntil,
    player.dashUntil,
  );
  return true;
}

export function dashVelocity(player: PlayerState): { x: number; y: number } {
  return {
    x: player.dashDirX * DASH_SPEED,
    y: player.dashDirY * DASH_SPEED,
  };
}

export function dashHudText(player: PlayerState, now: number): string {
  if (isDashing(player, now)) {
    return "DASH";
  }

  if (canDash(player, now)) {
    return "DASH READY";
  }

  const remaining = Math.max(0, player.dashCooldownUntil - now) / 1000;
  return `DASH ${remaining.toFixed(1)}s`;
}
