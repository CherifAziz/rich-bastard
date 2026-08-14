import Phaser from "phaser";
import { addArchGate, addPrompt } from "../art/props";

export class InteractMarker {
  readonly x: number;
  readonly y: number;
  readonly prompt: Phaser.GameObjects.Text;
  private readonly promptBg: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    title: string,
    promptText: string,
    warm = true,
  ) {
    this.x = x;
    this.y = y;
    addArchGate(scene, x, y, title, warm);
    const prompt = addPrompt(scene, x, y - 82, promptText);
    this.prompt = prompt.label;
    this.promptBg = prompt.bg;
  }

  setPromptVisible(visible: boolean): void {
    this.prompt.setVisible(visible);
    this.promptBg.setVisible(visible);
  }
}
