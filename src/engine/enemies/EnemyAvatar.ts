import Phaser from "phaser";
import { THEME } from "../../data/theme";
import type { EnemyState, PendingEnemyAttack } from "../../game/enemies/enemy";
import { DEPTH } from "../art/depth";
import { cardinalFrom } from "../art/facing";
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
  private readonly isBandit: boolean;
  private armL: Phaser.GameObjects.Ellipse | null = null;
  private armR: Phaser.GameObjects.Ellipse | null = null;
  private head: Phaser.GameObjects.Arc | null = null;
  private bandana: Phaser.GameObjects.Ellipse | null = null;
  private blade: Phaser.GameObjects.Rectangle | null = null;
  private telegraph: Phaser.GameObjects.Container | null = null;
  private telegraphFill: Phaser.GameObjects.Rectangle | null = null;
  private facingX = 0;
  private facingY = 1;
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

    if (this.isBandit) {
      this.applyBanditFacing();
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

  private applyBanditFacing(): void {
    const dir = cardinalFrom(this.facingX, this.facingY);
    this.visual.setRotation(0);
    this.visual.setScale(dir === "left" ? -1 : 1, 1);

    if (!this.head || !this.bandana || !this.blade || !this.armR) {
      return;
    }

    if (dir === "up") {
      this.head.setPosition(0, -13);
      this.bandana.setPosition(0, -17);
      this.blade.setPosition(8, -6);
      this.blade.setRotation(-0.9);
      this.visual.sendToBack(this.blade);
    } else if (dir === "down") {
      this.head.setPosition(1, -10);
      this.bandana.setPosition(1, -14);
      this.blade.setPosition(12, 8);
      this.blade.setRotation(0.7);
      this.visual.bringToTop(this.blade);
      this.visual.bringToTop(this.flash);
    } else {
      this.head.setPosition(2, -11);
      this.bandana.setPosition(2, -15);
      this.blade.setPosition(15, 2);
      this.blade.setRotation(0.4);
      this.visual.bringToTop(this.blade);
      this.visual.bringToTop(this.flash);
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
    const outline = scene.add.ellipse(0, 3, 20, 24, THEME.ink);
    const bootL = scene.add.ellipse(-5, 13, 7, 6, THEME.ink);
    const bootR = scene.add.ellipse(5, 13, 7, 6, THEME.ink);
    const body = scene.add.ellipse(0, 3, 17, 20, THEME.banditCloak);
    const shirt = scene.add.ellipse(0, 1, 10, 10, THEME.banditShirt);
    this.armL = scene.add.ellipse(-10, 3, 6, 12, THEME.banditSkin);
    this.armR = scene.add.ellipse(11, 2, 6, 13, THEME.banditSkin);
    this.head = scene.add.circle(0, -12, 8.5, THEME.banditSkin);
    this.bandana = scene.add.ellipse(0, -16, 17, 8, THEME.banditBandana);
    this.blade = scene.add.rectangle(15, 2, 5, 18, THEME.banditSteel);
    this.blade.setRotation(0.4);
    this.visual.add([
      outline,
      bootL,
      bootR,
      this.armL,
      body,
      shirt,
      this.armR,
      this.blade,
      this.head,
      this.bandana,
      this.flash,
    ]);
  }
}
