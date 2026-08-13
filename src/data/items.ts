export type ItemDefinition = {
  id: string;
  name: string;
};

export const CHEESE: ItemDefinition = {
  id: "cheese",
  name: "Cheese",
};

export const ITEM_BY_ID: Record<string, ItemDefinition> = {
  [CHEESE.id]: CHEESE,
};
