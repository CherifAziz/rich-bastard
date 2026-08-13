import Phaser from "phaser";
import type { EnemyState } from "../../game/enemies/enemy";

const ENEMY_COLORS: Record<string, number> = {
  rat: 0xa65d3a,
};

const DEFAULT_COLOR = 0x8a5a44;
const HP_BAR_WIDTH = 28;
const HP_BAR_HEIGHT = 4;

export class EnemyAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: EnemyState;
  private readonly color: number;
  private readonly hpBg: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private destroyed = false;

  constructor(scene: Phaser.Scene, state: EnemyState) {
    this.state = state;
    this.color = ENEMY_COLORS[state.typeId] ?? DEFAULT_COLOR;

    this.sprite = scene.add.rectangle(
      state.x,
      state.y,
      state.width,
      state.height,
      this.color,
    );
    this.sprite.setDepth(8);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setDrag(0, 0);
    this.body.setAllowGravity(false);
    this.body.setSize(state.width, state.height);
    this.body.setMass(1);

    this.hpBg = scene.add
      .rectangle(state.x, state.y - 18, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x2a1510)
      .setDepth(9);
    this.hpFill = scene.add
      .rectangle(
        state.x - HP_BAR_WIDTH / 2,
        state.y - 18,
        HP_BAR_WIDTH,
        HP_BAR_HEIGHT,
        0xe05a4f,
      )
      .setOrigin(0, 0.5)
      .setDepth(9);
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
    this.hpBg.setPosition(this.sprite.x, this.sprite.y - 18);
    this.hpFill.setPosition(
      this.sprite.x - HP_BAR_WIDTH / 2,
      this.sprite.y - 18,
    );
    this.hpFill.width =
      HP_BAR_WIDTH * (this.state.hp / Math.max(1, this.state.maxHp));
  }

  flashHit(scene: Phaser.Scene): void {
    if (this.destroyed) {
      return;
    }

    this.sprite.setFillStyle(0xfff4e0);
    scene.time.delayedCall(80, () => {
      if (!this.destroyed && this.state.alive) {
        this.sprite.setFillStyle(this.color);
      }
    });
  }

  applyKnockback(dirX: number, dirY: number, strength: number): void {
    if (!this.state.alive) {
      return;
    }

    this.body.setVelocity(dirX * strength, dirY * strength);
  }

  die(scene: Phaser.Scene): void {
    if (this.destroyed) {
      return;
    }

    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.sprite.setFillStyle(this.color);
    this.hpBg.setVisible(false);
    this.hpFill.setVisible(false);

    scene.tweens.add({
      targets: this.sprite,
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
    this.hpBg.destroy();
    this.hpFill.destroy();
    this.sprite.destroy();
  }
}
