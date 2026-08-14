import type { EnemyState } from "../enemies/enemy";
import { getEquippedWeapon } from "../player/player";
import type { PlayerState } from "../player/player";

export const MELEE_COOLDOWN_MS = 300;
export const MELEE_RANGE = 48;
export const MELEE_HALF_WIDTH = 22;
export const MELEE_SWING_MS = 110;
export const HIT_STUN_MS = 90;

export type MeleeHit = {
  enemy: EnemyState;
  damage: number;
  killed: boolean;
};

export type MeleeAttack = {
  originX: number;
  originY: number;
  dirX: number;
  dirY: number;
  range: number;
  halfWidth: number;
  hits: MeleeHit[];
};

export function canMeleeAttack(now: number, lastAttackAt: number): boolean {
  return now - lastAttackAt >= MELEE_COOLDOWN_MS;
}

export function applyDamage(
  enemy: EnemyState,
  damage: number,
  now: number,
): number {
  if (!enemy.alive || damage <= 0) {
    return 0;
  }

  const dealt = damage;
  enemy.hp = Math.max(0, enemy.hp - dealt);
  enemy.stunnedUntil = now + HIT_STUN_MS;

  if (enemy.hp <= 0) {
    enemy.alive = false;
  }

  return dealt;
}

export function isEnemyInMeleeRange(
  originX: number,
  originY: number,
  dirX: number,
  dirY: number,
  enemy: EnemyState,
  range: number,
  halfWidth: number,
): boolean {
  if (!enemy.alive) {
    return false;
  }

  const length = Math.hypot(dirX, dirY);
  if (length === 0) {
    return false;
  }

  const nx = dirX / length;
  const ny = dirY / length;
  const dx = enemy.x - originX;
  const dy = enemy.y - originY;
  const along = dx * nx + dy * ny;
  const side = -dx * ny + dy * nx;
  const radius = Math.max(enemy.width, enemy.height) / 2;

  return (
    along >= 0 &&
    along <= range + radius &&
    Math.abs(side) <= halfWidth + radius
  );
}

export function tryMeleeAttack(
  player: PlayerState,
  enemies: EnemyState[],
  aimX: number,
  aimY: number,
  now: number,
): MeleeAttack | null {
  if (!canMeleeAttack(now, player.lastAttackAt)) {
    return null;
  }

  let dirX = aimX - player.x;
  let dirY = aimY - player.y;

  if (Math.hypot(dirX, dirY) < 1) {
    dirX = player.facingX;
    dirY = player.facingY;
  }

  const length = Math.hypot(dirX, dirY);
  if (length === 0) {
    dirX = 1;
    dirY = 0;
  } else {
    dirX /= length;
    dirY /= length;
  }

  player.lastAttackAt = now;
  player.facingX = dirX;
  player.facingY = dirY;

  const originX = player.x + dirX * (player.width / 2);
  const originY = player.y + dirY * (player.height / 2);
  const hits: MeleeHit[] = [];

  for (const enemy of enemies) {
    if (
      !isEnemyInMeleeRange(
        originX,
        originY,
        dirX,
        dirY,
        enemy,
        MELEE_RANGE,
        MELEE_HALF_WIDTH,
      )
    ) {
      continue;
    }

    const damage = applyDamage(enemy, getEquippedWeapon(player).damage, now);
    if (damage > 0) {
      hits.push({ enemy, damage, killed: !enemy.alive });
    }
  }

  return {
    originX,
    originY,
    dirX,
    dirY,
    range: MELEE_RANGE,
    halfWidth: MELEE_HALF_WIDTH,
    hits,
  };
}
