import type { EnemyState } from "../enemies/enemy";
import type { PlayerState } from "../player/player";
import { applyPlayerDamage } from "./playerHit";

export type EnemyMeleeAttack = {
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  range: number;
  damage: number;
};

export function tryEnemyMeleeAttack(
  enemy: EnemyState,
  player: PlayerState,
  now: number,
): EnemyMeleeAttack | null {
  if (!enemy.alive || player.hp <= 0) {
    return null;
  }

  if (enemy.attackRange <= 0 || enemy.contactDamage <= 0) {
    return null;
  }

  if (now < enemy.stunnedUntil) {
    return null;
  }

  if (now - enemy.lastAttackAt < enemy.attackCooldownMs) {
    return null;
  }

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distance = Math.hypot(dx, dy);

  if (distance > enemy.attackRange) {
    return null;
  }

  const length = distance || 1;
  const dirX = dx / length;
  const dirY = dy / length;

  enemy.lastAttackAt = now;

  return {
    originX: enemy.x + dirX * (enemy.width / 2),
    originY: enemy.y + dirY * (enemy.height / 2),
    dirX,
    dirY,
    range: enemy.attackRange,
    damage: applyPlayerDamage(player, enemy.contactDamage, now),
  };
}
