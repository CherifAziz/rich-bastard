import Phaser from "phaser";
import { loadOrCreateGameSession, type GameSession } from "../game/state/gameSession";

export function getGameSession(scene: Phaser.Scene): GameSession {
  let session = scene.registry.get("session") as GameSession | undefined;
  if (!session) {
    session = loadOrCreateGameSession();
    scene.registry.set("session", session);
  }
  return session;
}
