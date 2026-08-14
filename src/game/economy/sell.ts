import { ITEM_BY_ID } from "../../data/items";
import { getItemQuantity, removeItem } from "../inventory/inventory";
import type { PlayerState } from "../player/player";

export type SaleResult = {
  success: boolean;
  itemId: string;
  itemName: string;
  quantitySold: number;
  goldGained: number;
  quantityRemaining: number;
};

export function sellItem(
  player: PlayerState,
  itemId: string,
  quantity: number,
): SaleResult {
  const item = ITEM_BY_ID[itemId];
  const owned = getItemQuantity(player.inventory, itemId);

  if (!item || quantity <= 0 || owned <= 0) {
    return {
      success: false,
      itemId,
      itemName: item?.name ?? itemId,
      quantitySold: 0,
      goldGained: 0,
      quantityRemaining: owned,
    };
  }

  const quantitySold = Math.min(quantity, owned);
  const goldGained = quantitySold * item.sellPrice;
  removeItem(player.inventory, itemId, quantitySold);
  player.gold += goldGained;

  return {
    success: true,
    itemId,
    itemName: item.name,
    quantitySold,
    goldGained,
    quantityRemaining: getItemQuantity(player.inventory, itemId),
  };
}

export function sellAll(player: PlayerState, itemId: string): SaleResult {
  return sellItem(player, itemId, getItemQuantity(player.inventory, itemId));
}
