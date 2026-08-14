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
  attackRange: number;
  attackCooldownMs: number;
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
  attackRange: 0,
  attackCooldownMs: 1000,
  goldReward: 7,
  lootItemId: "cheese",
  lootQuantity: 1,
};

export const BANDIT: EnemyDefinition = {
  id: "bandit",
  name: "Bandit",
  hp: 60,
  speed: 210,
  contactDamage: 10,
  width: 30,
  height: 30,
  aggroRange: 300,
  stopRange: 40,
  attackRange: 46,
  attackCooldownMs: 1000,
  goldReward: 20,
  lootItemId: "scrap",
  lootQuantity: 1,
};

export const ENEMY_BY_ID: Record<string, EnemyDefinition> = {
  [RAT.id]: RAT,
  [BANDIT.id]: BANDIT,
};
