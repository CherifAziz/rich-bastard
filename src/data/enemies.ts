export type EnemyDefinition = {
  id: string;
  name: string;
  hp: number;
  speed: number;
  contactDamage: number;
  width: number;
  height: number;
  aggroRange: number;
  stopRange: number;
  goldReward: number;
  lootItemId: string | null;
  lootQuantity: number;
};

export const RAT: EnemyDefinition = {
  id: "rat",
  name: "Rat",
  hp: 30,
  speed: 150,
  contactDamage: 5,
  width: 22,
  height: 22,
  aggroRange: 280,
  stopRange: 34,
  goldReward: 7,
  lootItemId: "cheese",
  lootQuantity: 1,
};

export const ENEMY_BY_ID: Record<string, EnemyDefinition> = {
  [RAT.id]: RAT,
};
