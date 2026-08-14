import { ITEM_BY_ID } from "../../data/items";
import type { MarketDefinition } from "../../data/markets";
import { addItem, getItemQuantity } from "../inventory/inventory";
import type { PlayerState } from "../player/player";
import { sellAll, sellItem, type SaleResult } from "./sell";

export type TradeBuyResult = {
  success: boolean;
  itemId: string;
  itemName: string;
  quantityBought: number;
  goldSpent: number;
  remainingGold: number;
  insufficientFunds: boolean;
};

export function getMarketBuyPrice(
  market: MarketDefinition,
  itemId: string,
): number | null {
  const offer = market.trade.find((entry) => entry.itemId === itemId);
  return offer?.buyPrice ?? null;
}

export function getMarketSellPrice(
  market: MarketDefinition,
  itemId: string,
): number | null {
  const loot = market.lootSells.find((entry) => entry.itemId === itemId);
  if (loot) {
    return loot.sellPrice;
  }

  const offer = market.trade.find((entry) => entry.itemId === itemId);
  return offer?.sellPrice ?? null;
}

export function maxBuyQuantity(
  player: PlayerState,
  itemId: string,
  market: MarketDefinition,
): number {
  const price = getMarketBuyPrice(market, itemId);
  if (price === null || price <= 0) {
    return 0;
  }

  return Math.floor(player.gold / price);
}

export function buyTradeItem(
  player: PlayerState,
  itemId: string,
  quantity: number,
  market: MarketDefinition,
): TradeBuyResult {
  const item = ITEM_BY_ID[itemId];
  const price = getMarketBuyPrice(market, itemId);
  const itemName = item?.name ?? itemId;

  if (!item || price === null || !Number.isInteger(quantity) || quantity <= 0) {
    return failBuy(itemId, itemName, player.gold);
  }

  const goldSpent = quantity * price;
  if (player.gold < goldSpent) {
    return {
      success: false,
      itemId,
      itemName,
      quantityBought: 0,
      goldSpent: 0,
      remainingGold: player.gold,
      insufficientFunds: true,
    };
  }

  player.gold -= goldSpent;
  addItem(player.inventory, itemId, quantity);

  return {
    success: true,
    itemId,
    itemName,
    quantityBought: quantity,
    goldSpent,
    remainingGold: player.gold,
    insufficientFunds: false,
  };
}

export function sellTradeItem(
  player: PlayerState,
  itemId: string,
  quantity: number,
  market: MarketDefinition,
): SaleResult {
  const price = getMarketSellPrice(market, itemId);
  const item = ITEM_BY_ID[itemId];
  const owned = getItemQuantity(player.inventory, itemId);

  if (price === null) {
    return {
      success: false,
      itemId,
      itemName: item?.name ?? itemId,
      quantitySold: 0,
      goldGained: 0,
      quantityRemaining: owned,
    };
  }

  return sellItem(player, itemId, quantity, price);
}

export function sellAllTradeItem(
  player: PlayerState,
  itemId: string,
  market: MarketDefinition,
): SaleResult {
  const price = getMarketSellPrice(market, itemId);
  const item = ITEM_BY_ID[itemId];
  const owned = getItemQuantity(player.inventory, itemId);

  if (price === null) {
    return {
      success: false,
      itemId,
      itemName: item?.name ?? itemId,
      quantitySold: 0,
      goldGained: 0,
      quantityRemaining: owned,
    };
  }

  return sellAll(player, itemId, price);
}

function failBuy(
  itemId: string,
  itemName: string,
  remainingGold: number,
): TradeBuyResult {
  return {
    success: false,
    itemId,
    itemName,
    quantityBought: 0,
    goldSpent: 0,
    remainingGold,
    insufficientFunds: false,
  };
}
