import type { EnemyDefinition } from "../../data/enemies";

export type EnemyState = {
  id: string;
  typeId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  contactDamage: number;
  aggroRange: number;
  stopRange: number;
  attackRange: number;
  attackCooldownMs: number;
  goldReward: number;
  lootItemId: string | null;
  lootQuantity: number;
  alive: boolean;
  rewarded: boolean;
  stunnedUntil: number;
  lastAttackAt: number;
};

export function createEnemy(
  definition: EnemyDefinition,
  id: string,
  x: number,
  y: number,
): EnemyState {
  return {
    id,
    typeId: definition.id,
    name: definition.name,
    x,
    y,
    width: definition.width,
    height: definition.height,
    hp: definition.hp,
    maxHp: definition.hp,
    speed: definition.speed,
    contactDamage: definition.contactDamage,
    aggroRange: definition.aggroRange,
    stopRange: definition.stopRange,
    attackRange: definition.attackRange,
    attackCooldownMs: definition.attackCooldownMs,
    goldReward: definition.goldReward,
    lootItemId: definition.lootItemId,
    lootQuantity: definition.lootQuantity,
    alive: true,
    rewarded: false,
    stunnedUntil: 0,
    lastAttackAt: -10000,
  };
}

export function chaseVelocity(
  enemy: EnemyState,
  playerX: number,
  playerY: number,
  now: number,
): { x: number; y: number } {
  if (!enemy.alive || now < enemy.stunnedUntil) {
    return { x: 0, y: 0 };
  }

  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const distance = Math.hypot(dx, dy);
  const stopAt = enemy.attackRange > 0 ? enemy.attackRange : enemy.stopRange;

  if (distance > enemy.aggroRange || distance <= stopAt) {
    return { x: 0, y: 0 };
  }

  return {
    x: (dx / distance) * enemy.speed,
    y: (dy / distance) * enemy.speed,
  };
}
