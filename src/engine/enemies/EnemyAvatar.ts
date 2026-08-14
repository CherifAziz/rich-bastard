import Phaser from "phaser";
import { THEME } from "../../data/theme";
import type { EnemyState, PendingEnemyAttack } from "../../game/enemies/enemy";
import { DEPTH } from "../art/depth";
import { addShadow } from "../art/props";

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
  private telegraph: Phaser.GameObjects.Container | null = null;
  private telegraphFill: Phaser.GameObjects.Rectangle | null = null;
  private facingX = 0;
  private facingY = 1;
  private destroyed = false;

  constructor(scene: Phaser.Scene, state: EnemyState) {
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
    this.body.setMass(1);

    this.shadow = addShadow(
      scene,
      state.x,
      state.y + 8,
      state.width * 0.9,
      state.height * 0.45,
    );
    this.visual = scene.add.container(state.x, state.y);
    this.visual.setDepth(DEPTH.character);
    this.flash = scene.add.ellipse(0, 0, state.width + 4, state.height + 6, 0xfff4e0, 0);

    if (state.typeId === "bandit") {
      this.buildBandit(scene);
    } else {
      this.buildRat(scene);
    }

    this.hpBg = scene.add
      .rectangle(state.x, state.y - 20, HP_BAR_WIDTH + 2, HP_BAR_HEIGHT + 2, THEME.ink)
      .setStrokeStyle(1, THEME.gold, 0.35)
      .setDepth(DEPTH.character + 1);
    this.hpFill = scene.add
      .rectangle(
        state.x - HP_BAR_WIDTH / 2,
        state.y - 20,
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

    if (this.state.pendingAttack) {
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

    this.shadow.setPosition(this.sprite.x, this.sprite.y + 8);
    this.visual.setPosition(this.sprite.x, this.sprite.y + bob);
    this.visual.setRotation(Math.atan2(this.facingY, this.facingX) + Math.PI / 2);

    this.hpBg.setPosition(this.sprite.x, this.sprite.y - 20);
    this.hpFill.setPosition(
      this.sprite.x - HP_BAR_WIDTH / 2,
      this.sprite.y - 20,
    );
    this.hpFill.width =
      HP_BAR_WIDTH * (this.state.hp / Math.max(1, this.state.maxHp));
  }

  flashHit(scene: Phaser.Scene): void {
    if (this.destroyed) {
      return;
    }

    this.flash.setAlpha(0.75);
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

    scene.tweens.add({
      targets: [this.visual, this.shadow],
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
    this.visual.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }

  private buildRat(scene: Phaser.Scene): void {
    const tail = scene.add.ellipse(6, 10, 12, 4, THEME.ratFurDark);
    const body = scene.add.ellipse(0, 2, 16, 12, THEME.ratFur);
    const head = scene.add.circle(0, -7, 6, THEME.ratFur);
    const earL = scene.add.ellipse(-4, -12, 5, 6, THEME.ratEar);
    const earR = scene.add.ellipse(4, -12, 5, 6, THEME.ratEar);
    const eyeL = scene.add.circle(-2, -8, 1.2, THEME.ratEye);
    const eyeR = scene.add.circle(2, -8, 1.2, THEME.ratEye);
    const nose = scene.add.circle(0, -5, 1.4, THEME.ratNose);
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
    const bootL = scene.add.ellipse(-5, 12, 7, 5, THEME.ink);
    const bootR = scene.add.ellipse(5, 12, 7, 5, THEME.ink);
    const body = scene.add.ellipse(0, 3, 18, 20, THEME.banditCloak);
    const shirt = scene.add.ellipse(0, 1, 10, 10, THEME.banditShirt);
    const armL = scene.add.ellipse(-10, 2, 6, 11, THEME.banditSkin);
    const armR = scene.add.ellipse(11, 1, 6, 12, THEME.banditSkin);
    const head = scene.add.circle(0, -11, 8, THEME.banditSkin);
    const bandana = scene.add.ellipse(0, -15, 16, 7, THEME.banditBandana);
    const blade = scene.add.rectangle(14, 2, 5, 16, THEME.banditSteel);
    blade.setRotation(0.35);
    this.visual.add([
      bootL,
      bootR,
      armL,
      body,
      shirt,
      armR,
      blade,
      head,
      bandana,
      this.flash,
    ]);
  }
}
