import Phaser from "phaser";
import { ENEMY_BY_ID } from "../../data/enemies";
import { sceneKeyForHub } from "../../data/hubs";
import { THEME_HEX } from "../../data/theme";
import { tickEnemyMelee } from "../../game/combat/enemyMelee";
import { tryMeleeAttack } from "../../game/combat/melee";
import { applyDeathGoldPenalty } from "../../game/economy/death";
import { chaseVelocity, createEnemy } from "../../game/enemies/enemy";
import { addItem } from "../../game/inventory/inventory";
import { preparePlayerForScene } from "../../game/player/status";
import { persistSession } from "../../game/save/saveService";
import {
  createGroundLoot,
  grantKillReward,
  lootSpawnPosition,
} from "../../game/rewards/rewards";
import { isInRange } from "../../game/world/geometry";
import {
  EXPLORATION_EAST_EXIT,
  EXPLORATION_ENEMIES,
  EXPLORATION_HEIGHT,
  EXPLORATION_OBSTACLES,
  EXPLORATION_WALLS,
  EXPLORATION_WEST_EXIT,
  EXPLORATION_WIDTH,
  explorationSpawnForHub,
} from "../../game/world/exploration";
import {
  showDamageNumber,
  showHitImpact,
  showKillReward,
  showMiss,
  showPickupFeedback,
  showYouDied,
} from "../combat/feedback";
import { EnemyAvatar } from "../enemies/EnemyAvatar";
import {
  createMovementKeys,
  type MovementKeys,
} from "../input/movementInput";
import { LootDrop } from "../loot/LootDrop";
import { PlayerAvatar } from "../player/PlayerAvatar";
import { tickPlayerMotion } from "../player/playerMotion";
import { getGameSession } from "../session";
import { GameHud } from "../ui/GameHud";
import { createActionKeys, createBlockers } from "../world/drawZone";
import { InteractMarker } from "../world/InteractMarker";
import { drawExplorationWorld } from "../world/explorationArt";
import { followPlayer } from "../camera";

const PLAYER_HIT_KNOCKBACK = 280;
const LOOT_PICKUP_RANGE = 24;
const DEATH_DISPLAY_MS = 1200;

export class ExplorationScene extends Phaser.Scene {
  private player!: PlayerAvatar;
  private enemies: EnemyAvatar[] = [];
  private lootDrops: LootDrop[] = [];
  private westExit!: InteractMarker;
  private eastExit!: InteractMarker;
  private moveKeys!: MovementKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private hud!: GameHud;
  private dying = false;
  private wasDashing = false;

  constructor() {
    super("exploration");
  }

  create(): void {
    this.dying = false;
    this.wasDashing = false;
    this.lootDrops = [];
    this.enemies = [];

    const session = getGameSession(this);
    const spawn = explorationSpawnForHub(session.lastSafeHubId);
    preparePlayerForScene(session.player, spawn.x, spawn.y);

    this.physics.world.setBounds(0, 0, EXPLORATION_WIDTH, EXPLORATION_HEIGHT);
    this.cameras.main.setBounds(0, 0, EXPLORATION_WIDTH, EXPLORATION_HEIGHT);

    drawExplorationWorld(this);
    const blockers = createBlockers(
      this,
      EXPLORATION_WALLS,
      EXPLORATION_OBSTACLES,
    );

    this.player = new PlayerAvatar(this, session.player);
    this.player.placeAt(spawn.x, spawn.y);

    this.westExit = new InteractMarker(
      this,
      EXPLORATION_WEST_EXIT.x,
      EXPLORATION_WEST_EXIT.y,
      "BOURG",
      "E — ENTRER À BOURG",
      false,
    );
    this.eastExit = new InteractMarker(
      this,
      EXPLORATION_EAST_EXIT.x,
      EXPLORATION_EAST_EXIT.y,
      "AVANT-POSTE",
      "E — ENTRER À L'AVANT-POSTE",
      false,
    );

    this.spawnEnemies();

    const enemyGroup = this.physics.add.group(
      this.enemies.map((enemy) => enemy.sprite),
    );

    this.physics.add.collider(this.player.sprite, blockers);
    this.physics.add.collider(enemyGroup, blockers);
    this.physics.add.collider(this.player.sprite, enemyGroup);
    this.physics.add.collider(enemyGroup, enemyGroup);

    followPlayer(this, this.player.sprite);

    this.moveKeys = createMovementKeys(this);
    const actions = createActionKeys(this);
    this.interactKey = actions.interactKey;
    this.dashKey = actions.dashKey;
    this.input.setDefaultCursor("crosshair");
    this.input.on("pointerdown", this.onPointerDown, this);

    this.hud = new GameHud(
      this,
      "ZQSD  ·  clic  ·  ESPACE dash  ·  E entrer",
    );
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();
  }

