import Phaser from "phaser";
import type { GroundLoot } from "../../game/rewards/rewards";

const LOOT_COLORS: Record<string, number> = {
  cheese: 0xf4c430,
  scrap: 0xb8b8c0,
};

export class LootDrop {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly label: Phaser.GameObjects.Text;
  readonly loot: GroundLoot;

  constructor(scene: Phaser.Scene, loot: GroundLoot) {
    this.loot = loot;

    this.sprite = scene.add.circle(
      loot.x,
      loot.y,
      9,
      LOOT_COLORS[loot.itemId] ?? 0xd8d8e0,
    );
    this.sprite.setStrokeStyle(2, 0xc49a22);
    this.sprite.setDepth(11);

    this.label = scene.add
      .text(loot.x, loot.y - 16, loot.name, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "11px",
        color: "#fff4c0",
        stroke: "#1a1208",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(11);
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
    this.label.destroy();
    this.sprite.destroy();
  }
}
