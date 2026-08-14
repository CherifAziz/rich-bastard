import Phaser from "phaser";
import { THEME } from "../../data/theme";
import { ENEMY_WINDUP_MS } from "../../game/combat/enemyMelee";
import type { EnemyState, PendingEnemyAttack } from "../../game/enemies/enemy";
import { DEPTH } from "../art/depth";
import { cardinalFrom } from "../art/facing";
import { addShadow } from "../art/props";
import { showWeaponTrail } from "../combat/feedback";

const HP_BAR_WIDTH = 28;
const HP_BAR_HEIGHT = 4;

export class EnemyAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: EnemyState;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly flash: Phaser.GameObjects.Ellipse;
  private readonly hpBg: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly isBandit: boolean;
  private frontPose: Phaser.GameObjects.Container | null = null;
  private backPose: Phaser.GameObjects.Container | null = null;
  private sidePose: Phaser.GameObjects.Container | null = null;
  private bladeVisual: Phaser.GameObjects.Container | null = null;
  private blade: Phaser.GameObjects.Rectangle | null = null;
  private bladeGlow: Phaser.GameObjects.Ellipse | null = null;
  private telegraph: Phaser.GameObjects.Container | null = null;
  private telegraphGfx: Phaser.GameObjects.Graphics | null = null;
  private facingX = 0;
  private facingY = 1;
  private strikeDir: { x: number; y: number } | null = null;
  private strikeProgress = 0;
  private strikeStartedAt = 0;
  private strikeDuration = 220;
  private lastTip: { x: number; y: number } | null = null;
  private lastTrailAt = 0;
  private currentBob = 0;
  private destroyed = false;

  constructor(scene: Phaser.Scene, state: EnemyState) {
    this.state = state;
    this.isBandit = state.typeId === "bandit";

    this.sprite = scene.add.rectangle(
      state.x,
      state.y,
      state.width,
      state.height,
      0x000000,
      0,
    );
    this.sprite.setDepth(DEPTH.character);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setDrag(0, 0);
    this.body.setAllowGravity(false);
    this.body.setSize(state.width, state.height);
    this.body.setMass(1);

    this.shadow = addShadow(
      scene,
      state.x,
      state.y + 8,
      state.width * 0.95,
      state.height * 0.48,
    );
    this.visual = scene.add.container(state.x, state.y);
    this.visual.setDepth(DEPTH.character);
    this.flash = scene.add.ellipse(0, 0, state.width + 6, state.height + 8, 0xfff4e0, 0);

    if (this.isBandit) {
      this.buildBandit(scene);
    } else {
      this.buildRat(scene);
    }

    this.hpBg = scene.add
      .rectangle(state.x, state.y - 22, HP_BAR_WIDTH + 2, HP_BAR_HEIGHT + 2, THEME.ink)
      .setStrokeStyle(1, THEME.gold, 0.35)
      .setDepth(DEPTH.character + 1);
    this.hpFill = scene.add
      .rectangle(
        state.x - HP_BAR_WIDTH / 2,
        state.y - 22,
        HP_BAR_WIDTH,
        HP_BAR_HEIGHT,
        THEME.uiHp,
      )
      .setOrigin(0, 0.5)
      .setDepth(DEPTH.character + 1);
  }

  applyVelocity(vx: number, vy: number): void {
    if (!this.state.alive) {
      this.body.setVelocity(0, 0);
      return;
    }

    this.body.setVelocity(vx, vy);
  }

  syncState(): void {
    if (this.destroyed) {
      return;
    }

    this.state.x = this.sprite.x;
    this.state.y = this.sprite.y;

    if (this.strikeDir) {
      this.facingX = this.strikeDir.x;
      this.facingY = this.strikeDir.y;
    } else if (this.state.pendingAttack) {
      this.facingX = this.state.pendingAttack.dirX;
      this.facingY = this.state.pendingAttack.dirY;
    } else if (Math.hypot(this.body.velocity.x, this.body.velocity.y) > 8) {
      this.facingX = this.body.velocity.x;
      this.facingY = this.body.velocity.y;
    }

    const moving = Math.hypot(this.body.velocity.x, this.body.velocity.y) > 8;
    const bob = moving
      ? Math.sin(this.sprite.scene.time.now / 90) * 1.2
      : Math.sin(this.sprite.scene.time.now / 340) * 0.5;

    this.currentBob = bob;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 8);
    this.visual.setPosition(this.sprite.x, this.sprite.y + bob);

    if (this.isBandit) {
      if (this.strikeDir) {
        const now = this.sprite.scene.time.now;
        if (this.strikeStartedAt < 0) {
          this.strikeStartedAt = now;
        }
        const progress = (now - this.strikeStartedAt) / this.strikeDuration;
        if (progress >= 1) {
          this.strikeDir = null;
          this.strikeProgress = 0;
          this.lastTip = null;
          this.applyWindupGlow(0);
        } else {
          this.strikeProgress = Math.max(0, progress);
          this.applyWindupGlow(Math.max(0, 0.35 - progress * 0.7));
        }
      }
      this.applyBanditFacing();
      this.layoutBlade();
      if (this.strikeDir) {
        this.emitBladeTrail(this.sprite.scene);
      }
    } else {
      this.visual.setRotation(Math.atan2(this.facingY, this.facingX) + Math.PI / 2);
    }

    this.hpBg.setPosition(this.sprite.x, this.sprite.y - 22);
    this.hpFill.setPosition(
      this.sprite.x - HP_BAR_WIDTH / 2,
      this.sprite.y - 22,
    );
    this.hpFill.width =
      HP_BAR_WIDTH * (this.state.hp / Math.max(1, this.state.maxHp));
  }

  flashHit(scene: Phaser.Scene): void {
    if (this.destroyed) {
      return;
    }

    this.flash.setAlpha(0.8);
    scene.time.delayedCall(80, () => {
      if (!this.destroyed && this.state.alive) {
        this.flash.setAlpha(0);
      }
    });
  }

  applyKnockback(dirX: number, dirY: number, strength: number): void {
    if (!this.state.alive) {
      return;
    }

    this.body.setVelocity(dirX * strength, dirY * strength);
  }

  showTelegraph(attack: PendingEnemyAttack, now: number): void {
    if (this.destroyed) {
      return;
    }

    const intensity = windupIntensity(attack, now);
    const angle = Math.atan2(attack.dirY, attack.dirX);
    const length = 34 + intensity * 8;

    if (!this.telegraph || !this.telegraphGfx) {
      const scene = this.sprite.scene;
      this.telegraphGfx = scene.add.graphics();
      this.telegraph = scene.add.container(this.sprite.x, this.sprite.y, [
        this.telegraphGfx,
      ]);
      this.telegraph.setDepth(DEPTH.fx);
    }

    this.drawTelegraphCue(length, intensity);
    this.telegraph.setPosition(this.sprite.x, this.sprite.y);
    this.telegraph.setRotation(angle);
    this.telegraph.setVisible(true);
    this.applyWindupGlow(intensity);
  }

  clearTelegraph(): void {
    this.telegraph?.destroy();
    this.telegraph = null;
    this.telegraphGfx = null;
    if (!this.strikeDir) {
      this.applyWindupGlow(0);
    }
  }

  die(scene: Phaser.Scene): void {
    if (this.destroyed) {
      return;
    }

    this.clearTelegraph();
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.hpBg.setVisible(false);
    this.hpFill.setVisible(false);

    const fade = [this.visual, this.shadow];
    if (this.bladeVisual) {
      fade.push(this.bladeVisual);
    }
    scene.tweens.add({
      targets: fade,
      alpha: 0,
      scaleX: 0.35,
      scaleY: 0.35,
      duration: 180,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.clearTelegraph();
    this.hpBg.destroy();
    this.hpFill.destroy();
    this.bladeVisual?.destroy();
    this.visual.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }

  playMeleeStrike(scene: Phaser.Scene, attack: PendingEnemyAttack): void {
    if (this.destroyed || !this.bladeVisual) {
      return;
    }

    const length = Math.hypot(attack.dirX, attack.dirY) || 1;
    this.strikeDir = { x: attack.dirX / length, y: attack.dirY / length };
    this.strikeProgress = 0;
    this.strikeStartedAt = -1;
    this.lastTip = null;
    this.lastTrailAt = scene.time.now;
    this.facingX = this.strikeDir.x;
    this.facingY = this.strikeDir.y;
    this.applyBanditFacing();
    this.layoutBlade();
  }

  private applyBanditFacing(): void {
    const dir = cardinalFrom(this.facingX, this.facingY);
    this.visual.setRotation(0);
    this.visual.setScale(dir === "left" ? -1 : 1, 1);

    if (!this.frontPose || !this.backPose || !this.sidePose) {
      return;
    }

    this.frontPose.setVisible(dir === "down");
    this.backPose.setVisible(dir === "up");
    this.sidePose.setVisible(dir === "left" || dir === "right");
    this.visual.bringToTop(this.flash);
  }

  private restBladeOffset(): { x: number; y: number } {
    const dir = cardinalFrom(this.facingX, this.facingY);
    if (dir === "up") {
      return { x: 8, y: -4 };
    }
    if (dir === "down") {
      return { x: 12, y: 8 };
    }
    if (dir === "left") {
      return { x: -15, y: 2 };
    }
    return { x: 15, y: 2 };
  }

  private restBladeAngle(): number {
    return Math.atan2(this.facingY, this.facingX) + 0.4;
  }

  private layoutBlade(): void {
    if (!this.bladeVisual) {
      return;
    }

    const pose = this.strikeDir
      ? this.bladeStrikePose()
      : this.state.pendingAttack
        ? this.bladeWindupPose(this.state.pendingAttack)
        : {
            x: this.restBladeOffset().x,
            y: this.restBladeOffset().y,
            angle: this.restBladeAngle(),
            trail: false,
          };

    this.bladeVisual.setPosition(
      this.sprite.x + pose.x,
      this.sprite.y + this.currentBob + pose.y,
    );
    this.bladeVisual.setRotation(pose.angle + Math.PI / 2);
    this.bladeVisual.setDepth(
      this.facingY < -0.25 ? DEPTH.character - 1 : DEPTH.character + 1,
    );
  }

  private bladeWindupPose(attack: PendingEnemyAttack): {
    x: number;
    y: number;
    angle: number;
    trail: boolean;
  } {
    const cocked = this.cockedPose(attack.dirX, attack.dirY);
    const rest = this.restBladeOffset();
    const restAngle = this.restBladeAngle();
    const t = smoothstep(
      Math.min(1, windupIntensity(attack, this.sprite.scene.time.now) / 0.38),
    );
    return {
      x: lerp(rest.x, cocked.x, t),
      y: lerp(rest.y, cocked.y, t),
      angle: lerpAngle(restAngle, cocked.angle, t),
      trail: false,
    };
  }

  private cockedPose(
    dirX: number,
    dirY: number,
  ): { x: number; y: number; angle: number } {
    const length = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / length;
    const ny = dirY / length;
    return {
      x: -nx * 8,
      y: -ny * 8,
      angle: Math.atan2(ny, nx) - 0.85,
    };
  }

  private bladeStrikePose(): {
    x: number;
    y: number;
    angle: number;
    trail: boolean;
  } {
    const dir = this.strikeDir ?? { x: 1, y: 0 };
    const cocked = this.cockedPose(dir.x, dir.y);
    const rest = this.restBladeOffset();
    const restAngle = this.restBladeAngle();
    const aim = Math.atan2(dir.y, dir.x);
    const finish = aim + 0.7;
    const p = this.strikeProgress;
    const followX = dir.x * 12;
    const followY = dir.y * 12;

    if (p < 0.48) {
      const t = smoothstep(p / 0.48);
      return {
        x: lerp(cocked.x, followX, t),
        y: lerp(cocked.y, followY, t),
        angle: lerpAngle(cocked.angle, finish, t),
        trail: t > 0.12,
      };
    }

    const t = smoothstep((p - 0.48) / 0.52);
    return {
      x: lerp(followX, rest.x, t),
      y: lerp(followY, rest.y, t),
      angle: lerpAngle(finish, restAngle, t),
      trail: false,
    };
  }

  private emitBladeTrail(scene: Phaser.Scene): void {
    if (!this.bladeVisual || !this.strikeDir) {
      return;
    }

    const pose = this.bladeStrikePose();
    const tip = {
      x: this.bladeVisual.x + Math.cos(pose.angle) * 20,
      y: this.bladeVisual.y + Math.sin(pose.angle) * 20,
    };

    if (!pose.trail) {
      this.lastTip = tip;
      return;
    }

    const now = scene.time.now;
    if (this.lastTip && now - this.lastTrailAt >= 16) {
      showWeaponTrail(
        scene,
        this.lastTip.x,
        this.lastTip.y,
        tip.x,
        tip.y,
        THEME.banditSteel,
        2.4,
      );
      this.lastTrailAt = now;
    }
    this.lastTip = tip;
  }

  private drawTelegraphCue(length: number, intensity: number): void {
    if (!this.telegraphGfx) {
      return;
    }

    const alpha = 0.18 + 0.42 * intensity;
    this.telegraphGfx.clear();
    this.telegraphGfx.lineStyle(1.6, THEME.telegraphEdge, alpha);
    this.telegraphGfx.beginPath();
    this.telegraphGfx.moveTo(10, 0);
    this.telegraphGfx.lineTo(length, 0);
    this.telegraphGfx.strokePath();

    this.telegraphGfx.lineStyle(1.2, THEME.telegraphFill, alpha * 0.85);
    for (let i = 1; i <= 3; i++) {
      const x = 10 + (length - 14) * (i / 4);
      this.telegraphGfx.beginPath();
      this.telegraphGfx.moveTo(x, -3.5);
      this.telegraphGfx.lineTo(x, 3.5);
      this.telegraphGfx.strokePath();
    }

    this.telegraphGfx.fillStyle(THEME.telegraphFill, 0.22 + 0.38 * intensity);
    this.telegraphGfx.fillTriangle(
      length + 7,
      0,
      length - 5,
      -5,
      length - 5,
      5,
    );
  }

  private applyWindupGlow(intensity: number): void {
    if (this.destroyed) {
      return;
    }

    this.flash.setFillStyle(THEME.telegraphFill, 1);
    this.flash.setAlpha(intensity <= 0 ? 0 : 0.08 + 0.28 * intensity);
    this.bladeGlow?.setAlpha(intensity <= 0 ? 0 : 0.12 + 0.4 * intensity);
    this.blade?.setFillStyle(
      intensity <= 0
        ? THEME.banditSteel
        : lerpColor(THEME.banditSteel, THEME.telegraphFill, intensity * 0.55),
    );
    if (intensity <= 0) {
      this.flash.setFillStyle(0xfff4e0, 1);
    }
  }

  private buildRat(scene: Phaser.Scene): void {
    const tail = scene.add.ellipse(8, 11, 16, 4.5, THEME.ratFurDark);
    const body = scene.add.ellipse(0, 2, 16, 12, THEME.ratFur);
    const head = scene.add.circle(0, -7, 6.2, THEME.ratFur);
    const earL = scene.add.ellipse(-4, -12, 5, 6, THEME.ratEar);
    const earR = scene.add.ellipse(4, -12, 5, 6, THEME.ratEar);
    const eyeL = scene.add.circle(-2, -8, 1.3, THEME.ratEye);
    const eyeR = scene.add.circle(2, -8, 1.3, THEME.ratEye);
    const nose = scene.add.circle(0, -5, 1.5, THEME.ratNose);
    this.visual.add([
      tail,
      body,
      earL,
      earR,
      head,
      eyeL,
      eyeR,
      nose,
      this.flash,
    ]);
  }

  private buildBandit(scene: Phaser.Scene): void {
    this.frontPose = this.buildBanditFront(scene);
    this.backPose = this.buildBanditBack(scene);
    this.sidePose = this.buildBanditSide(scene);
    this.visual.add([
      this.frontPose,
      this.backPose,
      this.sidePose,
      this.flash,
    ]);
    this.bladeVisual = scene.add.container(this.state.x, this.state.y);
    this.bladeGlow = scene.add.ellipse(0, -10, 16, 22, THEME.telegraphFill, 0);
    this.blade = scene.add.rectangle(0, 0, 5, 20, THEME.banditSteel);
    this.blade.setOrigin(0.5, 1);
    this.bladeVisual.add([this.bladeGlow, this.blade]);
    this.bladeVisual.setDepth(DEPTH.character + 1);
    this.applyBanditFacing();
    this.layoutBlade();
  }

  private buildBanditFront(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    pose.add([
      scene.add.ellipse(-5, 13, 7, 6, THEME.ink),
      scene.add.ellipse(5, 13, 7, 6, THEME.ink),
      scene.add.ellipse(-10, 3, 6, 12, THEME.banditSkin),
      scene.add.ellipse(0, 3, 17, 20, THEME.banditCloak),
      scene.add.ellipse(0, 1, 10, 10, THEME.banditShirt),
      scene.add.ellipse(10, 3, 6, 12, THEME.banditSkin),
      scene.add.circle(0, -11, 8.5, THEME.banditSkin),
      scene.add.ellipse(0, -16, 17, 7, THEME.banditBandana),
      scene.add.circle(-3, -11, 1.4, THEME.ink),
      scene.add.circle(3, -11, 1.4, THEME.ink),
    ]);
    return pose;
  }

  private buildBanditBack(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    pose.add([
      scene.add.ellipse(-5, 13, 7, 6, THEME.ink),
      scene.add.ellipse(5, 13, 7, 6, THEME.ink),
      scene.add.ellipse(-10, 2, 6, 12, THEME.banditSkin),
      scene.add.ellipse(10, 2, 6, 12, THEME.banditSkin),
      scene.add.ellipse(0, 3, 17, 20, THEME.banditCloak),
      scene.add.circle(0, -11, 8.5, THEME.banditSkin),
      scene.add.ellipse(0, -13, 17, 14, THEME.banditBandana),
      scene.add.ellipse(0, -7, 10, 6, THEME.ink),
    ]);
    return pose;
  }

  private buildBanditSide(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    pose.add([
      scene.add.ellipse(-2, 13, 6, 6, THEME.ink),
      scene.add.ellipse(4, 13, 8, 6, THEME.ink),
      scene.add.ellipse(-5, 3, 5, 11, THEME.banditSkin),
      scene.add.ellipse(1, 3, 12, 20, THEME.banditCloak),
      scene.add.ellipse(3, 1, 7, 9, THEME.banditShirt),
      scene.add.ellipse(3, -11, 12, 14, THEME.banditSkin),
      scene.add.ellipse(0, -15, 14, 10, THEME.banditBandana),
      scene.add.ellipse(9, -10, 3.4, 3, THEME.banditSkin),
      scene.add.circle(7, -12, 1.4, THEME.ink),
      scene.add.ellipse(7, 4, 6, 13, THEME.banditSkin),
    ]);
    return pose;
  }
}

function windupIntensity(attack: PendingEnemyAttack, now: number): number {
  const elapsed = ENEMY_WINDUP_MS - (attack.resolveAt - now);
  return Math.max(0, Math.min(1, elapsed / ENEMY_WINDUP_MS));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  return a + Phaser.Math.Angle.Wrap(b - a) * t;
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function lerpColor(from: number, to: number, t: number): number {
  const ar = (from >> 16) & 0xff;
  const ag = (from >> 8) & 0xff;
  const ab = from & 0xff;
  const br = (to >> 16) & 0xff;
  const bg = (to >> 8) & 0xff;
  const bb = to & 0xff;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const b = Math.round(lerp(ab, bb, t));
  return (r << 16) | (g << 8) | b;
}
