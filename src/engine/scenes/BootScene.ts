import Phaser from "phaser";
import { sceneKeyForHub } from "../../data/hubs";
import { getGameSession } from "../session";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    const session = getGameSession(this);
    this.scene.start(sceneKeyForHub(session.lastSafeHubId));
  }
}
