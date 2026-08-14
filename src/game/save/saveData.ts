import { ITEM_BY_ID } from "../../data/items";
import { RUSTY_KNIFE, WEAPON_BY_ID } from "../../data/weapons";
import type { InventoryItem } from "../inventory/inventory";
import type { PlayerState } from "../player/player";

export const SAVE_VERSION = 1 as const;
export const SAVE_KEY = "rich-bastard-save-v1";

export type SavedInventoryItem = {
  itemId: string;
  quantity: number;
};

export type SaveDataV1 = {
  version: 1;
  player: {
    gold: number;
    inventory: SavedInventoryItem[];
    equippedWeaponId: string;
  };
};

export type ParseSaveResult =
  | { ok: true; data: SaveDataV1 }
  | { ok: false; reason: string };

export function saveDataFromPlayer(player: PlayerState): SaveDataV1 {
  return {
    version: SAVE_VERSION,
    player: {
      gold: player.gold,
      inventory: player.inventory.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      equippedWeaponId: player.equippedWeaponId ?? RUSTY_KNIFE.id,
    },
  };
}

export function applyProgression(
  player: PlayerState,
  progression: SaveDataV1["player"],
): void {
  player.gold = progression.gold;
  player.inventory = cloneInventory(progression.inventory);
  player.equippedWeaponId = progression.equippedWeaponId;
}

export function parseSaveData(value: unknown): ParseSaveResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, reason: "la sauvegarde n'est pas un objet" };
  }

  const root = value as Record<string, unknown>;
  if (root.version !== SAVE_VERSION) {
    return {
      ok: false,
      reason: `version inconnue (${String(root.version)})`,
    };
  }

  if (typeof root.player !== "object" || root.player === null) {
    return { ok: false, reason: "joueur manquant" };
  }

  const player = root.player as Record<string, unknown>;
  if (
    typeof player.gold !== "number" ||
    !Number.isFinite(player.gold) ||
    player.gold < 0
  ) {
    return { ok: false, reason: "or invalide" };
  }

  if (
    typeof player.equippedWeaponId !== "string" ||
    !WEAPON_BY_ID[player.equippedWeaponId]
  ) {
    return { ok: false, reason: "arme inconnue" };
  }

  const inventory = parseInventory(player.inventory);
  if (!inventory.ok) {
    return inventory;
  }

  return {
    ok: true,
    data: {
      version: SAVE_VERSION,
      player: {
        gold: player.gold,
        inventory: inventory.items,
        equippedWeaponId: player.equippedWeaponId,
      },
    },
  };
}

function parseInventory(
  value: unknown,
): { ok: true; items: SavedInventoryItem[] } | { ok: false; reason: string } {
  if (!Array.isArray(value)) {
    return { ok: false, reason: "inventaire invalide" };
  }

  const items: SavedInventoryItem[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, reason: "entrée d'inventaire invalide" };
    }

    const item = entry as Record<string, unknown>;
    if (typeof item.itemId !== "string" || !ITEM_BY_ID[item.itemId]) {
      return { ok: false, reason: "objet d'inventaire inconnu" };
    }

    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return { ok: false, reason: "quantité d'inventaire invalide" };
    }

    if (seen.has(item.itemId)) {
      return { ok: false, reason: "objet d'inventaire dupliqué" };
    }

    seen.add(item.itemId);
    items.push({ itemId: item.itemId, quantity: item.quantity });
  }

  return { ok: true, items };
}

function cloneInventory(items: SavedInventoryItem[]): InventoryItem[] {
  return items.map((item) => ({
    itemId: item.itemId,
    quantity: item.quantity,
  }));
}
