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

  flashAttack(scene: Phaser.Scene): void {
    this.sprite.setFillStyle(0xfff6c2);
    scene.time.delayedCall(80, () => {
      this.sprite.setFillStyle(0xe8c547);
    });
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
