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
  defense: number;
  gold: number;
  inventory: InventoryItem[];
  equippedWeaponId: string | null;
  facingX: number;
  facingY: number;
  lastAttackAt: number;
  invulnerableUntil: number;
  dashUntil: number;
  dashCooldownUntil: number;
  dashDirX: number;
  dashDirY: number;
  hitStunUntil: number;
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
    defense: 0,
    gold: 100,
    inventory: createInventory(),
    equippedWeaponId: RUSTY_KNIFE.id,
    facingX: 1,
    facingY: 0,
    lastAttackAt: -1000,
    invulnerableUntil: 0,
    dashUntil: 0,
    dashCooldownUntil: 0,
    dashDirX: 1,
    dashDirY: 0,
    hitStunUntil: 0,
  };
}

export function getEquippedWeapon(player: PlayerState): WeaponDefinition {
  const equipped = player.equippedWeaponId
    ? WEAPON_BY_ID[player.equippedWeaponId]
    : undefined;

  return equipped ?? RUSTY_KNIFE;
}

export function respawnPlayer(
  player: PlayerState,
  x: number,
  y: number,
): void {
  player.hp = player.maxHp;
  player.x = x;
  player.y = y;
  player.invulnerableUntil = 0;
  player.dashUntil = 0;
  player.dashCooldownUntil = 0;
  player.hitStunUntil = 0;
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
