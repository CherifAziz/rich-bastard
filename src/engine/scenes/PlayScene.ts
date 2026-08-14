import Phaser from "phaser";
import { CHEESE_MERCHANT } from "../../data/merchants";
import { ENEMY_BY_ID } from "../../data/enemies";
import { ITEM_BY_ID } from "../../data/items";
import { WEAPON_BY_ID } from "../../data/weapons";
import { canMeleeAttack, tryMeleeAttack } from "../../game/combat/melee";
import { buyWeapon } from "../../game/economy/buy";
import { sellAll, sellItem } from "../../game/economy/sell";
import { chaseVelocity, createEnemy } from "../../game/enemies/enemy";
import { addItem, getItemQuantity } from "../../game/inventory/inventory";
import { isInTalkRange } from "../../game/merchants/merchant";
import { createPlayer, getEquippedWeapon } from "../../game/player/player";
import {
  createGroundLoot,
  grantKillReward,
  lootSpawnPosition,
} from "../../game/rewards/rewards";
import {
  TEST_ZONE_ENEMIES,
  TEST_ZONE_HEIGHT,
  TEST_ZONE_OBSTACLES,
  TEST_ZONE_SPAWN,
  TEST_ZONE_WALLS,
  TEST_ZONE_WIDTH,
  type ZoneRect,
} from "../../game/world/testZone";
import { showDamageNumber, showKillReward, showMeleeSwing, showPickupFeedback, showPurchaseFeedback, showSaleFeedback } from "../combat/feedback";
import { EnemyAvatar } from "../enemies/EnemyAvatar";
import {
  createMovementKeys,
  readMoveAxis,
  type MovementKeys,
} from "../input/movementInput";
import { LootDrop } from "../loot/LootDrop";
import { MerchantStand } from "../merchants/MerchantStand";
import { PlayerAvatar } from "../player/PlayerAvatar";
import { MerchantPanel } from "../ui/MerchantPanel";

const FLOOR_COLOR = 0x2a3d32;
const WALL_COLOR = 0x1c1c26;
const OBSTACLE_COLOR = 0x4a4558;
const GRID_COLOR = 0xffffff;
const HIT_KNOCKBACK = 220;
const LOOT_PICKUP_RANGE = 24;

export class PlayScene extends Phaser.Scene {
  private player!: PlayerAvatar;
  private enemies: EnemyAvatar[] = [];
  private lootDrops: LootDrop[] = [];
  private merchantStand!: MerchantStand;
  private merchantPanel!: MerchantPanel;
  private moveKeys!: MovementKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private hudHp!: Phaser.GameObjects.Text;
  private hudGold!: Phaser.GameObjects.Text;
  private hudWeapon!: Phaser.GameObjects.Text;
  private hudDamage!: Phaser.GameObjects.Text;
  private hudInventory!: Phaser.GameObjects.Text;
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
    this.merchantStand = new MerchantStand(this);
    this.merchantPanel = new MerchantPanel({
      onSellOne: () => this.handleSell(1),
      onSellAll: () => this.handleSell("all"),
      onBuy: () => this.handleBuy(),
      onClose: () => this.closeMerchant(),
    });

    const enemyGroup = this.physics.add.group(
      this.enemies.map((enemy) => enemy.sprite),
    );

    this.physics.add.collider(this.player.sprite, blockers);
    this.physics.add.collider(enemyGroup, blockers);
    this.physics.add.collider(this.player.sprite, enemyGroup);
    this.physics.add.collider(enemyGroup, enemyGroup);

    this.cameras.main.startFollow(this.player.sprite, true, 0.16, 0.16);

