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

export function removeItem(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number,
): number {
  if (quantity <= 0) {
    return 0;
  }

  const index = inventory.findIndex((entry) => entry.itemId === itemId);

  if (index < 0) {
    return 0;
  }

  const entry = inventory[index];
  const removed = Math.min(quantity, entry.quantity);
  entry.quantity -= removed;

  if (entry.quantity <= 0) {
    inventory.splice(index, 1);
  }

  return removed;
}
