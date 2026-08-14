export type ItemDefinition = {
  id: string;
  name: string;
  sellPrice: number;
};

export const CHEESE: ItemDefinition = {
  id: "cheese",
  name: "Cheese",
  sellPrice: 12,
};

export const ITEM_BY_ID: Record<string, ItemDefinition> = {
  [CHEESE.id]: CHEESE,
};
