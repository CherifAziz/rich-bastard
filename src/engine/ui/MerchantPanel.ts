export type MerchantPanelCallbacks = {
  onSellOne: (itemId: string) => void;
  onSellAll: (itemId: string) => void;
  onBuyTrade: (itemId: string, mode: 1 | "max") => void;
  onBuyWeapon: (weaponId: string) => void;
  onEquip: (weaponId: string) => void;
  onClose: () => void;
};

export type MerchantLootRow = {
  itemId: string;
  name: string;
  quantity: number;
  sellPrice: number;
};

export type MerchantTradeRow = {
  itemId: string;
  name: string;
  quantity: number;
  buyPrice: number | null;
  sellPrice: number | null;
  canAfford: boolean;
  maxBuy: number;
};

export type MerchantWeaponRow = {
  weaponId: string;
  name: string;
  damage: number;
  price: number;
  tag: string;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
};

export type MerchantPanelView = {
  title: string;
  lootItems: MerchantLootRow[];
  tradeItems: MerchantTradeRow[];
  weapons: MerchantWeaponRow[];
  gold: number;
};

export class MerchantPanel {
  private readonly root: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly lootSection: HTMLElement;
  private readonly lootListEl: HTMLElement;
  private readonly tradeSection: HTMLElement;
  private readonly tradeListEl: HTMLElement;
  private readonly weaponSection: HTMLElement;
  private readonly weaponListEl: HTMLElement;
  private readonly goldEl: HTMLElement;
  private readonly feedbackEl: HTMLElement;
  private readonly onEscape: (event: KeyboardEvent) => void;
  private openState = false;

