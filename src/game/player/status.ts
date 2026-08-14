import type { PlayerState } from "./player";

export function restoreHealth(player: PlayerState): void {
  player.hp = player.maxHp;
}

export function clearCombatStatus(player: PlayerState): void {
  player.invulnerableUntil = 0;
  player.dashUntil = 0;
  player.dashCooldownUntil = 0;
  player.hitStunUntil = 0;
  player.lastAttackAt = -1000;
}

export function preparePlayerForScene(
  player: PlayerState,
  x: number,
  y: number,
): void {
  restoreHealth(player);
  clearCombatStatus(player);
  player.x = x;
  player.y = y;
}