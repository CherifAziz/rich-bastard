import Phaser from "phaser";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
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
        fontSize: "18px",
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

export function showWeaponTrail(
  scene: Phaser.Scene,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  width: number,
): void {
  const trail = scene.add.graphics().setDepth(DEPTH.fx);
  trail.lineStyle(width, color, 0.5);
  trail.beginPath();
  trail.moveTo(x1, y1);
  trail.lineTo(x2, y2);
  trail.strokePath();

  scene.tweens.add({
    targets: trail,
    alpha: 0,
    duration: 80,
    onComplete: () => {
      trail.destroy();
    },
  });
}

export function showHitImpact(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number = THEME.swing,
): void {
  const burst = scene.add.graphics().setDepth(DEPTH.fx);
  burst.fillStyle(color, 0.75);
  burst.fillCircle(x, y, 4.5);
  burst.lineStyle(1.6, color, 0.95);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.2;
    burst.lineBetween(
      x + Math.cos(angle) * 2,
      y + Math.sin(angle) * 2,
      x + Math.cos(angle) * 11,
      y + Math.sin(angle) * 11,
    );
  }

  scene.tweens.add({
    targets: burst,
    alpha: 0,
    duration: 150,
    onComplete: () => {
      burst.destroy();
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

export function showTradePurchaseFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  quantity: number,
  goldSpent: number,
): void {
  floatText(
    scene,
    x,
    y - 36,
    `BOUGHT ${name} ×${quantity}\n-$${goldSpent}`,
    THEME_HEX.gold,
    34,
    900,
  );
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
