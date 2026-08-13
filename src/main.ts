import "./style.css";
import Phaser from "phaser";
import { createGameConfig } from "./engine/config";

const game = new Phaser.Game(createGameConfig());

if (import.meta.env.DEV) {
  Object.assign(window, { __game: game });
}
