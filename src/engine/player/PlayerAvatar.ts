import Phaser from "phaser";
import {
  type PlayerState,
  velocityFromInput,
} from "../../game/player/player";

export class PlayerAvatar {
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly state: PlayerState;

  constructor(scene: Phaser.Scene, state: PlayerState) {
    this.state = state;

    this.sprite = scene.add.rectangle(
      state.x,
      state.y,
      state.width,
      state.height,
      0xe8c547,
    );
    this.sprite.setDepth(10);

    scene.physics.add.existing(this.sprite);

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setDrag(0, 0);
    this.body.setAllowGravity(false);
    this.body.setSize(state.width, state.height);
    this.body.setMass(4);
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
    this.sprite.setFillStyle(0xfff6c2);
    scene.time.delayedCall(80, () => {
      this.sprite.setFillStyle(0xe8c547);
    });
  }

  flashDash(scene: Phaser.Scene): void {
    this.sprite.setFillStyle(0xfff6c2);
    this.sprite.setAlpha(0.55);

    for (let i = 1; i <= 2; i++) {
      const ghost = scene.add.rectangle(
        this.sprite.x - this.state.dashDirX * i * 12,
        this.sprite.y - this.state.dashDirY * i * 12,
        this.state.width,
        this.state.height,
        0xe8c547,
        0.35 / i,
      );
      ghost.setDepth(9);
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
    this.sprite.setAlpha(1);
    this.sprite.setFillStyle(0xe8c547);
  }

  flashHit(scene: Phaser.Scene): void {
    this.sprite.setFillStyle(0xe05a4f);
    scene.time.delayedCall(90, () => {
      this.sprite.setFillStyle(0xe8c547);
    });
  }

  applyKnockback(dirX: number, dirY: number, strength: number): void {
    this.body.setVelocity(dirX * strength, dirY * strength);
  }

  placeAt(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.body.reset(x, y);
    this.syncState();
  }

  syncState(): void {
    this.state.x = this.sprite.x;
    this.state.y = this.sprite.y;
  }
}
