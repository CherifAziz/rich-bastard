import Phaser from "phaser";
import { THEME } from "../../data/theme";
import type { MeleeAttack } from "../../game/combat/melee";
import {
  type PlayerState,
  getEquippedWeapon,
  velocityFromInput,
} from "../../game/player/player";
import { DEPTH } from "../art/depth";
import { cardinalFrom } from "../art/facing";
import { addShadow } from "../art/props";
import { showWeaponTrail } from "../combat/feedback";

type WeaponMotion = {
  dirX: number;
  dirY: number;
  range: number;
  progress: number;
};

export class PlayerAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: PlayerState;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly weaponVisual: Phaser.GameObjects.Container;
  private readonly frontPose: Phaser.GameObjects.Container;
  private readonly backPose: Phaser.GameObjects.Container;
  private readonly sidePose: Phaser.GameObjects.Container;
  private readonly frontArms: Phaser.GameObjects.Ellipse[];
  private readonly backArms: Phaser.GameObjects.Ellipse[];
  private readonly sideArms: Phaser.GameObjects.Ellipse[];
  private readonly flash: Phaser.GameObjects.Ellipse;
  private lastWeaponId: string | null = null;
  private weaponLength = 20;
  private trailColor: number = THEME.swing;
  private trailWidth = 2;
  private motion: WeaponMotion | null = null;
  private attackStartedAt = 0;
  private attackDuration = 0;
  private lastTip: { x: number; y: number } | null = null;
  private lastTrailAt = 0;
  private currentBob = 0;

  constructor(scene: Phaser.Scene, state: PlayerState) {
    this.state = state;

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
    this.body.setMass(4);

    this.shadow = addShadow(scene, state.x, state.y + 11, 24, 12);
    this.visual = scene.add.container(state.x, state.y);
    this.visual.setDepth(DEPTH.character);
    this.weaponVisual = scene.add.container(state.x, state.y);
    this.weaponVisual.setDepth(DEPTH.character + 1);

    this.frontArms = [];
    this.backArms = [];
    this.sideArms = [];
    this.frontPose = this.buildFront(scene);
    this.backPose = this.buildBack(scene);
    this.sidePose = this.buildSide(scene);

    this.flash = scene.add.ellipse(0, 0, 28, 34, 0xfff4e0, 0);

    this.visual.add([
      this.frontPose,
      this.backPose,
      this.sidePose,
      this.flash,
    ]);
    this.redrawWeapon();
    this.applyFacing();
    this.layoutWeapon();
  }

  applyMoveInput(dirX: number, dirY: number): void {
    const velocity = velocityFromInput(dirX, dirY, this.state.speed);
    this.body.setVelocity(velocity.x, velocity.y);

    if (dirX !== 0 || dirY !== 0) {
      this.state.facingX = dirX;
      this.state.facingY = dirY;
    }
  }

  applyVelocity(vx: number, vy: number): void {
    this.body.setVelocity(vx, vy);
  }

  playMeleeAttack(
    scene: Phaser.Scene,
    attack: Pick<MeleeAttack, "dirX" | "dirY" | "range">,
  ): void {
    const length = Math.hypot(attack.dirX, attack.dirY) || 1;
    const dirX = attack.dirX / length;
    const dirY = attack.dirY / length;
    const weapon = getEquippedWeapon(this.state);
    const duration =
      weapon.id === "iron_spear"
        ? 400
        : weapon.id === "rusty_bat"
          ? 280
          : 170;

    this.motion = { dirX, dirY, range: attack.range, progress: 0 };
    this.attackStartedAt = -1;
    this.attackDuration = duration;
    this.lastTip = null;
    this.lastTrailAt = scene.time.now;
    this.state.facingX = dirX;
    this.state.facingY = dirY;
    this.applyFacing();
    this.layoutWeapon();
  }

  flashDash(scene: Phaser.Scene): void {
    this.visual.setAlpha(0.62);
    this.weaponVisual.setAlpha(0.62);

    for (let i = 1; i <= 2; i++) {
      const ghost = scene.add.ellipse(
        this.sprite.x - this.state.dashDirX * i * 14,
        this.sprite.y - this.state.dashDirY * i * 14,
        18,
        24,
        THEME.playerTunic,
        0.32 / i,
      );
      ghost.setDepth(DEPTH.character - 1);
      scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 140,
        onComplete: () => {
          ghost.destroy();
        },
      });
    }
  }

  endDashVisual(): void {
    this.visual.setAlpha(1);
    this.weaponVisual.setAlpha(1);
  }

  flashHit(scene: Phaser.Scene): void {
    this.flash.setAlpha(0.85);
    scene.time.delayedCall(90, () => {
      this.flash.setAlpha(0);
    });
  }

  applyKnockback(dirX: number, dirY: number, strength: number): void {
    this.body.setVelocity(dirX * strength, dirY * strength);
  }

  placeAt(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.body.reset(x, y);
    this.syncState();
    this.tickVisual(0, false);
  }

  syncState(): void {
    this.state.x = this.sprite.x;
    this.state.y = this.sprite.y;
  }

  tickVisual(_time: number, moving: boolean): void {
    if (this.state.equippedWeaponId !== this.lastWeaponId) {
      this.redrawWeapon();
    }

    const time = this.visual.scene.time.now;
    this.applyFacing();
    this.currentBob = moving
      ? Math.sin(time / 80) * 1.5
      : Math.sin(time / 320) * 0.6;
    const arm = moving ? Math.sin(time / 90) * 2.2 : 0;
    const arms = this.visibleArms();
    arms[0].y = arms[0].y + arm;
    arms[1].y = arms[1].y - arm;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 11);
    this.visual.setPosition(this.sprite.x, this.sprite.y + this.currentBob);

    if (this.motion) {
      if (this.attackStartedAt < 0) {
        this.attackStartedAt = time;
      }
      const progress = (time - this.attackStartedAt) / this.attackDuration;
      if (progress >= 1) {
        this.motion = null;
        this.lastTip = null;
      } else {
        this.motion.progress = Math.max(0, progress);
        this.layoutWeapon();
        this.emitTrail(this.visual.scene);
        return;
      }
    }

    this.layoutWeapon();
  }

  private visibleArms(): Phaser.GameObjects.Ellipse[] {
    const dir = cardinalFrom(this.state.facingX, this.state.facingY);
    if (dir === "up") {
      return this.backArms;
    }
    if (dir === "down") {
      return this.frontArms;
    }
    return this.sideArms;
  }

  private applyFacing(): void {
    const dir = cardinalFrom(this.state.facingX, this.state.facingY);
    this.visual.setScale(dir === "left" ? -1 : 1, 1);
    this.resetArmRests();

    this.frontPose.setVisible(dir === "down");
    this.backPose.setVisible(dir === "up");
    this.sidePose.setVisible(dir === "left" || dir === "right");
  }

  private restHandOffset(): { x: number; y: number } {
    const dir = cardinalFrom(this.state.facingX, this.state.facingY);
    if (dir === "up") {
      return { x: 8, y: -3 };
    }
    if (dir === "down") {
      return { x: 11, y: 6 };
    }
    if (dir === "left") {
      return { x: -14, y: 2 };
    }
    return { x: 14, y: 2 };
  }

  private restTipAngle(): number {
    return Math.atan2(this.state.facingY, this.state.facingX) + 0.36;
  }

  private layoutWeapon(): void {
    const pose = this.motion
      ? this.attackPose(this.motion)
      : {
          x: this.restHandOffset().x,
          y: this.restHandOffset().y,
          angle: this.restTipAngle(),
          trail: false,
        };

    this.weaponVisual.setPosition(
      this.sprite.x + pose.x,
      this.sprite.y + this.currentBob + pose.y,
    );
    this.weaponVisual.setRotation(pose.angle + Math.PI / 2);

    const behind = this.motion
      ? this.motion.dirY < -0.25
      : cardinalFrom(this.state.facingX, this.state.facingY) === "up";
    this.weaponVisual.setDepth(
      behind ? DEPTH.character - 1 : DEPTH.character + 1,
    );
  }

  private attackPose(motion: WeaponMotion): {
    x: number;
    y: number;
    angle: number;
    trail: boolean;
  } {
    const weapon = getEquippedWeapon(this.state);
    if (weapon.id === "iron_spear") {
      return this.spearPose(motion);
    }
    if (weapon.id === "rusty_bat") {
      return this.slashPose(motion, 1.55, 0.55, 0.2, 0.48, 8);
    }
    return this.slashPose(motion, 0.95, 0.32, 0.12, 0.52, 10);
  }

  private slashPose(
    motion: WeaponMotion,
    arc: number,
    windupArc: number,
    windupEnd: number,
    slashEnd: number,
    handDist: number,
  ): { x: number; y: number; angle: number; trail: boolean } {
    const rest = this.restHandOffset();
    const restAngle = this.restTipAngle();
    const aim = Math.atan2(motion.dirY, motion.dirX);
    const p = motion.progress;
    const handX = motion.dirX * handDist;
    const handY = motion.dirY * handDist;
    const start = aim - windupArc;
    const finish = aim + (arc - windupArc);

    if (p < windupEnd) {
      const t = smoothstep(p / windupEnd);
      return {
        x: lerp(rest.x, handX, t),
        y: lerp(rest.y, handY, t),
        angle: lerpAngle(restAngle, start, t),
        trail: false,
      };
    }

    if (p < slashEnd) {
      const t = smoothstep((p - windupEnd) / (slashEnd - windupEnd));
      return {
        x: handX,
        y: handY,
        angle: lerpAngle(start, finish, t),
        trail: true,
      };
    }

    const t = smoothstep((p - slashEnd) / (1 - slashEnd));
    return {
      x: lerp(handX, rest.x, t),
      y: lerp(handY, rest.y, t),
      angle: lerpAngle(finish, restAngle, t),
      trail: false,
    };
  }

  private spearPose(
    motion: WeaponMotion,
  ): { x: number; y: number; angle: number; trail: boolean } {
    const rest = this.restHandOffset();
    const restAngle = this.restTipAngle();
    const aim = Math.atan2(motion.dirY, motion.dirX);
    const p = motion.progress;
    const grip = 8;
    const tipTarget = this.state.width / 2 + motion.range;
    const thrustMax = Math.max(22, tipTarget - grip - this.weaponLength);
    const alignEnd = 0.1;
    const thrustEnd = 0.36;
    const holdEnd = 0.48;

    const along = (distance: number) => ({
      x: motion.dirX * distance,
      y: motion.dirY * distance,
    });

    if (p < alignEnd) {
      const t = smoothstep(p / alignEnd);
      const hand = along(grip);
      return {
        x: lerp(rest.x, hand.x, t),
        y: lerp(rest.y, hand.y, t),
        angle: lerpAngle(restAngle, aim, t),
        trail: false,
      };
    }

    if (p < thrustEnd) {
      const t = smoothstep((p - alignEnd) / (thrustEnd - alignEnd));
      const hand = along(grip + thrustMax * t);
      return { x: hand.x, y: hand.y, angle: aim, trail: true };
    }

    if (p < holdEnd) {
      const hand = along(grip + thrustMax);
      return { x: hand.x, y: hand.y, angle: aim, trail: false };
    }

    const t = smoothstep((p - holdEnd) / (1 - holdEnd));
    const extended = along(grip + thrustMax);
    return {
      x: lerp(extended.x, rest.x, t),
      y: lerp(extended.y, rest.y, t),
      angle: lerpAngle(aim, restAngle, t),
      trail: false,
    };
  }

  private emitTrail(scene: Phaser.Scene): void {
    if (!this.motion) {
      return;
    }

    const pose = this.attackPose(this.motion);
    if (!pose.trail) {
      this.lastTip = this.tipPosition(pose.angle);
      return;
    }

    const tip = this.tipPosition(pose.angle);
    const now = scene.time.now;
    if (this.lastTip && now - this.lastTrailAt >= 16) {
      const dx = tip.x - this.lastTip.x;
      const dy = tip.y - this.lastTip.y;
      if (dx * dx + dy * dy > 2) {
        showWeaponTrail(
          scene,
          this.lastTip.x,
          this.lastTip.y,
          tip.x,
          tip.y,
          this.trailColor,
          this.trailWidth,
        );
        this.lastTrailAt = now;
      }
    }
    this.lastTip = tip;
  }

  private tipPosition(angle: number): { x: number; y: number } {
    return {
      x: this.weaponVisual.x + Math.cos(angle) * this.weaponLength,
      y: this.weaponVisual.y + Math.sin(angle) * this.weaponLength,
    };
  }

  private resetArmRests(): void {
    this.frontArms[0].y = 3;
    this.frontArms[1].y = 3;
    this.backArms[0].y = 2;
    this.backArms[1].y = 2;
    this.sideArms[0].y = 3;
    this.sideArms[1].y = 4;
  }

  private buildFront(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    const bootL = scene.add.ellipse(-5, 13, 7, 7, THEME.playerBoot);
    const bootR = scene.add.ellipse(5, 13, 7, 7, THEME.playerBoot);
    const armL = scene.add.ellipse(-11, 3, 6, 12, THEME.playerSkin);
    const armR = scene.add.ellipse(11, 3, 6, 12, THEME.playerSkin);
    const body = scene.add.ellipse(0, 3, 18, 21, THEME.playerTunic);
    const shirt = scene.add.ellipse(0, 0, 12, 10, THEME.playerShirt);
    const head = scene.add.circle(0, -12, 9, THEME.playerSkin);
    const hair = scene.add.ellipse(0, -18, 16, 8, THEME.playerHair);
    const brow = scene.add.ellipse(0, -14.5, 12, 3, THEME.playerHair);
    const eyeL = scene.add.circle(-3.2, -12, 1.5, THEME.ink);
    const eyeR = scene.add.circle(3.2, -12, 1.5, THEME.ink);
    const mouth = scene.add.ellipse(0, -8.2, 4.5, 1.8, THEME.playerBoot);
    pose.add([
      bootL,
      bootR,
      armL,
      body,
      shirt,
      armR,
      head,
      hair,
      brow,
      eyeL,
      eyeR,
      mouth,
    ]);
    this.frontArms.push(armL, armR);
    return pose;
  }

  private buildBack(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    const bootL = scene.add.ellipse(-5, 13, 7, 7, THEME.playerBoot);
    const bootR = scene.add.ellipse(5, 13, 7, 7, THEME.playerBoot);
    const armL = scene.add.ellipse(-10, 2, 6, 12, THEME.playerSkin);
    const armR = scene.add.ellipse(10, 2, 6, 12, THEME.playerSkin);
    const body = scene.add.ellipse(0, 3, 18, 21, THEME.playerTunic);
    const head = scene.add.circle(0, -12, 9, THEME.playerSkin);
    const hair = scene.add.ellipse(0, -14, 18, 16, THEME.playerHair);
    const nape = scene.add.ellipse(0, -7, 11, 7, THEME.playerHair);
    pose.add([bootL, bootR, armL, armR, body, head, hair, nape]);
    this.backArms.push(armL, armR);
    return pose;
  }

  private buildSide(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const pose = scene.add.container(0, 0);
    const bootBack = scene.add.ellipse(-2, 13, 6, 6, THEME.playerBoot);
    const bootFront = scene.add.ellipse(4, 13, 8, 7, THEME.playerBoot);
    const armBack = scene.add.ellipse(-5, 3, 5, 11, THEME.playerSkin);
    const body = scene.add.ellipse(1, 3, 12, 20, THEME.playerTunic);
    const shirt = scene.add.ellipse(3, 0, 7, 9, THEME.playerShirt);
    const head = scene.add.ellipse(3, -12, 12, 14, THEME.playerSkin);
    const hair = scene.add.ellipse(-1, -15, 14, 13, THEME.playerHair);
    const hairTop = scene.add.ellipse(2, -19, 10, 6, THEME.playerHair);
    const ear = scene.add.ellipse(1, -12, 4, 5, THEME.playerSkin);
    const nose = scene.add.ellipse(9.2, -11, 3.6, 3.2, THEME.playerSkin);
    const eye = scene.add.circle(7, -13, 1.5, THEME.ink);
    const armFront = scene.add.ellipse(7, 4, 6, 13, THEME.playerSkin);
    pose.add([
      bootBack,
      armBack,
      body,
      shirt,
      bootFront,
      head,
      hair,
      hairTop,
      ear,
      nose,
      eye,
      armFront,
    ]);
    this.sideArms.push(armBack, armFront);
    return pose;
  }

  private redrawWeapon(): void {
    this.weaponVisual.removeAll(true);
    this.lastWeaponId = this.state.equippedWeaponId;
    const scene = this.visual.scene;
    const gfx = scene.add.graphics();
    const weapon = getEquippedWeapon(this.state);

    if (weapon.id === "rusty_bat") {
      gfx.fillStyle(THEME.playerBat, 1);
      gfx.fillRect(-2.6, -10, 5.2, 20);
      gfx.fillStyle(THEME.playerBatDark, 1);
      gfx.fillEllipse(0, -18, 11, 16);
      this.weaponLength = 26;
      this.trailColor = THEME.playerBat;
      this.trailWidth = 3.4;
    } else if (weapon.id === "iron_spear") {
      gfx.fillStyle(THEME.playerSpear, 1);
      gfx.beginPath();
      gfx.moveTo(0, -64);
      gfx.lineTo(4.6, -38);
      gfx.lineTo(1.8, -30);
      gfx.lineTo(1.6, 8);
      gfx.lineTo(-1.6, 8);
      gfx.lineTo(-1.8, -30);
      gfx.lineTo(-4.6, -38);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(THEME.playerSpearTip, 1);
      gfx.fillRect(-2.2, -40, 4.4, 14);
      gfx.beginPath();
      gfx.moveTo(0, -64);
      gfx.lineTo(4.8, -37);
      gfx.lineTo(1.8, -28);
      gfx.lineTo(-1.8, -28);
      gfx.lineTo(-4.8, -37);
      gfx.closePath();
      gfx.fillPath();
      this.weaponLength = 64;
      this.trailColor = THEME.playerSpearTip;
      this.trailWidth = 2;
    } else {
      gfx.fillStyle(THEME.playerBatDark, 1);
      gfx.fillRect(-1.5, -2, 3, 10);
      gfx.fillStyle(THEME.playerKnife, 1);
      gfx.fillTriangle(0, -20, -3.4, 0, 3.4, 0);
      this.weaponLength = 20;
      this.trailColor = THEME.swing;
      this.trailWidth = 1.8;
    }

    this.weaponVisual.add(gfx);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  const delta = Phaser.Math.Angle.Wrap(b - a);
  return a + delta * t;
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
