import Phaser from "phaser";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
import type { GroundLoot } from "../../game/rewards/rewards";
import { DEPTH } from "../art/depth";
import { addShadow } from "../art/props";

export class LootDrop {
  readonly loot: GroundLoot;
  private readonly root: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, loot: GroundLoot) {
    this.loot = loot;
    this.shadow = addShadow(scene, loot.x, loot.y + 8, 16, 8);
    this.root = scene.add.container(loot.x, loot.y);
    this.root.setDepth(DEPTH.loot);

    if (loot.itemId === "scrap") {
      this.root.add(this.createScrap(scene));
    } else {
      this.root.add(this.createCheese(scene));
    }

    scene.tweens.add({
      targets: this.root,
      y: loot.y - 4,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  collect(): boolean {
    if (this.loot.collected) {
      return false;
    }

    this.loot.collected = true;
    this.destroy();
    return true;
  }

  destroy(): void {
    this.root.destroy();
    this.shadow.destroy();
  }

  private createCheese(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const cheese = scene.add.container(0, 0);
    cheese.add(
      scene.add.triangle(0, 0, 0, -11, -11, 9, 12, 9, THEME.cheese),
    );
    cheese.add(scene.add.circle(-2, 2, 2.2, THEME.cheeseHole));
    cheese.add(scene.add.circle(4, 4, 1.6, THEME.cheeseHole));
    cheese.add(scene.add.circle(1, -3, 1.4, THEME.cheeseHole));
    cheese.add(
      scene.add
        .text(0, -16, "Cheese", {
          fontFamily: FONT,
          fontSize: "10px",
          color: THEME_HEX.goldSoft,
          stroke: THEME_HEX.stroke,
          strokeThickness: 2,
        })
        .setOrigin(0.5),
    );
    return cheese;
  }

  private createScrap(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const scrap = scene.add.container(0, 0);
    scrap.add(scene.add.rectangle(-3, 2, 12, 7, THEME.scrap).setRotation(-0.4));
    scrap.add(scene.add.rectangle(4, -1, 8, 6, THEME.scrapDark).setRotation(0.5));
    scrap.add(scene.add.circle(1, -4, 5, THEME.scrapLight));
    scrap.add(scene.add.circle(1, -4, 2, THEME.scrapDark));
    scrap.add(
      scene.add
        .text(0, -16, "Scrap", {
          fontFamily: FONT,
          fontSize: "10px",
          color: THEME_HEX.muted,
          stroke: THEME_HEX.stroke,
          strokeThickness: 2,
        })
        .setOrigin(0.5),
    );
    return scrap;
  }
}
