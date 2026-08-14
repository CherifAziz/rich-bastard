import Phaser from "phaser";
import { CHEESE_MERCHANT } from "../../data/merchants";

export class MerchantStand {
  readonly x: number;
  readonly y: number;
  readonly prompt: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.x = CHEESE_MERCHANT.x;
    this.y = CHEESE_MERCHANT.y;

    scene.add.rectangle(this.x, this.y, 200, 180, 0x4a453c).setDepth(2);
    scene.add.rectangle(this.x, this.y + 10, 54, 36, 0x6b4a2e).setDepth(6);
    scene.add.rectangle(this.x, this.y - 16, 58, 12, 0x8b3a2a).setDepth(6);
    scene.add.rectangle(this.x, this.y + 4, 18, 22, 0xd4b46a).setDepth(7);

    scene.add
      .text(this.x, this.y - 48, CHEESE_MERCHANT.name.toUpperCase(), {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#e8c547",
        stroke: "#1a1208",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.prompt = scene.add
      .text(this.x, this.y - 68, "E — PARLER", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#f0f0f4",
        stroke: "#1a1208",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(18)
      .setVisible(false);
  }

  setPromptVisible(visible: boolean): void {
    this.prompt.setVisible(visible);
  }
}
