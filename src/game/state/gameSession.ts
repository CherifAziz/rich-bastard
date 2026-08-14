import { type HubId } from "../../data/hubs";
import { createPlayer, type PlayerState } from "../player/player";
import { applyProgression, type SaveDataV3 } from "../save/saveData";
import { loadSave } from "../save/saveService";

export type GameSession = {
  player: PlayerState;
  lastGoldLost: number;
  lastSafeHubId: HubId;
};

export function createGameSession(): GameSession {
  return {
    player: createPlayer(0, 0),
    lastGoldLost: 0,
    lastSafeHubId: "town",
  };
}

export function createGameSessionFromSave(save: SaveDataV3): GameSession {
  const session = createGameSession();
  applyProgression(session.player, save.player);
  session.lastSafeHubId = save.player.lastSafeHubId;
  return session;
}

export function loadOrCreateGameSession(): GameSession {
  const save = loadSave();
  return save ? createGameSessionFromSave(save) : createGameSession();
}

export function arriveAtHub(session: GameSession, hubId: HubId): void {
  session.lastSafeHubId = hubId;
}
