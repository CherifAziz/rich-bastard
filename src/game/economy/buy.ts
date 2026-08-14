import { WEAPON_BY_ID, type WeaponDefinition } from "../../data/weapons";
import type { PlayerState } from "../player/player";

export type BuyWeaponResult = {
  success: boolean;
  weaponId: string;
  weaponName: string;
  goldSpent: number;
  remainingGold: number;
  alreadyOwned: boolean;
  insufficientFunds: boolean;
};

export function buyWeapon(
  player: PlayerState,
  weaponId: string,
): BuyWeaponResult {
  const weapon: WeaponDefinition | undefined = WEAPON_BY_ID[weaponId];
  const alreadyOwned = player.equippedWeaponId === weaponId;

  if (!weapon) {
    return {
      success: false,
      weaponId,
      weaponName: weaponId,
      goldSpent: 0,
      remainingGold: player.gold,
      alreadyOwned: false,
      insufficientFunds: false,
    };
  }

  if (alreadyOwned) {
    return {
      success: false,
      weaponId,
      weaponName: weapon.name,
      goldSpent: 0,
      remainingGold: player.gold,
      alreadyOwned: true,
      insufficientFunds: false,
    };
  }

  if (player.gold < weapon.price) {
    return {
      success: false,
      weaponId,
      weaponName: weapon.name,
      goldSpent: 0,
      remainingGold: player.gold,
      alreadyOwned: false,
      insufficientFunds: true,
    };
  }

  player.gold -= weapon.price;
  player.equippedWeaponId = weapon.id;

  return {
    success: true,
    weaponId: weapon.id,
    weaponName: weapon.name,
    goldSpent: weapon.price,
    remainingGold: player.gold,
    alreadyOwned: false,
    insufficientFunds: false,
  };
}
