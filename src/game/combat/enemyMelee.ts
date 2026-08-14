import type { EnemyState, PendingEnemyAttack } from "../enemies/enemy";
import type { PlayerState } from "../player/player";
import { applyPlayerDamage } from "./playerHit";

export const ENEMY_WINDUP_MS = 300;
export const ENEMY_MELEE_HALF_WIDTH = 20;

export type EnemyAttackTelegraph = PendingEnemyAttack;

export type EnemyMeleeEvent =
  | { kind: "windup"; telegraph: EnemyAttackTelegraph }
  | { kind: "hit"; telegraph: EnemyAttackTelegraph; damage: number }
  | { kind: "miss"; telegraph: EnemyAttackTelegraph };

export function isPointInMeleeBox(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  range: number,
  halfWidth: number,
  x: number,
  y: number,
): boolean {
  const length = Math.hypot(dirX, dirY);
  if (length === 0) {
    return false;
  }

  const nx = dirX / length;
  const ny = dirY / length;
  const dx = x - originX;
  const dy = y - originY;
  const along = dx * nx + dy * ny;
  const side = -dx * ny + dy * nx;

  return along >= 0 && along <= range && Math.abs(side) <= halfWidth;
}

export function tickEnemyMelee(
  enemy: EnemyState,
  player: PlayerState,
  now: number,
): EnemyMeleeEvent | null {
  if (!enemy.alive) {
    enemy.pendingAttack = null;
    return null;
  }

  if (enemy.attackRange <= 0 || enemy.contactDamage <= 0) {
    return null;
  }

  if (enemy.pendingAttack) {
    if (now < enemy.pendingAttack.resolveAt) {
      return { kind: "windup", telegraph: enemy.pendingAttack };
    }

    const telegraph = enemy.pendingAttack;
    enemy.pendingAttack = null;
    enemy.lastAttackAt = now;

    const inside = isPointInMeleeBox(
      telegraph.originX,
      telegraph.originY,
      telegraph.dirX,
      telegraph.dirY,
      telegraph.range,
      telegraph.halfWidth,
      player.x,
      player.y,
    );

    if (!inside || player.hp <= 0) {
      return { kind: "miss", telegraph };
    }

    const damage = applyPlayerDamage(player, enemy.contactDamage, now);
    if (damage <= 0) {
      return { kind: "miss", telegraph };
    }

    return { kind: "hit", telegraph, damage };
  }

  if (player.hp <= 0 || now < enemy.stunnedUntil) {
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
  const playerRadius = Math.max(player.width, player.height) / 2;

  enemy.pendingAttack = {
    originX: enemy.x + dirX * (enemy.width / 2),
    originY: enemy.y + dirY * (enemy.height / 2),
    dirX,
    dirY,
    range: enemy.attackRange + playerRadius,
    halfWidth: ENEMY_MELEE_HALF_WIDTH + playerRadius,
    resolveAt: now + ENEMY_WINDUP_MS,
  };

  return { kind: "windup", telegraph: enemy.pendingAttack };
}