  update(time: number): void {
    const nearWest = isInRange(
      this.player.state.x,
      this.player.state.y,
      EXPLORATION_WEST_EXIT.x,
      EXPLORATION_WEST_EXIT.y,
      EXPLORATION_WEST_EXIT.talkRange,
    );
    const nearEast = isInRange(
      this.player.state.x,
      this.player.state.y,
      EXPLORATION_EAST_EXIT.x,
      EXPLORATION_EAST_EXIT.y,
      EXPLORATION_EAST_EXIT.talkRange,
    );

    this.westExit.setPromptVisible(nearWest && !this.dying);
    this.eastExit.setPromptVisible(nearEast && !this.dying);

    if (!this.dying && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (nearWest) {
        this.scene.start("town");
        return;
      }
      if (nearEast) {
        this.scene.start("outpost");
        return;
      }
    }

    this.wasDashing = tickPlayerMotion(
      this,
      this.player,
      this.moveKeys,
      this.dashKey,
      time,
      this.dying,
      this.wasDashing,
    );

    if (!this.dying) {
      this.collectNearbyLoot();

      for (const enemy of this.enemies) {
        if (!enemy.state.alive) {
          continue;
        }

        if (time >= enemy.state.stunnedUntil) {
          const velocity = chaseVelocity(
            enemy.state,
            this.player.state.x,
            this.player.state.y,
            time,
          );
          enemy.applyVelocity(velocity.x, velocity.y);
        } else if (enemy.state.pendingAttack) {
          enemy.applyVelocity(0, 0);
        }

        enemy.syncState();
        this.handleEnemyMelee(enemy, time);
      }
    }

    this.hud.refresh(this.player.state, time);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.dying || pointer.button !== 0) {
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

    this.player.playMeleeAttack(this, attack);

    for (const hit of attack.hits) {
      const avatar = this.enemies.find((enemy) => enemy.state === hit.enemy);
      if (!avatar) {
        continue;
      }

      showDamageNumber(this, avatar.sprite.x, avatar.sprite.y, hit.damage);
      showHitImpact(this, avatar.sprite.x, avatar.sprite.y);
      avatar.flashHit(this);
      avatar.syncState();

      if (hit.killed) {
        const reward = grantKillReward(this.player.state, hit.enemy);
        if (reward) {
          persistSession(getGameSession(this));
          showKillReward(
            this,
            avatar.sprite.x,
            avatar.sprite.y,
            hit.enemy.name,
            reward.gold,
          );
          this.spawnLoot(reward.groundLoot, hit.enemy.x, hit.enemy.y);
        }
        avatar.die(this);
        continue;
      }

      const dx = hit.enemy.x - this.player.state.x;
      const dy = hit.enemy.y - this.player.state.y;
      const length = Math.hypot(dx, dy) || 1;
      avatar.applyKnockback(dx / length, dy / length, attack.knockback);
      if (attack.knockback >= 240) {
        this.cameras.main.shake(70, 0.0018);
      }
    }
  }

  private handleEnemyMelee(enemy: EnemyAvatar, now: number): void {
    const result = tickEnemyMelee(enemy.state, this.player.state, now);
    if (!result) {
      enemy.clearTelegraph();
      return;
    }

    if (result.kind === "windup") {
      enemy.showTelegraph(result.telegraph, now);
      return;
    }

    enemy.clearTelegraph();
    enemy.playMeleeStrike(this, result.telegraph);

    if (result.kind === "miss") {
      showMiss(this, result.telegraph.originX, result.telegraph.originY);
      return;
    }

    showDamageNumber(
      this,
      this.player.sprite.x,
      this.player.sprite.y,
      result.damage,
      THEME_HEX.damage,
    );
    showHitImpact(this, this.player.sprite.x, this.player.sprite.y, 0xe05a4f);
    this.player.flashHit(this);
    this.player.applyKnockback(
      result.telegraph.dirX,
      result.telegraph.dirY,
      PLAYER_HIT_KNOCKBACK,
    );
    this.cameras.main.shake(100, 0.003);

    if (this.player.state.hp <= 0) {
      this.beginDeath();
    }
  }

  private beginDeath(): void {
    if (this.dying) {
      return;
    }

    this.dying = true;
    this.wasDashing = false;
    this.player.endDashVisual();
    this.player.body.setVelocity(0, 0);
    for (const enemy of this.enemies) {
      enemy.state.pendingAttack = null;
      enemy.clearTelegraph();
    }

    const overlay = showYouDied(this);
    this.time.delayedCall(DEATH_DISPLAY_MS, () => {
      overlay.destroy();
      const session = getGameSession(this);
      const penalty = applyDeathGoldPenalty(this.player.state);
      session.lastGoldLost = penalty.goldLost;
      persistSession(session);
      this.scene.start(sceneKeyForHub(session.lastSafeHubId));
    });
  }

  private spawnEnemies(): void {
    this.enemies = EXPLORATION_ENEMIES.map((spawn, index) => {
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

  private spawnLoot(
    items: { id: string; name: string; quantity: number }[],
    enemyX: number,
    enemyY: number,
  ): void {
    const position = lootSpawnPosition(
      enemyX,
      enemyY,
      this.player.state.x,
      this.player.state.y,
    );

    for (const [index, item] of items.entries()) {
      const loot = createGroundLoot(
        `${item.id}-${this.lootDrops.length}`,
        item,
        position.x + index * 16,
        position.y,
      );
      const drop = new LootDrop(this, loot);
      this.lootDrops.push(drop);
    }
  }

  private collectNearbyLoot(): void {
    for (const drop of this.lootDrops) {
      if (drop.loot.collected) {
        continue;
      }

      const distance = Math.hypot(
        this.player.state.x - drop.loot.x,
        this.player.state.y - drop.loot.y,
      );

      if (distance <= LOOT_PICKUP_RANGE) {
        this.collectLoot(drop);
      }
    }
  }

  private collectLoot(drop: LootDrop): void {
    if (!drop.collect()) {
      return;
    }

    addItem(this.player.state.inventory, drop.loot.itemId, drop.loot.quantity);
    persistSession(getGameSession(this));
    showPickupFeedback(
      this,
      this.player.state.x,
      this.player.state.y,
      drop.loot.name,
      drop.loot.quantity,
    );
  }
}