  constructor(callbacks: MerchantPanelCallbacks) {
    document.getElementById("merchant-panel")?.remove();

    this.root = document.createElement("div");
    this.root.id = "merchant-panel";
    this.root.innerHTML = `
      <div class="merchant-card">
        <h2 id="merchant-title">MARCHAND</h2>
        <div class="merchant-section" data-section="loot">
          <p class="merchant-section-title">LOOT</p>
          <div id="merchant-loot-list"></div>
        </div>
        <div class="merchant-section" data-section="trade">
          <p class="merchant-section-title">TRADE</p>
          <div id="merchant-trade-list"></div>
        </div>
        <div class="merchant-section" data-section="weapons">
          <p class="merchant-section-title">WEAPONS</p>
          <div id="merchant-weapon-list"></div>
        </div>
        <p>Votre argent : <span id="merchant-gold">$0</span></p>
        <p class="merchant-feedback" id="merchant-feedback"></p>
        <button type="button" id="merchant-close">FERMER</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.titleEl = this.root.querySelector("#merchant-title") as HTMLElement;
    this.lootSection = this.root.querySelector(
      '[data-section="loot"]',
    ) as HTMLElement;
    this.lootListEl = this.root.querySelector("#merchant-loot-list") as HTMLElement;
    this.tradeSection = this.root.querySelector(
      '[data-section="trade"]',
    ) as HTMLElement;
    this.tradeListEl = this.root.querySelector(
      "#merchant-trade-list",
    ) as HTMLElement;
    this.weaponSection = this.root.querySelector(
      '[data-section="weapons"]',
    ) as HTMLElement;
    this.weaponListEl = this.root.querySelector(
      "#merchant-weapon-list",
    ) as HTMLElement;
    this.goldEl = this.root.querySelector("#merchant-gold") as HTMLElement;
    this.feedbackEl = this.root.querySelector("#merchant-feedback") as HTMLElement;

    this.lootListEl.addEventListener("click", (event) => {
      const action = readRowAction(event, ".merchant-loot-row", "itemId");
      if (!action) {
        return;
      }
      if (action.dataset.sell === "one") {
        callbacks.onSellOne(action.id);
      } else if (action.dataset.sell === "all") {
        callbacks.onSellAll(action.id);
      }
    });

    this.tradeListEl.addEventListener("click", (event) => {
      const action = readRowAction(event, ".merchant-trade-row", "itemId");
      if (!action) {
        return;
      }
      if (action.dataset.sell === "one") {
        callbacks.onSellOne(action.id);
      } else if (action.dataset.sell === "all") {
        callbacks.onSellAll(action.id);
      } else if (action.dataset.buy === "one") {
        callbacks.onBuyTrade(action.id, 1);
      } else if (action.dataset.buy === "max") {
        callbacks.onBuyTrade(action.id, "max");
      }
    });

    this.weaponListEl.addEventListener("click", (event) => {
      const action = readRowAction(event, ".merchant-weapon-row", "weaponId");
      if (!action) {
        return;
      }
      if (action.dataset.action === "buy") {
        callbacks.onBuyWeapon(action.id);
      } else if (action.dataset.action === "equip") {
        callbacks.onEquip(action.id);
      }
    });

    this.root
      .querySelector("#merchant-close")
      ?.addEventListener("click", () => callbacks.onClose());

    this.onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && this.openState) {
        event.preventDefault();
        callbacks.onClose();
      }
    };
    window.addEventListener("keydown", this.onEscape);
  }

  get isOpen(): boolean {
    return this.openState;
  }

  open(): void {
    this.openState = true;
    this.root.classList.add("open");
    this.feedbackEl.textContent = "";
  }

  close(): void {
    this.openState = false;
    this.root.classList.remove("open");
    this.feedbackEl.textContent = "";
  }

  refresh(view: MerchantPanelView): void {
    this.titleEl.textContent = view.title;
    this.goldEl.textContent = `$${view.gold}`;

    this.lootSection.hidden = view.lootItems.length === 0;
    this.lootListEl.innerHTML = view.lootItems
      .map((item) => lootRowHtml(item))
      .join("");

    this.tradeSection.hidden = view.tradeItems.length === 0;
    this.tradeListEl.innerHTML = view.tradeItems
      .map((item) => tradeRowHtml(item))
      .join("");

    this.weaponSection.hidden = view.weapons.length === 0;
    this.weaponListEl.innerHTML = view.weapons
      .map((weapon) => weaponRowHtml(weapon))
      .join("");
  }

  showFeedback(text: string): void {
    this.feedbackEl.textContent = text;
  }

  destroy(): void {
    this.close();
    window.removeEventListener("keydown", this.onEscape);
    this.root.remove();
  }
}

function lootRowHtml(item: MerchantLootRow): string {
  const disabled = item.quantity < 1 ? "disabled" : "";
  return `
    <div class="merchant-loot-row merchant-sell-row" data-item-id="${item.itemId}">
      <p class="merchant-item-name">${item.name}</p>
      <p>Owned: ${item.quantity}</p>
      <p class="merchant-price merchant-price-sell">SELL $${item.sellPrice}</p>
      <div class="merchant-actions">
        <button type="button" data-sell="one" ${disabled}>VENDRE 1</button>
        <button type="button" data-sell="all" ${disabled}>VENDRE TOUT</button>
      </div>
    </div>
  `;
}

function tradeRowHtml(item: MerchantTradeRow): string {
  const prices = [
    item.buyPrice !== null
      ? `<p class="merchant-price merchant-price-buy">BUY $${item.buyPrice}</p>`
      : "",
    item.sellPrice !== null
      ? `<p class="merchant-price merchant-price-sell">SELL $${item.sellPrice}</p>`
      : "",
  ].join("");

  const buttons: string[] = [];
  if (item.buyPrice !== null) {
    const disabled = item.canAfford ? "" : "disabled";
    buttons.push(
      `<button type="button" data-buy="one" ${disabled}>BUY 1</button>`,
    );
    buttons.push(
      `<button type="button" data-buy="max" ${disabled}>BUY MAX</button>`,
    );
  }
  if (item.sellPrice !== null) {
    const disabled = item.quantity < 1 ? "disabled" : "";
    buttons.push(
      `<button type="button" data-sell="one" ${disabled}>VENDRE 1</button>`,
    );
    buttons.push(
      `<button type="button" data-sell="all" ${disabled}>VENDRE TOUT</button>`,
    );
  }

  return `
    <div class="merchant-trade-row" data-item-id="${item.itemId}">
      <p class="merchant-item-name">${item.name}</p>
      <p>Owned: ${item.quantity}</p>
      ${prices}
      <div class="merchant-actions">${buttons.join("")}</div>
    </div>
  `;
}

function weaponRowHtml(weapon: MerchantWeaponRow): string {
  const price =
    weapon.owned || weapon.price <= 0 ? "" : ` · $${weapon.price}`;
  let action = "";
  if (weapon.equipped) {
    action = `<p class="merchant-weapon-status">EQUIPPED</p>`;
  } else if (weapon.owned) {
    action = `
      <p class="merchant-weapon-status">OWNED</p>
      <div class="merchant-actions">
        <button type="button" data-action="equip">EQUIP</button>
      </div>
    `;
  } else {
    const disabled = weapon.canAfford ? "" : "disabled";
    const status = weapon.canAfford ? "" : "Fonds insuffisants";
    action = `
      <p class="merchant-weapon-status">${status}</p>
      <div class="merchant-actions">
        <button type="button" data-action="buy" ${disabled}>BUY</button>
      </div>
    `;
  }

  return `
    <div class="merchant-weapon-row" data-weapon-id="${weapon.weaponId}">
      <p class="merchant-item-name">${weapon.name}</p>
      <p>${weapon.damage} DMG${price}</p>
      <p class="merchant-weapon-tag">${weapon.tag}</p>
      ${action}
    </div>
  `;
}

function readRowAction(
  event: Event,
  rowSelector: string,
  idAttr: "itemId" | "weaponId",
): { id: string; dataset: DOMStringMap } | null {
  const target = event.target as HTMLElement | null;
  const button = target?.closest("button") as HTMLButtonElement | null;
  const row = button?.closest(rowSelector) as HTMLElement | null;
  const id = idAttr === "itemId" ? row?.dataset.itemId : row?.dataset.weaponId;
  if (!button || !id || button.disabled) {
    return null;
  }
  return { id, dataset: button.dataset };
}
