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
  goldReward: number;
  lootItemId: string | null;
  lootQuantity: number;
  alive: boolean;
  rewarded: boolean;
  stunnedUntil: number;
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
    goldReward: definition.goldReward,
    lootItemId: definition.lootItemId,
    lootQuantity: definition.lootQuantity,
    alive: true,
    rewarded: false,
    stunnedUntil: 0,
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

  if (distance > enemy.aggroRange || distance <= enemy.stopRange) {
    return { x: 0, y: 0 };
  }

  return {
    x: (dx / distance) * enemy.speed,
    y: (dy / distance) * enemy.speed,
  };
}
