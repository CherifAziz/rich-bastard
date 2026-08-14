import Phaser from "phaser";

export class InteractMarker {
  readonly x: number;
  readonly y: number;
  readonly prompt: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    promptText: string,
  ) {
    this.x = x;
    this.y = y;

    scene.add.rectangle(x, y, 72, 96, 0x2a2418).setDepth(6);
    scene.add.rectangle(x, y, 56, 80, 0xe8c547).setDepth(7);

    scene.add
      .text(x, y - 70, title, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#e8c547",
        stroke: "#1a1208",
        strokeThickness: 3,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.prompt = scene.add
      .text(x, y - 94, promptText, {
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
