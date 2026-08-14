export type ItemKind = "loot" | "trade";

export type ItemDefinition = {
  id: string;
  name: string;
  kind: ItemKind;
  sellPrice: number;
};

export const CHEESE: ItemDefinition = {
  id: "cheese",
  name: "Cheese",
  kind: "loot",
  sellPrice: 12,
};

export const SCRAP: ItemDefinition = {
  id: "scrap",
  name: "Scrap",
  kind: "loot",
  sellPrice: 25,
};

export const SUPPLIES: ItemDefinition = {
  id: "supplies",
  name: "Supply Crate",
  kind: "trade",
  sellPrice: 0,
};

export const IRON_ORE: ItemDefinition = {
  id: "iron_ore",
  name: "Iron Ore",
  kind: "trade",
  sellPrice: 0,
};

export const ITEM_BY_ID: Record<string, ItemDefinition> = {
  [CHEESE.id]: CHEESE,
  [SCRAP.id]: SCRAP,
  [SUPPLIES.id]: SUPPLIES,
  [IRON_ORE.id]: IRON_ORE,
};
