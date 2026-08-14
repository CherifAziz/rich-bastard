export type InventoryItem = {
  itemId: string;
  quantity: number;
};

export function createInventory(): InventoryItem[] {
  return [];
}

export function addItem(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number,
): void {
  if (quantity <= 0) {
    return;
  }

  const existing = inventory.find((entry) => entry.itemId === itemId);

  if (existing) {
    existing.quantity += quantity;
    return;
  }

  inventory.push({ itemId, quantity });
}

export function getItemQuantity(
  inventory: InventoryItem[],
  itemId: string,
): number {
  return inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}
