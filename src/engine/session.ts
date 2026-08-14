import Phaser from "phaser";
import { createGameSession, type GameSession } from "../game/state/gameSession";

export function getGameSession(scene: Phaser.Scene): GameSession {
  let session = scene.registry.get("session") as GameSession | undefined;
  if (!session) {
    session = createGameSession();
    scene.registry.set("session", session);
  }
  return session;
}
