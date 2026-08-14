import Phaser from "phaser";
import { THEME } from "../../data/theme";
import {
  type PlayerState,
  velocityFromInput,
} from "../../game/player/player";
import { DEPTH } from "../art/depth";
import { addShadow } from "../art/props";

export class PlayerAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: PlayerState;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Container;
  private readonly weaponHand: Phaser.GameObjects.Container;
  private readonly flash: Phaser.GameObjects.Ellipse;
  private lastWeaponId: string | null = null;
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

    this.shadow = addShadow(scene, state.x, state.y + 10, 22, 11);
    this.visual = scene.add.container(state.x, state.y);
    this.visual.setDepth(DEPTH.character);

    const bootL = scene.add.ellipse(-5, 11, 7, 6, THEME.playerBoot);
    const bootR = scene.add.ellipse(5, 11, 7, 6, THEME.playerBoot);
    const body = scene.add.ellipse(0, 3, 18, 20, THEME.playerTunic);
    const shirt = scene.add.ellipse(0, -2, 10, 8, THEME.playerShirt);
    const armL = scene.add.ellipse(-10, 2, 6, 11, THEME.playerSkin);
    const armR = scene.add.ellipse(10, 2, 6, 11, THEME.playerSkin);
    const head = scene.add.circle(0, -11, 8, THEME.playerSkin);
    const hair = scene.add.ellipse(0, -15, 14, 8, THEME.playerHair);
    this.flash = scene.add.ellipse(0, 0, 26, 30, 0xfff4e0, 0);

    this.weaponHand = scene.add.container(12, 1);
    this.weaponHand.setRotation(0.4);

    this.visual.add([
      bootL,
      bootR,
      armL,
      body,
      shirt,
      armR,
      head,
      hair,
      this.weaponHand,
      this.flash,
    ]);
    this.redrawWeapon();
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
    this.attackTween?.stop();
    this.weaponHand.setRotation(0.4);
    this.attackTween = scene.tweens.add({
      targets: this.weaponHand,
      rotation: -1.15,
      duration: 55,
      yoyo: true,
      onComplete: () => {
        this.weaponHand.setRotation(0.4);
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
        22,
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
    this.flash.setAlpha(0.7);
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

    const bob = moving
      ? Math.sin(time / 80) * 1.6
      : Math.sin(time / 320) * 0.7;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 10);
    this.visual.setPosition(this.sprite.x, this.sprite.y + bob);
    this.visual.setRotation(
      Math.atan2(this.state.facingY, this.state.facingX) + Math.PI / 2,
    );
  }

  private redrawWeapon(): void {
    this.weaponHand.removeAll(true);
    this.lastWeaponId = this.state.equippedWeaponId;
    const scene = this.visual.scene;

    if (this.state.equippedWeaponId === "rusty_bat") {
      const bat = scene.add.container(0, 0);
      bat.add(scene.add.rectangle(0, 8, 5, 18, THEME.playerBat));
      bat.add(scene.add.ellipse(0, -6, 9, 16, THEME.playerBatDark));
      this.weaponHand.add(bat);
      return;
    }

    const knife = scene.add.container(0, 0);
    knife.add(scene.add.rectangle(0, 4, 3, 8, THEME.playerBatDark));
    knife.add(
      scene.add.triangle(0, -6, 0, -10, -3.5, 4, 3.5, 4, THEME.playerKnife),
    );
    this.weaponHand.add(knife);
  }
}
