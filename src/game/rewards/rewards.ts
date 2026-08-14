import { ITEM_BY_ID } from "../../data/items";
import type { EnemyState } from "../enemies/enemy";
import type { PlayerState } from "../player/player";

export type ItemReward = {
  id: string;
  name: string;
  quantity: number;
};

export type GroundLoot = {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  x: number;
  y: number;
  collected: boolean;
};

export type KillReward = {
  gold: number;
  groundLoot: ItemReward[];
};

export function grantKillReward(
  player: PlayerState,
  enemy: EnemyState,
): KillReward | null {
  if (enemy.alive || enemy.rewarded) {
    return null;
  }

  enemy.rewarded = true;
  player.gold += enemy.goldReward;

  const groundLoot: ItemReward[] = [];

  if (enemy.lootItemId && enemy.lootQuantity > 0) {
    const item = ITEM_BY_ID[enemy.lootItemId];

    if (item) {
      groundLoot.push({
        id: item.id,
        name: item.name,
        quantity: enemy.lootQuantity,
      });
    }
  }

  return {
    gold: enemy.goldReward,
    groundLoot,
  };
}

export function lootSpawnPosition(
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
): { x: number; y: number } {
  const dx = enemyX - playerX;
  const dy = enemyY - playerY;
  const length = Math.hypot(dx, dy);

  if (length < 1) {
    return { x: enemyX + 18, y: enemyY + 10 };
  }

  return {
    x: enemyX + (dx / length) * 22,
    y: enemyY + (dy / length) * 22,
  };
}

export function createGroundLoot(
  id: string,
  item: ItemReward,
  x: number,
  y: number,
): GroundLoot {
  return {
    id,
    itemId: item.id,
    name: item.name,
    quantity: item.quantity,
    x,
    y,
    collected: false,
  };
}
