import Phaser from "phaser";
import { CHEESE_MERCHANT } from "../../data/merchants";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
import { DEPTH } from "../art/depth";
import { addBarrel, addCrate, addPrompt, addShadow } from "../art/props";

export class MerchantStand {
  readonly x: number;
  readonly y: number;
  readonly prompt: Phaser.GameObjects.Text;
  private readonly promptBg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.x = CHEESE_MERCHANT.x;
    this.y = CHEESE_MERCHANT.y;

    addShadow(scene, this.x, this.y + 28, 88, 28);

    scene.add
      .ellipse(this.x, this.y + 18, 96, 52, THEME.townWoodDark, 0.55)
      .setDepth(DEPTH.prop);
    scene.add
      .rectangle(this.x, this.y + 8, 78, 22, THEME.townWood)
      .setDepth(DEPTH.prop);
    scene.add
      .rectangle(this.x, this.y + 8, 78, 4, THEME.gold, 0.35)
      .setDepth(DEPTH.prop);

    scene.add.rectangle(this.x - 34, this.y - 8, 6, 36, THEME.townWoodDark).setDepth(DEPTH.prop);
    scene.add.rectangle(this.x + 34, this.y - 8, 6, 36, THEME.townWoodDark).setDepth(DEPTH.prop);
    scene.add
      .rectangle(this.x, this.y - 28, 84, 18, THEME.townRoof)
      .setDepth(DEPTH.canopy);
    scene.add
      .triangle(this.x, this.y - 40, 0, -8, -44, 10, 44, 10, THEME.townRoof)
      .setDepth(DEPTH.canopy);

    const keeper = scene.add.container(this.x, this.y - 6);
    keeper.setDepth(DEPTH.character - 1);
    keeper.add(scene.add.ellipse(0, 8, 14, 16, THEME.townWood));
    keeper.add(scene.add.circle(0, -4, 7, THEME.playerSkin));
    keeper.add(scene.add.ellipse(0, -8, 12, 6, THEME.playerHair));
    keeper.add(scene.add.ellipse(0, -9, 13, 5, THEME.gold, 0.85));

    addCrate(scene, this.x + 48, this.y + 10);
    addBarrel(scene, this.x - 50, this.y + 12);

    scene.add
      .text(this.x, this.y - 64, CHEESE_MERCHANT.name.toUpperCase(), {
        fontFamily: FONT,
        fontSize: "14px",
        fontStyle: "bold",
        color: THEME_HEX.gold,
        stroke: THEME_HEX.stroke,
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.prop);

    const prompt = addPrompt(scene, this.x, this.y - 102, "E — PARLER");
    this.prompt = prompt.label;
    this.promptBg = prompt.bg;
  }

  setPromptVisible(visible: boolean): void {
    this.prompt.setVisible(visible);
    this.promptBg.setVisible(visible);
  }
}
