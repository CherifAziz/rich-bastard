import Phaser from "phaser";
import { THEME } from "../../data/theme";
import {
  type PlayerState,
  getEquippedWeapon,
  velocityFromInput,
} from "../../game/player/player";
import { DEPTH } from "../art/depth";
import { cardinalFrom } from "../art/facing";
import { addShadow } from "../art/props";

export class PlayerAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: PlayerState;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly frontPose: Phaser.GameObjects.Container;
  private readonly backPose: Phaser.GameObjects.Container;
  private readonly sidePose: Phaser.GameObjects.Container;
  private readonly frontArms: Phaser.GameObjects.Ellipse[];
  private readonly backArms: Phaser.GameObjects.Ellipse[];
  private readonly sideArms: Phaser.GameObjects.Ellipse[];
  private readonly weaponHand: Phaser.GameObjects.Container;
  private readonly flash: Phaser.GameObjects.Ellipse;
  private lastWeaponId: string | null = null;
  private restRotation = 0.45;
  private attackTween: Phaser.Tweens.Tween | null = null;

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

    this.frontArms = [];
    this.backArms = [];
    this.sideArms = [];
    this.frontPose = this.buildFront(scene);
    this.backPose = this.buildBack(scene);
    this.sidePose = this.buildSide(scene);

    this.weaponHand = scene.add.container(13, 2);
    this.weaponHand.setRotation(this.restRotation);
    this.flash = scene.add.ellipse(0, 0, 28, 34, 0xfff4e0, 0);

    this.visual.add([
      this.frontPose,
      this.backPose,
      this.sidePose,
      this.weaponHand,
      this.flash,
    ]);
    this.redrawWeapon();
    this.applyFacing();
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

  flashAttack(scene: Phaser.Scene): void {
    this.applyFacing();
    this.attackTween?.stop();
    this.weaponHand.setRotation(this.restRotation);
    const weapon = getEquippedWeapon(this.state);
    const restX = this.weaponHand.x;
    const restY = this.weaponHand.y;
    const thrust = weapon.range >= 80 && weapon.halfWidth <= 14;

    if (thrust) {
      const dist = 16;
      this.attackTween = scene.tweens.add({
        targets: this.weaponHand,
        x: restX + Math.cos(this.restRotation - Math.PI / 2) * dist,
        y: restY + Math.sin(this.restRotation - Math.PI / 2) * dist,
        duration: 70,
        yoyo: true,
        onComplete: () => {
          this.weaponHand.setPosition(restX, restY);
          this.attackTween = null;
        },
      });
      return;
    }

    const arc = weapon.halfWidth >= 22 ? 1.45 : 1.05;
    this.attackTween = scene.tweens.add({
      targets: this.weaponHand,
      rotation: this.restRotation - arc,
      duration: weapon.attackCooldownMs <= 250 ? 42 : 70,
      yoyo: true,
      onComplete: () => {
        this.weaponHand.setRotation(this.restRotation);
        this.attackTween = null;
      },
    });
  }

  flashDash(scene: Phaser.Scene): void {
    this.visual.setAlpha(0.62);

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

  tickVisual(time: number, moving: boolean): void {
    if (this.state.equippedWeaponId !== this.lastWeaponId) {
      this.redrawWeapon();
    }

    this.applyFacing();
    const bob = moving
      ? Math.sin(time / 80) * 1.5
      : Math.sin(time / 320) * 0.6;
    const arm = moving ? Math.sin(time / 90) * 2.2 : 0;
    const arms = this.visibleArms();
    arms[0].y = arms[0].y + arm;
    arms[1].y = arms[1].y - arm;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 11);
    this.visual.setPosition(this.sprite.x, this.sprite.y + bob);
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

    if (dir === "up") {
      this.restRotation = -0.4;
      if (!this.attackTween) {
        this.weaponHand.setPosition(9, -2);
      }
      this.visual.sendToBack(this.weaponHand);
    } else if (dir === "down") {
      this.restRotation = 0.55;
      if (!this.attackTween) {
        this.weaponHand.setPosition(12, 7);
      }
      this.visual.bringToTop(this.weaponHand);
      this.visual.bringToTop(this.flash);
    } else {
      this.restRotation = 0.38;
      if (!this.attackTween) {
        this.weaponHand.setPosition(16, 2);
      }
      this.visual.bringToTop(this.weaponHand);
      this.visual.bringToTop(this.flash);
    }

    if (!this.attackTween) {
      this.weaponHand.setRotation(this.restRotation);
    }
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
    this.weaponHand.removeAll(true);
    this.lastWeaponId = this.state.equippedWeaponId;
    const scene = this.visual.scene;

    if (this.state.equippedWeaponId === "rusty_bat") {
      const bat = scene.add.container(0, 0);
      bat.add(scene.add.rectangle(0, 10, 6, 22, THEME.playerBat));
      bat.add(scene.add.ellipse(0, -8, 11, 18, THEME.playerBatDark));
      this.weaponHand.add(bat);
      return;
    }

    if (this.state.equippedWeaponId === "iron_spear") {
      const spear = scene.add.container(0, 0);
      spear.add(scene.add.rectangle(0, 6, 3.2, 40, THEME.playerSpear));
      spear.add(scene.add.triangle(0, -18, 0, -30, -4, -12, 4, -12, THEME.playerSpearTip));
      this.weaponHand.add(spear);
      return;
    }

    const knife = scene.add.container(0, 0);
    knife.add(scene.add.rectangle(0, 5, 3.5, 10, THEME.playerBatDark));
    knife.add(
      scene.add.triangle(0, -8, 0, -13, -4, 5, 4, 5, THEME.playerKnife),
    );
    this.weaponHand.add(knife);
  }
}
