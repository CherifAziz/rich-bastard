import type { PlayerState } from "../player/player";

export const DEATH_GOLD_PENALTY_RATE = 0.1;

export type DeathPenaltyResult = {
  goldLost: number;
  remainingGold: number;
};

export function applyDeathGoldPenalty(
  player: PlayerState,
): DeathPenaltyResult {
  const goldLost = Math.min(
    player.gold,
    Math.round(player.gold * DEATH_GOLD_PENALTY_RATE),
  );
  player.gold -= goldLost;

  return {
    goldLost,
    remainingGold: player.gold,
  };
}
