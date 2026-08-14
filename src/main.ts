import "./style.css";
import Phaser from "phaser";
import { createGameConfig } from "./engine/config";
import { deleteSave } from "./game/save/saveService";

const game = new Phaser.Game(createGameConfig());

if (import.meta.env.DEV) {
  Object.assign(window, { __game: game });
  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.code !== "F8") {
      return;
    }

    event.preventDefault();
    if (!window.confirm("Effacer la sauvegarde Rich Bastard et recommencer ?")) {
      return;
    }

    deleteSave();
    console.info("[Rich Bastard] Sauvegarde effacée. Rechargement.");
    window.location.reload();
  });
}