    this.moveKeys = createMovementKeys(this);
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }
    keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.E);
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.setDefaultCursor("crosshair");
    this.input.on("pointerdown", this.onPointerDown, this);

    this.drawHud();
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();
  }

  update(time: number): void {
    const shopOpen = this.merchantPanel.isOpen;
    const inTalkRange = isInTalkRange(
      this.player.state.x,
      this.player.state.y,
      CHEESE_MERCHANT.x,
      CHEESE_MERCHANT.y,
      CHEESE_MERCHANT.talkRange,
    );

    this.merchantStand.setPromptVisible(inTalkRange && !shopOpen);

    if (
      !shopOpen &&
      inTalkRange &&
      Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      this.openMerchant();
    }

    if (shopOpen) {
      this.player.applyMoveInput(0, 0);
      this.player.syncState();
      for (const enemy of this.enemies) {
        if (enemy.state.alive) {
          enemy.applyVelocity(0, 0);
        }
      }
    } else {
      const axis = readMoveAxis(this.moveKeys);
      this.player.applyMoveInput(axis.x, axis.y);
      this.player.syncState();
      this.collectNearbyLoot();
    }

    if (!shopOpen) {
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
    }

    const weapon = getEquippedWeapon(this.player.state);
    this.hudHp.setText(`HP ${this.player.state.hp}/${this.player.state.maxHp}`);
    this.hudGold.setText(`$${this.player.state.gold}`);
    this.hudWeapon.setText(`⚔️ ${weapon.name}`);
    this.hudDamage.setText(`DMG ${weapon.damage}`);
    this.hudInventory.setText(
      `Cheese ×${getItemQuantity(this.player.state.inventory, "cheese")}`,
    );
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
    if (this.merchantPanel.isOpen || pointer.button !== 0) {
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

      if (hit.killed) {
        const reward = grantKillReward(this.player.state, hit.enemy);
        if (reward) {
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
      .text(16, 16, "ZQSD · clic · E marchand", style)
      .setScrollFactor(0)
      .setDepth(20);

    this.hudHp = this.add
      .text(16, 38, "", { ...style, color: "#e05a4f" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudGold = this.add
      .text(16, 58, "", { ...style, color: "#e8c547" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudWeapon = this.add
      .text(16, 78, "", { ...style, color: "#d8d8e0" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudDamage = this.add
      .text(16, 98, "", { ...style, color: "#e05a4f" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudInventory = this.add
      .text(16, 118, "", { ...style, color: "#f4c430" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudAttack = this.add
      .text(16, 138, "", { ...style, fontSize: "14px", color: "#d8d8e0" })
      .setScrollFactor(0)
      .setDepth(20);

    this.hudCoords = this.add
      .text(16, 158, "", { ...style, fontSize: "14px", color: "#8a8a96" })
      .setScrollFactor(0)
      .setDepth(20);
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
    showPickupFeedback(
      this,
      this.player.state.x,
      this.player.state.y,
      drop.loot.name,
      drop.loot.quantity,
    );
  }

  private openMerchant(): void {
    this.player.body.setVelocity(0, 0);
    this.merchantPanel.open();
    this.refreshMerchantPanel();
  }

  private closeMerchant(): void {
    this.merchantPanel.close();
    this.game.canvas.focus();
  }

  private refreshMerchantPanel(): void {
    const item = ITEM_BY_ID[CHEESE_MERCHANT.itemId];
    const weapon = WEAPON_BY_ID[CHEESE_MERCHANT.weaponId];
    if (!item || !weapon) {
      return;
    }

    this.merchantPanel.refresh({
      itemName: item.name,
      quantity: getItemQuantity(this.player.state.inventory, item.id),
      sellPrice: item.sellPrice,
      gold: this.player.state.gold,
      weaponName: weapon.name,
      weaponPrice: weapon.price,
      weaponOwned: this.player.state.equippedWeaponId === weapon.id,
    });
  }

  private handleBuy(): void {
    const result = buyWeapon(this.player.state, CHEESE_MERCHANT.weaponId);
    const weapon = WEAPON_BY_ID[result.weaponId];

    if (result.success && weapon) {
      this.merchantPanel.showFeedback(
        `PURCHASED\n${result.weaponName}\n-$${result.goldSpent}`,
      );
      showPurchaseFeedback(
        this,
        this.player.state.x,
        this.player.state.y,
        result.weaponName,
        result.goldSpent,
        weapon.damage,
      );
    } else if (result.alreadyOwned) {
      this.merchantPanel.showFeedback("OWNED / EQUIPPED");
    } else if (result.insufficientFunds) {
      this.merchantPanel.showFeedback("Fonds insuffisants");
    }

    this.refreshMerchantPanel();
  }

  private handleSell(mode: 1 | "all"): void {
    const result =
      mode === "all"
        ? sellAll(this.player.state, CHEESE_MERCHANT.itemId)
        : sellItem(this.player.state, CHEESE_MERCHANT.itemId, 1);

    if (result.success) {
      this.merchantPanel.showFeedback(
        `Sold ${result.itemName} ×${result.quantitySold}  +$${result.goldGained}`,
      );
      showSaleFeedback(
        this,
        this.player.state.x,
        this.player.state.y,
        result.itemName,
        result.quantitySold,
        result.goldGained,
      );
    }

    this.refreshMerchantPanel();
  }
}
