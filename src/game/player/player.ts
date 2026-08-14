import type { InventoryItem } from "../inventory/inventory";
import { createInventory } from "../inventory/inventory";
import { RUSTY_KNIFE, WEAPON_BY_ID, type WeaponDefinition } from "../../data/weapons";

export type PlayerState = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  gold: number;
  inventory: InventoryItem[];
  equippedWeaponId: string | null;
  facingX: number;
  facingY: number;
  lastAttackAt: number;
};

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    width: 28,
    height: 28,
    speed: 260,
    hp: 100,
    maxHp: 100,
    damage: 10,
    defense: 0,
    gold: 100,
    inventory: createInventory(),
    equippedWeaponId: RUSTY_KNIFE.id,
    facingX: 1,
    facingY: 0,
    lastAttackAt: -1000,
  };
}

export function getEquippedWeapon(player: PlayerState): WeaponDefinition {
  const equipped = player.equippedWeaponId
    ? WEAPON_BY_ID[player.equippedWeaponId]
    : undefined;

  return equipped ?? RUSTY_KNIFE;
}

export function velocityFromInput(
  dirX: number,
  dirY: number,
  speed: number,
): { x: number; y: number } {
  const length = Math.hypot(dirX, dirY);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (dirX / length) * speed,
    y: (dirY / length) * speed,
  };
}
