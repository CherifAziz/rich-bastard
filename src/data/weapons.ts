export type WeaponDefinition = {
  id: string;
  name: string;
  damage: number;
  price: number;
};

export const RUSTY_KNIFE: WeaponDefinition = {
  id: "rusty_knife",
  name: "Rusty Knife",
  damage: 10,
  price: 0,
};

export const RUSTY_BAT: WeaponDefinition = {
  id: "rusty_bat",
  name: "Rusty Bat",
  damage: 20,
  price: 150,
};

export const WEAPON_BY_ID: Record<string, WeaponDefinition> = {
  [RUSTY_KNIFE.id]: RUSTY_KNIFE,
  [RUSTY_BAT.id]: RUSTY_BAT,
};
