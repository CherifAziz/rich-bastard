import Phaser from "phaser";
import { loadOrCreateGameSession } from "../game/state/gameSession";
import { BootScene } from "./scenes/BootScene";
import { ExplorationScene } from "./scenes/ExplorationScene";
import { OutpostScene } from "./scenes/OutpostScene";
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
    scene: [BootScene, TownScene, OutpostScene, ExplorationScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set("session", loadOrCreateGameSession());
      },
    },
    banner: false,
  };
}
