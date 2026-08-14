import Phaser from "phaser";
import { THEME } from "../../data/theme";
import {
  type PlayerState,
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
  private readonly armL: Phaser.GameObjects.Ellipse;
  private readonly armR: Phaser.GameObjects.Ellipse;
  private readonly head: Phaser.GameObjects.Arc;
  private readonly hair: Phaser.GameObjects.Ellipse;
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

    const outline = scene.add.ellipse(0, 3, 20, 24, THEME.playerBoot);
    const bootL = scene.add.ellipse(-5, 13, 7, 7, THEME.playerBoot);
    const bootR = scene.add.ellipse(5, 13, 7, 7, THEME.playerBoot);
    const body = scene.add.ellipse(0, 3, 17, 20, THEME.playerTunic);
    const shirt = scene.add.ellipse(0, -1, 11, 9, THEME.playerShirt);
    this.armL = scene.add.ellipse(-10, 3, 6, 12, THEME.playerSkin);
    this.armR = scene.add.ellipse(10, 3, 6, 12, THEME.playerSkin);
    this.head = scene.add.circle(0, -12, 9, THEME.playerSkin);
    this.hair = scene.add.ellipse(0, -17, 16, 9, THEME.playerHair);
    this.flash = scene.add.ellipse(0, 0, 28, 34, 0xfff4e0, 0);

    this.weaponHand = scene.add.container(13, 2);
    this.weaponHand.setRotation(this.restRotation);

    this.visual.add([
      outline,
      bootL,
      bootR,
      this.armL,
      body,
      shirt,
      this.armR,
      this.head,
      this.hair,
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
    this.attackTween = scene.tweens.add({
      targets: this.weaponHand,
      rotation: this.restRotation - 1.25,
      duration: 55,
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
    this.armL.y = 3 + arm;
    this.armR.y = 3 - arm;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 11);
    this.visual.setPosition(this.sprite.x, this.sprite.y + bob);
  }

  private applyFacing(): void {
    const dir = cardinalFrom(this.state.facingX, this.state.facingY);
    const flip = dir === "left" ? -1 : 1;
    this.visual.setScale(flip, 1);

    if (dir === "up") {
      this.head.setPosition(0, -14);
      this.hair.setPosition(0, -19);
      this.weaponHand.setPosition(9, -4);
      this.restRotation = -0.35;
      this.visual.sendToBack(this.weaponHand);
    } else if (dir === "down") {
      this.head.setPosition(1, -11);
      this.hair.setPosition(1, -16);
      this.weaponHand.setPosition(12, 7);
      this.restRotation = 0.55;
      this.visual.bringToTop(this.weaponHand);
      this.visual.bringToTop(this.flash);
    } else {
      this.head.setPosition(2, -12);
      this.hair.setPosition(2, -17);
      this.weaponHand.setPosition(14, 2);
      this.restRotation = 0.42;
      this.visual.bringToTop(this.weaponHand);
      this.visual.bringToTop(this.flash);
    }

    if (!this.attackTween) {
      this.weaponHand.setRotation(this.restRotation);
    }
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

    const knife = scene.add.container(0, 0);
    knife.add(scene.add.rectangle(0, 5, 3.5, 10, THEME.playerBatDark));
    knife.add(
      scene.add.triangle(0, -8, 0, -13, -4, 5, 4, 5, THEME.playerKnife),
    );
    this.weaponHand.add(knife);
  }
}
