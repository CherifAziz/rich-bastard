import Phaser from "phaser";
import type { HubId } from "../../data/hubs";
import type { MarketDefinition } from "../../data/markets";
import type { MerchantSpot } from "../../data/merchants";
import { WEAPONS } from "../../data/weapons";
import { buyWeapon } from "../../game/economy/buy";
import {
  buyTradeItem,
  maxBuyQuantity,
  sellAllTradeItem,
  sellTradeItem,
} from "../../game/economy/trade";
import { equipWeapon } from "../../game/player/player";
import { preparePlayerForScene } from "../../game/player/status";
import { persistSession } from "../../game/save/saveService";
import { arriveAtHub } from "../../game/state/gameSession";
import { isInRange, type InteractSpot, type ZoneRect } from "../../game/world/geometry";
import {
  showGoldLost,
  showPurchaseFeedback,
  showSaleFeedback,
  showTradePurchaseFeedback,
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
import { createMerchantPanelView } from "../ui/merchantView";
import { followPlayer } from "../camera";
import { createActionKeys, createBlockers } from "../world/drawZone";
import { InteractMarker } from "../world/InteractMarker";

export type SafeHubLayout = {
  hubId: HubId;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  exit: InteractSpot;
  walls: ZoneRect[];
  obstacles: ZoneRect[];
  merchant: MerchantSpot;
  market: MarketDefinition;
  standStyle: "town" | "outpost";
  drawWorld: (scene: Phaser.Scene) => void;
  exitTitle: string;
  exitPrompt: string;
  hint: string;
};

export class SafeHubScene extends Phaser.Scene {
  private player!: PlayerAvatar;
  private merchantStand!: MerchantStand;
  private merchantPanel!: MerchantPanel;
  private exitMarker!: InteractMarker;
  private moveKeys!: MovementKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private hud!: GameHud;
  private wasDashing = false;

  constructor(
    sceneKey: string,
    private readonly layout: SafeHubLayout,
  ) {
    super(sceneKey);
  }

  create(): void {
    this.wasDashing = false;

    const session = getGameSession(this);
    arriveAtHub(session, this.layout.hubId);
    preparePlayerForScene(
      session.player,
      this.layout.spawn.x,
      this.layout.spawn.y,
    );
    persistSession(session);

    this.physics.world.setBounds(0, 0, this.layout.width, this.layout.height);
    this.cameras.main.setBounds(0, 0, this.layout.width, this.layout.height);

    this.layout.drawWorld(this);
    const blockers = createBlockers(
      this,
      this.layout.walls,
      this.layout.obstacles,
    );

    this.player = new PlayerAvatar(this, session.player);
    this.player.placeAt(this.layout.spawn.x, this.layout.spawn.y);

    if (session.lastGoldLost > 0) {
      showGoldLost(
        this,
        this.layout.spawn.x,
        this.layout.spawn.y,
        session.lastGoldLost,
      );
      session.lastGoldLost = 0;
    }

    this.merchantStand = new MerchantStand(
      this,
      this.layout.merchant,
      this.layout.standStyle,
    );
    this.exitMarker = new InteractMarker(
      this,
      this.layout.exit.x,
      this.layout.exit.y,
      this.layout.exitTitle,
      this.layout.exitPrompt,
    );

    this.merchantPanel = new MerchantPanel({
      onSellOne: (itemId) => this.handleSell(itemId, 1),
      onSellAll: (itemId) => this.handleSell(itemId, "all"),
      onBuyTrade: (itemId, mode) => this.handleBuyTrade(itemId, mode),
      onBuyWeapon: (weaponId) => this.handleBuyWeapon(weaponId),
      onEquip: (weaponId) => this.handleEquip(weaponId),
      onClose: () => this.closeMerchant(),
    });

    this.physics.add.collider(this.player.sprite, blockers);
    followPlayer(this, this.player.sprite);

    this.moveKeys = createMovementKeys(this);
    const actions = createActionKeys(this);
    this.interactKey = actions.interactKey;
    this.dashKey = actions.dashKey;

    this.hud = new GameHud(this, this.layout.hint);
    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.merchantPanel.destroy();
    });
  }

  update(time: number): void {
    const shopOpen = this.merchantPanel.isOpen;
    const nearMerchant = isInRange(
      this.player.state.x,
      this.player.state.y,
      this.layout.merchant.x,
      this.layout.merchant.y,
      this.layout.merchant.talkRange,
    );
    const nearExit = isInRange(
      this.player.state.x,
      this.player.state.y,
      this.layout.exit.x,
      this.layout.exit.y,
      this.layout.exit.talkRange,
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
    this.merchantPanel.refresh(
      createMerchantPanelView(this.player.state, this.layout.market),
    );
  }

  private persist(): void {
    persistSession(getGameSession(this));
  }

  private handleBuyWeapon(weaponId: string): void {
    const result = buyWeapon(this.player.state, weaponId);
    const weapon = WEAPONS.find((entry) => entry.id === result.weaponId);

    if (result.success && weapon) {
      this.persist();
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
      this.merchantPanel.showFeedback("OWNED");
    } else if (result.insufficientFunds) {
      this.merchantPanel.showFeedback("Fonds insuffisants");
    }

    this.refreshMerchantPanel();
  }

  private handleEquip(weaponId: string): void {
    const result = equipWeapon(this.player.state, weaponId);
    if (result.success) {
      this.persist();
      const weapon = WEAPONS.find((entry) => entry.id === result.weaponId);
      this.merchantPanel.showFeedback(
        result.alreadyEquipped
          ? "EQUIPPED"
          : `EQUIPPED\n${weapon?.name ?? result.weaponId}`,
      );
    }

    this.refreshMerchantPanel();
  }

  private handleBuyTrade(itemId: string, mode: 1 | "max"): void {
    const quantity =
      mode === "max"
        ? maxBuyQuantity(this.player.state, itemId, this.layout.market)
        : 1;
    const result = buyTradeItem(
      this.player.state,
      itemId,
      quantity,
      this.layout.market,
    );

    if (result.success) {
      this.persist();
      this.merchantPanel.showFeedback(
        `BOUGHT\n${result.itemName} ×${result.quantityBought}\n-$${result.goldSpent}`,
      );
      showTradePurchaseFeedback(
        this,
        this.player.state.x,
        this.player.state.y,
        result.itemName,
        result.quantityBought,
        result.goldSpent,
      );
    } else if (result.insufficientFunds) {
      this.merchantPanel.showFeedback("Fonds insuffisants");
    }

    this.refreshMerchantPanel();
  }

  private handleSell(itemId: string, mode: 1 | "all"): void {
    const result =
      mode === "all"
        ? sellAllTradeItem(this.player.state, itemId, this.layout.market)
        : sellTradeItem(this.player.state, itemId, 1, this.layout.market);

    if (result.success) {
      this.persist();
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
