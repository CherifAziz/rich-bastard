import Phaser from "phaser";
import { ENEMY_BY_ID } from "../../data/enemies";
import { canMeleeAttack, tryMeleeAttack } from "../../game/combat/melee";
import { chaseVelocity, createEnemy } from "../../game/enemies/enemy";
import { createPlayer } from "../../game/player/player";
import {
  TEST_ZONE_ENEMIES,
  TEST_ZONE_HEIGHT,
  TEST_ZONE_OBSTACLES,
  TEST_ZONE_SPAWN,
  TEST_ZONE_WALLS,
  TEST_ZONE_WIDTH,
  type ZoneRect,
} from "../../game/world/testZone";
import { showDamageNumber, showMeleeSwing } from "../combat/feedback";
import { EnemyAvatar } from "../enemies/EnemyAvatar";
import {
  createMovementKeys,
  readMoveAxis,
  type MovementKeys,
} from "../input/movementInput";
import { PlayerAvatar } from "../player/PlayerAvatar";

const FLOOR_COLOR = 0x2a3d32;
const WALL_COLOR = 0x1c1c26;
const OBSTACLE_COLOR = 0x4a4558;
const GRID_COLOR = 0xffffff;
const HIT_KNOCKBACK = 220;

export class PlayScene extends Phaser.Scene {
  private player!: PlayerAvatar;
  private enemies: EnemyAvatar[] = [];
  private moveKeys!: MovementKeys;
  private hudHp!: Phaser.GameObjects.Text;
  private hudAttack!: Phaser.GameObjects.Text;
  private hudCoords!: Phaser.GameObjects.Text;

  constructor() {
    super("play");
  }

  create(): void {
    this.physics.world.setBounds(0, 0, TEST_ZONE_WIDTH, TEST_ZONE_HEIGHT);
    this.cameras.main.setBounds(0, 0, TEST_ZONE_WIDTH, TEST_ZONE_HEIGHT);

    this.drawFloor();
    const blockers = this.createBlockers();

    this.player = new PlayerAvatar(
      this,
      createPlayer(TEST_ZONE_SPAWN.x, TEST_ZONE_SPAWN.y),
    );

    this.spawnEnemies();

    const enemyGroup = this.physics.add.group(
      this.enemies.map((enemy) => enemy.sprite),
    );

    this.physics.add.collider(this.player.sprite, blockers);
    this.physics.add.collider(enemyGroup, blockers);
    this.physics.add.collider(this.player.sprite, enemyGroup);
    this.physics.add.collider(enemyGroup, enemyGroup);

    this.cameras.main.startFollow(this.player.sprite, true, 0.16, 0.16);

    this.moveKeys = createMovementKeys(this);
    this.input.setDefaultCursor("crosshair");
    this.input.on("pointerdown", this.onPointerDown, this);

    this.drawHud();
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();
  }

  update(time: number): void {
    const axis = readMoveAxis(this.moveKeys);
    this.player.applyMoveInput(axis.x, axis.y);
    this.player.syncState();

    for (const enemy of this.enemies) {
      if (!enemy.state.alive) {
        continue;
      }

      if (time < enemy.state.stunnedUntil) {
        enemy.syncState();
        continue;
      }

      const velocity = chaseVelocity(
        enemy.state,
        this.player.state.x,
        this.player.state.y,
        time,
      );
      enemy.applyVelocity(velocity.x, velocity.y);
      enemy.syncState();
    }

    this.hudHp.setText(`HP ${this.player.state.hp}/${this.player.state.maxHp}`);
    this.hudAttack.setText(
      canMeleeAttack(time, this.player.state.lastAttackAt)
        ? "Attaque prête"
        : "Attaque…",
    );
    this.hudCoords.setText(
      `${Math.round(this.player.state.x)}, ${Math.round(this.player.state.y)}`,
    );
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) {
      return;
    }

    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.resolveAttack(world.x, world.y);
  }

  private resolveAttack(aimX: number, aimY: number): void {
    const attack = tryMeleeAttack(
      this.player.state,
      this.enemies.map((enemy) => enemy.state),
      aimX,
      aimY,
      this.time.now,
    );

    if (!attack) {
      return;
    }

    this.player.flashAttack(this);
    showMeleeSwing(this, attack);

    for (const hit of attack.hits) {
      const avatar = this.enemies.find((enemy) => enemy.state === hit.enemy);
      if (!avatar) {
        continue;
      }

      showDamageNumber(this, avatar.sprite.x, avatar.sprite.y, hit.damage);
      avatar.flashHit(this);
      avatar.syncState();

      if (!hit.enemy.alive) {
        avatar.die(this);
        continue;
      }

      const dx = hit.enemy.x - this.player.state.x;
      const dy = hit.enemy.y - this.player.state.y;
      const length = Math.hypot(dx, dy) || 1;
      avatar.applyKnockback(dx / length, dy / length, HIT_KNOCKBACK);
    }
  }

  private spawnEnemies(): void {
    this.enemies = TEST_ZONE_ENEMIES.map((spawn, index) => {
      const definition = ENEMY_BY_ID[spawn.typeId];
      if (!definition) {
        throw new Error(`Unknown enemy type: ${spawn.typeId}`);
      }

      return new EnemyAvatar(
        this,
        createEnemy(definition, `${spawn.typeId}-${index + 1}`, spawn.x, spawn.y),
      );
    });
  }

  private drawFloor(): void {
    this.add
      .rectangle(
        TEST_ZONE_WIDTH / 2,
        TEST_ZONE_HEIGHT / 2,
        TEST_ZONE_WIDTH,
        TEST_ZONE_HEIGHT,
        FLOOR_COLOR,
      )
      .setDepth(0);

    const grid = this.add.graphics();
    grid.setDepth(1);
    grid.lineStyle(1, GRID_COLOR, 0.06);

    for (let x = 0; x <= TEST_ZONE_WIDTH; x += 64) {
      grid.lineBetween(x, 0, x, TEST_ZONE_HEIGHT);
    }

    for (let y = 0; y <= TEST_ZONE_HEIGHT; y += 64) {
      grid.lineBetween(0, y, TEST_ZONE_WIDTH, y);
    }
  }

  private createBlockers(): Phaser.Physics.Arcade.StaticGroup {
    const blockers = this.physics.add.staticGroup();

    for (const wall of TEST_ZONE_WALLS) {
      this.addBlocker(blockers, wall, WALL_COLOR);
    }

    for (const obstacle of TEST_ZONE_OBSTACLES) {
      this.addBlocker(blockers, obstacle, OBSTACLE_COLOR);
    }

    blockers.refresh();
    return blockers;
  }

  private addBlocker(
    group: Phaser.Physics.Arcade.StaticGroup,
    rect: ZoneRect,
    color: number,
  ): void {
    const blocker = this.add.rectangle(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
      color,
    );
    blocker.setDepth(5);
    group.add(blocker);
  }

  private drawHud(): void {
    const style = {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "16px",
      color: "#d8d8e0",
    };

    this.add
      .text(16, 16, "ZQSD · clic gauche", style)
      .setScrollFactor(0)
      .setDepth(20);

    this.hudHp = this.add
      .text(16, 38, "", { ...style, color: "#e05a4f" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudAttack = this.add
      .text(16, 58, "", { ...style, fontSize: "14px", color: "#e8c547" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudCoords = this.add
      .text(16, 78, "", { ...style, fontSize: "14px", color: "#8a8a96" })
      .setScrollFactor(0)
      .setDepth(20);
  }
}
