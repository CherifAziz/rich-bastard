import Phaser from "phaser";
import { createGameSession } from "../game/state/gameSession";
import { ExplorationScene } from "./scenes/ExplorationScene";
import { TownScene } from "./scenes/TownScene";

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#1c1814",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [TownScene, ExplorationScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("session", createGameSession());
      },
    },
    banner: false,
  };
}
