import { ITEM_BY_ID } from "../../data/items";
import type { MarketDefinition } from "../../data/markets";
import { WEAPONS } from "../../data/weapons";
import { maxBuyQuantity } from "../../game/economy/trade";
import { getItemQuantity } from "../../game/inventory/inventory";
import { ownsWeapon, type PlayerState } from "../../game/player/player";
import type {
  MerchantLootRow,
  MerchantPanelView,
  MerchantTradeRow,
  MerchantWeaponRow,
} from "./MerchantPanel";

export function createMerchantPanelView(
  player: PlayerState,
  market: MarketDefinition,
): MerchantPanelView {
  return {
    title: market.name.toUpperCase(),
    gold: player.gold,
    lootItems: market.lootSells.map((offer) => {
      const item = ITEM_BY_ID[offer.itemId];
      return {
        itemId: offer.itemId,
        name: item?.name ?? offer.itemId,
        quantity: getItemQuantity(player.inventory, offer.itemId),
        sellPrice: offer.sellPrice,
      } satisfies MerchantLootRow;
    }),
    tradeItems: market.trade.map((offer) => {
      const item = ITEM_BY_ID[offer.itemId];
      const buyPrice = offer.buyPrice ?? null;
      const maxBuy =
        buyPrice === null ? 0 : maxBuyQuantity(player, offer.itemId, market);
      return {
        itemId: offer.itemId,
        name: item?.name ?? offer.itemId,
        quantity: getItemQuantity(player.inventory, offer.itemId),
        buyPrice,
        sellPrice: offer.sellPrice ?? null,
        canAfford: maxBuy >= 1,
        maxBuy,
      } satisfies MerchantTradeRow;
    }),
    weapons: market.sellsWeapons
      ? WEAPONS.map(
          (weapon): MerchantWeaponRow => ({
            weaponId: weapon.id,
            name: weapon.name,
            damage: weapon.damage,
            price: weapon.price,
            tag: weapon.tag,
            owned: ownsWeapon(player, weapon.id),
            equipped: player.equippedWeaponId === weapon.id,
            canAfford: player.gold >= weapon.price,
          }),
        )
      : [],
  };
}
