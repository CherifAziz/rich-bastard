import Phaser from "phaser";
import type { MeleeAttack } from "../../game/combat/melee";
import { MELEE_SWING_MS } from "../../game/combat/melee";

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
    0xfff2a8,
    0.8,
  );
  swing.setRotation(angle);
  swing.setDepth(12);

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
): void {
  const label = scene.add
    .text(x, y - 22, `-${damage}`, {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffd36a",
      stroke: "#1a1208",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(16);

  scene.tweens.add({
    targets: label,
    y: y - 52,
    alpha: 0,
    duration: 480,
    ease: "Quad.easeOut",
    onComplete: () => {
      label.destroy();
    },
  });
}

export function showKillReward(
  scene: Phaser.Scene,
  x: number,
  y: number,
  enemyName: string,
  gold: number,
): void {
  const lines = [`${enemyName.toUpperCase()} DEFEATED`, `+$${gold}`];

  lines.forEach((line, index) => {
    const isTitle = index === 0;
    const stack = (lines.length - 1 - index) * 22;
    const label = scene.add
      .text(x, y - 36 - stack, line, {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: isTitle ? "16px" : "18px",
        fontStyle: "bold",
        color: isTitle ? "#f0f0f4" : "#e8c547",
        stroke: "#1a1208",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(17);

    scene.tweens.add({
      targets: label,
      y: y - 80 - stack,
      alpha: 0,
      duration: 1100,
      delay: index * 40,
      ease: "Quad.easeOut",
      onComplete: () => {
        label.destroy();
      },
    });
  });
}

export function showPickupFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  quantity: number,
): void {
  const label = scene.add
    .text(x, y - 28, `+ ${name} ×${quantity}`, {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f4c430",
      stroke: "#1a1208",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(17);

  scene.tweens.add({
    targets: label,
    y: y - 58,
    alpha: 0,
    duration: 700,
    ease: "Quad.easeOut",
    onComplete: () => {
      label.destroy();
    },
  });
}
