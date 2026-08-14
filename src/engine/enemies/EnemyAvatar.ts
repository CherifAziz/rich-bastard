import Phaser from "phaser";
import { THEME } from "../../data/theme";
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
  private telegraph: Phaser.GameObjects.Container | null = null;
  private telegraphFill: Phaser.GameObjects.Rectangle | null = null;
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
        } else {
          this.strikeProgress = Math.max(0, progress);
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

    const centerX = attack.originX + attack.dirX * (attack.range / 2);
    const centerY = attack.originY + attack.dirY * (attack.range / 2);
    const angle = Math.atan2(attack.dirY, attack.dirX);
    const pulse = 0.34 + 0.24 * Math.abs(Math.sin(now / 70));
    const height = attack.halfWidth * 2;

    if (!this.telegraph || !this.telegraphFill) {
      const scene = this.sprite.scene;
      this.telegraphFill = scene.add.rectangle(
        0,
        0,
        attack.range,
        height,
        THEME.telegraphFill,
        1,
      );
      this.telegraphFill.setStrokeStyle(3, THEME.telegraphEdge, 1);
      const chevron = scene.add.triangle(
        attack.range / 2 - 10,
        0,
        10,
        0,
        -8,
        -attack.halfWidth + 3,
        -8,
        attack.halfWidth - 3,
        THEME.telegraphEdge,
      );
      this.telegraph = scene.add.container(centerX, centerY, [
        this.telegraphFill,
        chevron,
      ]);
      this.telegraph.setDepth(DEPTH.telegraph);
    }

    this.telegraph.setPosition(centerX, centerY);
    this.telegraph.setRotation(angle);
    this.telegraphFill.setAlpha(pulse);
    this.telegraph.setVisible(true);
  }

  clearTelegraph(): void {
    this.telegraph?.destroy();
    this.telegraph = null;
    this.telegraphFill = null;
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

  private bladeStrikePose(): {
    x: number;
    y: number;
    angle: number;
    trail: boolean;
  } {
    const dir = this.strikeDir ?? { x: 1, y: 0 };
    const rest = this.restBladeOffset();
    const restAngle = this.restBladeAngle();
    const aim = Math.atan2(dir.y, dir.x);
    const start = aim - 0.85;
    const finish = aim + 0.7;
    const p = this.strikeProgress;
    const handX = dir.x * 12;
    const handY = dir.y * 12;

    if (p < 0.12) {
      const t = p / 0.12;
      return {
        x: rest.x + (handX - rest.x) * t,
        y: rest.y + (handY - rest.y) * t,
        angle: restAngle + Phaser.Math.Angle.Wrap(start - restAngle) * t,
        trail: false,
      };
    }

    if (p < 0.55) {
      const t = (p - 0.12) / 0.43;
      const eased = t * t * (3 - 2 * t);
      return {
        x: handX,
        y: handY,
        angle: start + Phaser.Math.Angle.Wrap(finish - start) * eased,
        trail: true,
      };
    }

    const t = (p - 0.55) / 0.45;
    const eased = t * t * (3 - 2 * t);
    return {
      x: handX + (rest.x - handX) * eased,
      y: handY + (rest.y - handY) * eased,
      angle: finish + Phaser.Math.Angle.Wrap(restAngle - finish) * eased,
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
    this.bladeVisual.add(
      scene.add.rectangle(0, 0, 5, 20, THEME.banditSteel).setOrigin(0.5, 1),
    );
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
