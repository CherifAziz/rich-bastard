import Phaser from "phaser";
import { CHEESE_MERCHANT } from "../../data/merchants";
import { ITEM_BY_ID } from "../../data/items";
import { WEAPON_BY_ID } from "../../data/weapons";
import { buyWeapon } from "../../game/economy/buy";
import { sellAll, sellItem } from "../../game/economy/sell";
import { getItemQuantity } from "../../game/inventory/inventory";
import { isInTalkRange } from "../../game/merchants/merchant";
import { isInRange } from "../../game/world/geometry";
import { preparePlayerForScene } from "../../game/player/status";
import {
  TOWN_EXIT,
  TOWN_HEIGHT,
  TOWN_OBSTACLES,
  TOWN_SPAWN,
  TOWN_WALLS,
  TOWN_WIDTH,
} from "../../game/world/town";
import {
  showGoldLost,
  showPurchaseFeedback,
  showSaleFeedback,
} from "../combat/feedback";
import {
  createMovementKeys,
  type MovementKeys,
} from "../input/movementInput";
import { MerchantStand } from "../merchants/MerchantStand";
import { PlayerAvatar } from "../player/PlayerAvatar";
import { tickPlayerMotion } from "../player/playerMotion";
import { getGameSession } from "../session";
import { GameHud } from "../ui/GameHud";
import { MerchantPanel } from "../ui/MerchantPanel";
import { createActionKeys, createBlockers, drawFloor } from "../world/drawZone";
import { InteractMarker } from "../world/InteractMarker";

const TOWN_FLOOR_COLOR = 0x3a3832;

export class TownScene extends Phaser.Scene {
  private player!: PlayerAvatar;
  private merchantStand!: MerchantStand;
  private merchantPanel!: MerchantPanel;
  private exitMarker!: InteractMarker;
  private moveKeys!: MovementKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private hud!: GameHud;
  private wasDashing = false;

  constructor() {
    super("town");
  }

  create(): void {
    this.wasDashing = false;

    const session = getGameSession(this);
    preparePlayerForScene(session.player, TOWN_SPAWN.x, TOWN_SPAWN.y);

    this.physics.world.setBounds(0, 0, TOWN_WIDTH, TOWN_HEIGHT);
    this.cameras.main.setBounds(0, 0, TOWN_WIDTH, TOWN_HEIGHT);

    drawFloor(this, TOWN_WIDTH, TOWN_HEIGHT, TOWN_FLOOR_COLOR);
    this.add
      .text(TOWN_WIDTH / 2, 80, "VILLE", {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#e8c547",
        stroke: "#1a1208",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(3);

    const blockers = createBlockers(this, TOWN_WALLS, TOWN_OBSTACLES);

    this.player = new PlayerAvatar(this, session.player);
    this.player.placeAt(TOWN_SPAWN.x, TOWN_SPAWN.y);

    if (session.lastGoldLost > 0) {
      showGoldLost(
        this,
        TOWN_SPAWN.x,
        TOWN_SPAWN.y,
        session.lastGoldLost,
      );
      session.lastGoldLost = 0;
    }

    this.merchantStand = new MerchantStand(this);
    this.exitMarker = new InteractMarker(
      this,
      TOWN_EXIT.x,
      TOWN_EXIT.y,
      "SORTIE DE LA VILLE",
      "E — PARTIR EN EXPÉDITION",
    );

    this.merchantPanel = new MerchantPanel({
      onSellOne: (itemId) => this.handleSell(itemId, 1),
      onSellAll: (itemId) => this.handleSell(itemId, "all"),
      onBuy: () => this.handleBuy(),
      onClose: () => this.closeMerchant(),
    });

    this.physics.add.collider(this.player.sprite, blockers);
    this.cameras.main.startFollow(this.player.sprite, true, 0.16, 0.16);

    this.moveKeys = createMovementKeys(this);
    const actions = createActionKeys(this);
    this.interactKey = actions.interactKey;
    this.dashKey = actions.dashKey;

    this.hud = new GameHud(
      this,
      "ZQSD · ESPACE dash · E parler / partir",
      false,
    );
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.merchantPanel.destroy();
    });
  }

  update(time: number): void {
    const shopOpen = this.merchantPanel.isOpen;
    const nearMerchant = isInTalkRange(
      this.player.state.x,
      this.player.state.y,
      CHEESE_MERCHANT.x,
      CHEESE_MERCHANT.y,
      CHEESE_MERCHANT.talkRange,
    );
    const nearExit = isInRange(
      this.player.state.x,
      this.player.state.y,
      TOWN_EXIT.x,
      TOWN_EXIT.y,
      TOWN_EXIT.talkRange,
    );

    this.merchantStand.setPromptVisible(nearMerchant && !shopOpen);
    this.exitMarker.setPromptVisible(nearExit && !shopOpen);

    if (!shopOpen && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (nearMerchant) {
        this.openMerchant();
      } else if (nearExit) {
        this.scene.start("exploration");
        return;
      }
    }

    this.wasDashing = tickPlayerMotion(
      this,
      this.player,
      this.moveKeys,
      this.dashKey,
      time,
      shopOpen,
      this.wasDashing,
    );
    this.hud.refresh(this.player.state, time);
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
    const weapon = WEAPON_BY_ID[CHEESE_MERCHANT.weaponId];
    if (!weapon) {
      return;
    }

    this.merchantPanel.refresh({
      sellItems: Object.values(ITEM_BY_ID).map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: getItemQuantity(this.player.state.inventory, item.id),
        sellPrice: item.sellPrice,
      })),
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

  private handleSell(itemId: string, mode: 1 | "all"): void {
    const result =
      mode === "all"
        ? sellAll(this.player.state, itemId)
        : sellItem(this.player.state, itemId, 1);

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
