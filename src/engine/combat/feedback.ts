import Phaser from "phaser";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
import type { MeleeAttack } from "../../game/combat/melee";
import { MELEE_SWING_MS } from "../../game/combat/melee";
import { DEPTH } from "../art/depth";

function floatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color: string,
  rise: number,
  duration: number,
): void {
  const label = scene.add
    .text(x, y, message, {
      fontFamily: FONT,
      fontSize: "16px",
      fontStyle: "bold",
      color,
      stroke: THEME_HEX.stroke,
      strokeThickness: 4,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.floatText);

  scene.tweens.add({
    targets: label,
    y: y - rise,
    alpha: 0,
    duration,
    ease: "Quad.easeOut",
    onComplete: () => {
      label.destroy();
    },
  });
}

export function showMeleeSwing(
  scene: Phaser.Scene,
  attack: MeleeAttack,
): void {
  const centerX = attack.originX + attack.dirX * (attack.range / 2);
  const centerY = attack.originY + attack.dirY * (attack.range / 2);
  const angle = Math.atan2(attack.dirY, attack.dirX);

  const swing = scene.add.rectangle(
    centerX,
    centerY,
    attack.range,
    attack.halfWidth * 2,
    THEME.swing,
    0.72,
  );
  swing.setRotation(angle);
  swing.setDepth(DEPTH.fx);

  scene.tweens.add({
    targets: swing,
    alpha: 0,
    duration: MELEE_SWING_MS,
    onComplete: () => {
      swing.destroy();
    },
  });
}

export function showDamageNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
  color: string = THEME_HEX.gold,
): void {
  floatText(scene, x, y - 22, `-${damage}`, color, 30, 480);
}

export function showKillReward(
  scene: Phaser.Scene,
  x: number,
  y: number,
  enemyName: string,
  gold: number,
): void {
  floatText(
    scene,
    x,
    y - 40,
    `${enemyName.toUpperCase()} DEFEATED`,
    THEME_HEX.paper,
    40,
    1100,
  );
  floatText(scene, x, y - 18, `+$${gold}`, THEME_HEX.gold, 44, 1100);
}

export function showPickupFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  quantity: number,
): void {
  floatText(
    scene,
    x,
    y - 28,
    `+ ${name} ×${quantity}`,
    THEME_HEX.pickup,
    30,
    700,
  );
}

export function showSaleFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  quantity: number,
  gold: number,
): void {
  floatText(
    scene,
    x,
    y - 36,
    `SOLD ${name} ×${quantity}\n+$${gold}`,
    THEME_HEX.sale,
    34,
    900,
  );
}

export function showPurchaseFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  weaponName: string,
  goldSpent: number,
  damage: number,
): void {
  floatText(
    scene,
    x,
    y - 36,
    `PURCHASED\n${weaponName}\n-$${goldSpent}\n${weaponName} · ${damage} DMG`,
    THEME_HEX.gold,
    54,
    1400,
  );
}

export function showEnemyMeleeSwing(
  scene: Phaser.Scene,
  attack: {
    originX: number;
    originY: number;
    dirX: number;
    dirY: number;
    range: number;
    halfWidth?: number;
  },
): void {
  const centerX = attack.originX + attack.dirX * (attack.range / 2);
  const centerY = attack.originY + attack.dirY * (attack.range / 2);
  const angle = Math.atan2(attack.dirY, attack.dirX);
  const height = (attack.halfWidth ?? 14) * 2;

  const swing = scene.add.rectangle(
    centerX,
    centerY,
    attack.range,
    height,
    THEME.telegraphFill,
    0.8,
  );
  swing.setStrokeStyle(2, THEME.telegraphEdge, 0.9);
  swing.setRotation(angle);
  swing.setDepth(DEPTH.fx);

  scene.tweens.add({
    targets: swing,
    alpha: 0,
    duration: 110,
    onComplete: () => {
      swing.destroy();
    },
  });
}

export function showMiss(
  scene: Phaser.Scene,
  x: number,
  y: number,
): void {
  floatText(scene, x, y - 22, "MISS", THEME_HEX.miss, 26, 420);
}

export function showYouDied(
  scene: Phaser.Scene,
): Phaser.GameObjects.Container {
  const overlay = scene.add.container(
    scene.cameras.main.width / 2,
    scene.cameras.main.height / 2,
  );
  overlay.setScrollFactor(0).setDepth(DEPTH.hud);
  overlay.add(
    scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, THEME.ink, 0.45),
  );
  overlay.add(
    scene.add
      .text(0, 0, "YOU DIED", {
        fontFamily: FONT,
        fontSize: "48px",
        fontStyle: "bold",
        color: THEME_HEX.damage,
        stroke: THEME_HEX.stroke,
        strokeThickness: 6,
      })
      .setOrigin(0.5),
  );
  return overlay;
}

export function showGoldLost(
  scene: Phaser.Scene,
  x: number,
  y: number,
  goldLost: number,
): void {
  floatText(scene, x, y - 36, `-$${goldLost}`, THEME_HEX.gold, 34, 900);
}
