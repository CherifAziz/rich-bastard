import Phaser from "phaser";
import { ITEM_BY_ID } from "../../data/items";
import { getItemQuantity } from "../../game/inventory/inventory";
import {
  dashHudText,
  isDashing,
} from "../../game/player/dash";
import { canMeleeAttack } from "../../game/combat/melee";
import { getEquippedWeapon } from "../../game/player/player";
import type { PlayerState } from "../../game/player/player";

export class GameHud {
  private readonly hp: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly damage: Phaser.GameObjects.Text;
  private readonly inventory: Phaser.GameObjects.Text;
  private readonly attack: Phaser.GameObjects.Text | null;
  private readonly dash: Phaser.GameObjects.Text;
  private readonly coords: Phaser.GameObjects.Text | null;

  constructor(scene: Phaser.Scene, hint: string, showCombat: boolean) {
    const style = {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "16px",
      color: "#d8d8e0",
    };

    scene.add
      .text(16, 16, hint, style)
      .setScrollFactor(0)
      .setDepth(20);

    this.hp = scene.add
      .text(16, 38, "", { ...style, color: "#e05a4f" })
      .setScrollFactor(0)
      .setDepth(20);

    this.gold = scene.add
      .text(16, 58, "", { ...style, color: "#e8c547" })
      .setScrollFactor(0)
      .setDepth(20);

    this.weapon = scene.add
      .text(16, 78, "", { ...style, color: "#d8d8e0" })
      .setScrollFactor(0)
      .setDepth(20);

    this.damage = scene.add
      .text(16, 98, "", { ...style, color: "#e05a4f" })
      .setScrollFactor(0)
      .setDepth(20);

    this.inventory = scene.add
      .text(16, 118, "", { ...style, color: "#f4c430" })
      .setScrollFactor(0)
      .setDepth(20);

    this.dash = scene.add
      .text(16, showCombat ? 158 : 138, "", {
        ...style,
        fontSize: "14px",
        color: "#8ec8e8",
      })
      .setScrollFactor(0)
      .setDepth(20);

    if (showCombat) {
      this.attack = scene.add
        .text(16, 138, "", { ...style, fontSize: "14px", color: "#d8d8e0" })
        .setScrollFactor(0)
        .setDepth(20);
      this.coords = scene.add
        .text(16, 178, "", { ...style, fontSize: "14px", color: "#8a8a96" })
        .setScrollFactor(0)
        .setDepth(20);
    } else {
      this.attack = null;
      this.coords = null;
    }
  }

  refresh(player: PlayerState, time: number): void {
    const weapon = getEquippedWeapon(player);
    this.hp.setText(`HP ${player.hp} / ${player.maxHp}`);
    this.gold.setText(`$${player.gold}`);
    this.weapon.setText(`⚔️ ${weapon.name}`);
    this.damage.setText(`DMG ${weapon.damage}`);
    this.inventory.setText(
      Object.values(ITEM_BY_ID)
        .map(
          (item) => `${item.name} ×${getItemQuantity(player.inventory, item.id)}`,
        )
        .join("  "),
    );
    this.dash.setText(dashHudText(player, time));

    if (this.attack) {
      this.attack.setText(
        isDashing(player, time) || !canMeleeAttack(time, player.lastAttackAt)
          ? "Attaque…"
          : "Attaque prête",
      );
    }

    if (this.coords) {
      this.coords.setText(`${Math.round(player.x)}, ${Math.round(player.y)}`);
    }
  }
}
