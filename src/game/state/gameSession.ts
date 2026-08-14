import { createPlayer, type PlayerState } from "../player/player";
import { applyProgression, type SaveDataV1 } from "../save/saveData";
import { loadSave } from "../save/saveService";

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

export function createGameSessionFromSave(save: SaveDataV1): GameSession {
  const session = createGameSession();
  applyProgression(session.player, save.player);
  return session;
}

export function loadOrCreateGameSession(): GameSession {
  const save = loadSave();
  return save ? createGameSessionFromSave(save) : createGameSession();
}
