import { ITEM_BY_ID } from "../../data/items";
import type { EnemyState } from "../enemies/enemy";
import type { PlayerState } from "../player/player";

export type ItemReward = {
  id: string;
  name: string;
  quantity: number;
};

export type KillReward = {
  gold: number;
  items: ItemReward[];
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

  const items: ItemReward[] = [];

  if (enemy.lootItemId && enemy.lootQuantity > 0) {
    const item = ITEM_BY_ID[enemy.lootItemId];

    if (item) {
      items.push({
        id: item.id,
        name: item.name,
        quantity: enemy.lootQuantity,
      });
    }
  }

  return {
    gold: enemy.goldReward,
    items,
  };
}
