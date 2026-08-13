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
};

export const ENEMY_BY_ID: Record<string, EnemyDefinition> = {
  [RAT.id]: RAT,
};
