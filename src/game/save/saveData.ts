import { isHubId, type HubId } from "../../data/hubs";
import { ITEM_BY_ID } from "../../data/items";
import { RUSTY_KNIFE, WEAPON_BY_ID } from "../../data/weapons";
import type { InventoryItem } from "../inventory/inventory";
import type { PlayerState } from "../player/player";

export const SAVE_VERSION = 3 as const;
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

export type SaveDataV2 = {
  version: 2;
  player: {
    gold: number;
    inventory: SavedInventoryItem[];
    ownedWeaponIds: string[];
    equippedWeaponId: string;
  };
};

export type SaveDataV3 = {
  version: 3;
  player: {
    gold: number;
    inventory: SavedInventoryItem[];
    ownedWeaponIds: string[];
    equippedWeaponId: string;
    lastSafeHubId: HubId;
  };
};

export type ParseSaveResult =
  | { ok: true; data: SaveDataV3 }
  | { ok: false; reason: string };

export function saveDataFromProgress(
  player: PlayerState,
  lastSafeHubId: HubId,
): SaveDataV3 {
  return {
    version: SAVE_VERSION,
    player: {
      gold: player.gold,
      inventory: player.inventory.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      ownedWeaponIds: [...player.ownedWeaponIds],
      equippedWeaponId: player.equippedWeaponId ?? RUSTY_KNIFE.id,
      lastSafeHubId,
    },
  };
}

export function applyProgression(
  player: PlayerState,
  progression: Omit<SaveDataV3["player"], "lastSafeHubId">,
): void {
  player.gold = progression.gold;
  player.inventory = cloneInventory(progression.inventory);
  player.ownedWeaponIds = [...progression.ownedWeaponIds];
  player.equippedWeaponId = progression.equippedWeaponId;
}

export function migrateV1ToV2(save: SaveDataV1): SaveDataV2 {
  const equippedWeaponId = save.player.equippedWeaponId;
  const ownedWeaponIds = [RUSTY_KNIFE.id];
  if (equippedWeaponId !== RUSTY_KNIFE.id) {
    ownedWeaponIds.push(equippedWeaponId);
  }

  return {
    version: 2,
    player: {
      gold: save.player.gold,
      inventory: save.player.inventory,
      ownedWeaponIds,
      equippedWeaponId,
    },
  };
}

export function migrateV2ToV3(save: SaveDataV2): SaveDataV3 {
  return {
    version: 3,
    player: {
      gold: save.player.gold,
      inventory: save.player.inventory,
      ownedWeaponIds: save.player.ownedWeaponIds,
      equippedWeaponId: save.player.equippedWeaponId,
      lastSafeHubId: "town",
    },
  };
}

export function migrateV1ToV3(save: SaveDataV1): SaveDataV3 {
  return migrateV2ToV3(migrateV1ToV2(save));
}

export function parseSaveData(value: unknown): ParseSaveResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, reason: "la sauvegarde n'est pas un objet" };
  }

  const root = value as Record<string, unknown>;
  if (root.version === 1) {
    const parsed = parseV1(root);
    if (!parsed.ok) {
      return parsed;
    }
    return { ok: true, data: migrateV1ToV3(parsed.data) };
  }

  if (root.version === 2) {
    const parsed = parseV2(root);
    if (!parsed.ok) {
      return parsed;
    }
    return { ok: true, data: migrateV2ToV3(parsed.data) };
  }

  if (root.version !== SAVE_VERSION) {
    return {
      ok: false,
      reason: `version inconnue (${String(root.version)})`,
    };
  }

  return parseV3(root);
}

function parseSharedPlayer(
  root: Record<string, unknown>,
): { ok: true; player: Record<string, unknown> } | { ok: false; reason: string } {
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

  return { ok: true, player };
}

function parseV1(
  root: Record<string, unknown>,
): { ok: true; data: SaveDataV1 } | { ok: false; reason: string } {
  const shared = parseSharedPlayer(root);
  if (!shared.ok) {
    return shared;
  }

  const inventory = parseInventory(shared.player.inventory);
  if (!inventory.ok) {
    return inventory;
  }

  return {
    ok: true,
    data: {
      version: 1,
      player: {
        gold: shared.player.gold as number,
        inventory: inventory.items,
        equippedWeaponId: shared.player.equippedWeaponId as string,
      },
    },
  };
}

function parseV2(
  root: Record<string, unknown>,
): { ok: true; data: SaveDataV2 } | { ok: false; reason: string } {
  const shared = parseSharedPlayer(root);
  if (!shared.ok) {
    return shared;
  }

  const inventory = parseInventory(shared.player.inventory);
  if (!inventory.ok) {
    return inventory;
  }

  const owned = parseOwnedWeapons(
    shared.player.ownedWeaponIds,
    shared.player.equippedWeaponId as string,
  );
  if (!owned.ok) {
    return owned;
  }

  return {
    ok: true,
    data: {
      version: 2,
      player: {
        gold: shared.player.gold as number,
        inventory: inventory.items,
        ownedWeaponIds: owned.ids,
        equippedWeaponId: shared.player.equippedWeaponId as string,
      },
    },
  };
}

function parseV3(root: Record<string, unknown>): ParseSaveResult {
  const parsed = parseV2(root);
  if (!parsed.ok) {
    return parsed;
  }

  const player = (root.player as Record<string, unknown>) ?? {};
  if (!isHubId(player.lastSafeHubId)) {
    return { ok: false, reason: "hub invalide" };
  }

  return {
    ok: true,
    data: {
      version: 3,
      player: {
        ...parsed.data.player,
        lastSafeHubId: player.lastSafeHubId,
      },
    },
  };
}

function parseOwnedWeapons(
  value: unknown,
  equippedWeaponId: string,
): { ok: true; ids: string[] } | { ok: false; reason: string } {
  if (!Array.isArray(value)) {
    return { ok: false, reason: "armes possédées invalides" };
  }

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string" || !WEAPON_BY_ID[entry]) {
      return { ok: false, reason: "arme possédée inconnue" };
    }
    if (seen.has(entry)) {
      return { ok: false, reason: "arme possédée dupliquée" };
    }
    seen.add(entry);
    ids.push(entry);
  }

  if (!seen.has(RUSTY_KNIFE.id)) {
    return { ok: false, reason: "Rusty Knife manquante" };
  }

  if (!seen.has(equippedWeaponId)) {
    return { ok: false, reason: "arme équipée non possédée" };
  }

  return { ok: true, ids };
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
