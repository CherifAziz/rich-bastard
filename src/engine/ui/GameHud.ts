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

const PANEL_W = 228;
const PANEL_H = 108;
const HP_W = 126;
const DASH_W = 72;

export class GameHud {
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly inventory: Phaser.GameObjects.Text;
  private readonly dashFill: Phaser.GameObjects.Rectangle;
  private readonly dashText: Phaser.GameObjects.Text;
  private readonly coords: Phaser.GameObjects.Text;
  private readonly debugKey: Phaser.Input.Keyboard.Key | null;
  private debug = false;

  constructor(scene: Phaser.Scene, hint: string) {
    const panel = scene.add.container(10, 10);
    panel.setScrollFactor(0).setDepth(DEPTH.hud);

    const bg = scene.add.rectangle(PANEL_W / 2, PANEL_H / 2, PANEL_W, PANEL_H, THEME.uiBg, 0.8);
    bg.setStrokeStyle(1, THEME.gold, 0.5);

    this.hpText = scene.add.text(10, 8, "", {
      fontFamily: FONT,
      fontSize: "12px",
      fontStyle: "bold",
      color: THEME_HEX.hp,
    });
    this.gold = scene.add.text(PANEL_W - 10, 8, "", {
      fontFamily: FONT,
      fontSize: "13px",
      fontStyle: "bold",
      color: THEME_HEX.gold,
    });
    this.gold.setOrigin(1, 0);

    const hpBg = scene.add.rectangle(10, 32, HP_W, 7, THEME.uiHpBg).setOrigin(0, 0.5);
    this.hpFill = scene.add.rectangle(10, 32, HP_W, 7, THEME.uiHp).setOrigin(0, 0.5);

    this.weapon = scene.add.text(10, 42, "", {
      fontFamily: FONT,
      fontSize: "12px",
      color: THEME_HEX.uiText,
    });
    this.inventory = scene.add.text(10, 62, "", {
      fontFamily: FONT,
      fontSize: "12px",
      color: THEME_HEX.goldSoft,
    });

    const dashBg = scene.add
      .rectangle(PANEL_W - 10 - DASH_W, 84, DASH_W, 7, THEME.uiDashBg)
      .setOrigin(0, 0.5);
    this.dashFill = scene.add
      .rectangle(PANEL_W - 10 - DASH_W, 84, DASH_W, 7, THEME.uiDash)
      .setOrigin(0, 0.5);
    this.dashText = scene.add.text(PANEL_W - 10, 92, "", {
      fontFamily: FONT,
      fontSize: "10px",
      color: THEME_HEX.muted,
    });
    this.dashText.setOrigin(1, 0);

    panel.add([
      bg,
      this.hpText,
      this.gold,
      hpBg,
      this.hpFill,
      this.weapon,
      this.inventory,
      dashBg,
      this.dashFill,
      this.dashText,
    ]);

    scene.add
      .text(scene.scale.width / 2, scene.scale.height - 16, hint, {
        fontFamily: FONT,
        fontSize: "11px",
        color: THEME_HEX.muted,
        stroke: THEME_HEX.stroke,
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);

    this.coords = scene.add
      .text(12, PANEL_H + 14, "", {
        fontFamily: FONT,
        fontSize: "11px",
        color: THEME_HEX.muted,
      })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setVisible(false);

    const keyboard = scene.input.keyboard;
    this.debugKey = keyboard
      ? keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3)
      : null;
  }

  refresh(player: PlayerState, time: number): void {
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debug = !this.debug;
      this.coords.setVisible(this.debug);
    }

    const weapon = getEquippedWeapon(player);
    this.hpFill.width = HP_W * (player.hp / Math.max(1, player.maxHp));
    this.hpText.setText(`HP ${player.hp}/${player.maxHp}`);
    this.gold.setText(`$${player.gold}`);
    this.weapon.setText(`${weapon.name} · ${weapon.damage} DMG`);
    this.inventory.setText(
      Object.values(ITEM_BY_ID)
        .map(
          (item) =>
            `${item.name} ×${getItemQuantity(player.inventory, item.id)}`,
        )
        .join("  "),
    );

    if (isDashing(player, time)) {
      this.dashFill.width = DASH_W;
      this.dashFill.setFillStyle(THEME.goldSoft);
      this.dashText.setText("DASH");
    } else if (canDash(player, time)) {
      this.dashFill.width = DASH_W;
      this.dashFill.setFillStyle(THEME.uiDash);
      this.dashText.setText("READY");
    } else {
      const remaining = Math.max(0, player.dashCooldownUntil - time);
      this.dashFill.width = DASH_W * (1 - remaining / DASH_COOLDOWN_MS);
      this.dashFill.setFillStyle(THEME.uiDash);
      this.dashText.setText(`${(remaining / 1000).toFixed(1)}s`);
    }

    if (this.debug) {
      this.coords.setText(`${Math.round(player.x)}, ${Math.round(player.y)}`);
    }
  }
}
