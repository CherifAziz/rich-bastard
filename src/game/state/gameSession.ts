import { createPlayer, type PlayerState } from "../player/player";

export type GameSession = {
  player: PlayerState;
  lastGoldLost: number;
};

export function createGameSession(): GameSession {
  return {
    player: createPlayer(0, 0),
    lastGoldLost: 0,
  };
}
