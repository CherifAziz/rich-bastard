import type { PlayerState } from "../player/player";

export const PLAYER_IFRAME_MS = 400;

export function applyPlayerDamage(
  player: PlayerState,
  damage: number,
  now: number,
): number {
  if (player.hp <= 0 || damage <= 0) {
    return 0;
  }

  if (now < player.invulnerableUntil) {
    return 0;
  }

  const dealt = damage;
  player.hp = Math.max(0, player.hp - dealt);
  player.invulnerableUntil = now + PLAYER_IFRAME_MS;
  return dealt;
}
