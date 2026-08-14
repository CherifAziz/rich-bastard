import Phaser from "phaser";
import { ITEM_BY_ID } from "../../data/items";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
import { getItemQuantity } from "../../game/inventory/inventory";
import {
  DASH_COOLDOWN_MS,
  canDash,
  isDashing,
} from "../../game/player/dash";
import { getEquippedWeapon } from "../../game/player/player";
import type { PlayerState } from "../../game/player/player";
import { DEPTH } from "../art/depth";

const PANEL_W = 236;
const BAR_W = 204;

export class GameHud {
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly inventory: Phaser.GameObjects.Text;
  private readonly dashFill: Phaser.GameObjects.Rectangle;
  private readonly dashText: Phaser.GameObjects.Text;
  private readonly coords: Phaser.GameObjects.Text | null;

  constructor(scene: Phaser.Scene, hint: string, showCombat: boolean) {
    const panel = scene.add.container(14, 14);
    panel.setScrollFactor(0).setDepth(DEPTH.hud);

    const bg = scene.add.rectangle(
      PANEL_W / 2,
      74,
      PANEL_W,
      148,
      THEME.uiBg,
      0.78,
    );
    bg.setStrokeStyle(2, THEME.gold, 0.55);

    const hpBg = scene.add
      .rectangle(16, 38, BAR_W, 10, THEME.uiHpBg)
      .setOrigin(0, 0.5);
    this.hpFill = scene.add
      .rectangle(16, 38, BAR_W, 10, THEME.uiHp)
      .setOrigin(0, 0.5);

    this.hpText = scene.add.text(16, 18, "", {
      fontFamily: FONT,
      fontSize: "13px",
      fontStyle: "bold",
      color: THEME_HEX.hp,
    });
    this.gold = scene.add.text(16, 50, "", {
      fontFamily: FONT,
      fontSize: "15px",
      fontStyle: "bold",
      color: THEME_HEX.gold,
    });
    this.weapon = scene.add.text(16, 70, "", {
      fontFamily: FONT,
      fontSize: "13px",
      color: THEME_HEX.uiText,
    });
    this.inventory = scene.add.text(16, 90, "", {
      fontFamily: FONT,
      fontSize: "13px",
      color: THEME_HEX.goldSoft,
    });

    const dashBg = scene.add
      .rectangle(16, 118, BAR_W, 8, THEME.uiDashBg)
      .setOrigin(0, 0.5);
    this.dashFill = scene.add
      .rectangle(16, 118, BAR_W, 8, THEME.uiDash)
      .setOrigin(0, 0.5);
    this.dashText = scene.add.text(16, 128, "", {
      fontFamily: FONT,
      fontSize: "11px",
      color: THEME_HEX.muted,
    });

    panel.add([
      bg,
      hpBg,
      this.hpFill,
      this.hpText,
      this.gold,
      this.weapon,
      this.inventory,
      dashBg,
      this.dashFill,
      this.dashText,
    ]);

    scene.add
      .text(scene.scale.width / 2, scene.scale.height - 18, hint, {
        fontFamily: FONT,
        fontSize: "12px",
        color: THEME_HEX.muted,
        stroke: THEME_HEX.stroke,
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);

    if (import.meta.env.DEV && showCombat) {
      this.coords = scene.add
        .text(16, 168, "", {
          fontFamily: FONT,
          fontSize: "11px",
          color: THEME_HEX.muted,
        })
        .setScrollFactor(0)
        .setDepth(DEPTH.hud);
    } else {
      this.coords = null;
    }
  }

  refresh(player: PlayerState, time: number): void {
    const weapon = getEquippedWeapon(player);
    const hpRatio = player.hp / Math.max(1, player.maxHp);
    this.hpFill.width = BAR_W * hpRatio;
    this.hpText.setText(`HP  ${player.hp} / ${player.maxHp}`);
    this.gold.setText(`$ ${player.gold}`);
    this.weapon.setText(`${weapon.name}  ·  ${weapon.damage} DMG`);
    this.inventory.setText(
      Object.values(ITEM_BY_ID)
        .map(
          (item) =>
            `${item.name} ×${getItemQuantity(player.inventory, item.id)}`,
        )
        .join("    "),
    );

    if (isDashing(player, time)) {
      this.dashFill.width = BAR_W;
      this.dashFill.setFillStyle(THEME.goldSoft);
      this.dashText.setText("DASH");
    } else if (canDash(player, time)) {
      this.dashFill.width = BAR_W;
      this.dashFill.setFillStyle(THEME.uiDash);
      this.dashText.setText("DASH READY");
    } else {
      const remaining = Math.max(0, player.dashCooldownUntil - time);
      const ratio = 1 - remaining / DASH_COOLDOWN_MS;
      this.dashFill.width = BAR_W * ratio;
      this.dashFill.setFillStyle(THEME.uiDash);
      this.dashText.setText(`DASH ${ (remaining / 1000).toFixed(1)}s`);
    }

    if (this.coords) {
      this.coords.setText(`${Math.round(player.x)}, ${Math.round(player.y)}`);
    }
  }
}
