export type WeaponDefinition = {
  id: string;
  name: string;
  damage: number;
  price: number;
  attackCooldownMs: number;
  range: number;
  halfWidth: number;
  knockback: number;
  tag: string;
};

export const RUSTY_KNIFE: WeaponDefinition = {
  id: "rusty_knife",
  name: "Rusty Knife",
  damage: 10,
  price: 0,
  attackCooldownMs: 220,
  range: 42,
  halfWidth: 16,
  knockback: 140,
  tag: "Fast / Short",
};

export const RUSTY_BAT: WeaponDefinition = {
  id: "rusty_bat",
  name: "Rusty Bat",
  damage: 20,
  price: 150,
  attackCooldownMs: 380,
  range: 58,
  halfWidth: 26,
  knockback: 260,
  tag: "Wide / Heavy knockback",
};

export const IRON_SPEAR: WeaponDefinition = {
  id: "iron_spear",
  name: "Iron Spear",
  damage: 16,
  price: 260,
  attackCooldownMs: 460,
  range: 92,
  halfWidth: 12,
  knockback: 180,
  tag: "Long / Narrow",
};

export const WEAPONS: WeaponDefinition[] = [
  RUSTY_KNIFE,
  RUSTY_BAT,
  IRON_SPEAR,
];

export const WEAPON_BY_ID: Record<string, WeaponDefinition> = {
  [RUSTY_KNIFE.id]: RUSTY_KNIFE,
  [RUSTY_BAT.id]: RUSTY_BAT,
  [IRON_SPEAR.id]: IRON_SPEAR,
};
