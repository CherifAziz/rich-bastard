import type { HubId } from "./hubs";
import { CHEESE, IRON_ORE, SCRAP, SUPPLIES } from "./items";

export type MarketLootSell = {
  itemId: string;
  sellPrice: number;
};

export type MarketTradeOffer = {
  itemId: string;
  buyPrice?: number;
  sellPrice?: number;
};

export type MarketDefinition = {
  id: HubId;
  name: string;
  lootSells: MarketLootSell[];
  sellsWeapons: boolean;
  trade: MarketTradeOffer[];
};

export const TOWN_MARKET: MarketDefinition = {
  id: "town",
  name: "Bourg",
  lootSells: [
    { itemId: CHEESE.id, sellPrice: 12 },
    { itemId: SCRAP.id, sellPrice: 25 },
  ],
  sellsWeapons: true,
  trade: [
    { itemId: SUPPLIES.id, buyPrice: 40 },
    { itemId: IRON_ORE.id, sellPrice: 60 },
  ],
};

export const OUTPOST_MARKET: MarketDefinition = {
  id: "outpost",
  name: "Avant-poste",
  lootSells: [],
  sellsWeapons: false,
  trade: [
    { itemId: IRON_ORE.id, buyPrice: 45 },
    { itemId: SUPPLIES.id, sellPrice: 55 },
  ],
};

export const MARKET_BY_HUB: Record<HubId, MarketDefinition> = {
  town: TOWN_MARKET,
  outpost: OUTPOST_MARKET,
};
