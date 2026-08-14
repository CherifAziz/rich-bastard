export type MerchantPanelCallbacks = {
  onSellOne: (itemId: string) => void;
  onSellAll: (itemId: string) => void;
  onBuy: (weaponId: string) => void;
  onEquip: (weaponId: string) => void;
  onClose: () => void;
};

export type MerchantSellRow = {
  itemId: string;
  name: string;
  quantity: number;
  sellPrice: number;
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
  sellItems: MerchantSellRow[];
  weapons: MerchantWeaponRow[];
  gold: number;
};

export class MerchantPanel {
  private readonly root: HTMLElement;
  private readonly sellListEl: HTMLElement;
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
        <h2>MARCHAND</h2>
        <p class="merchant-section-title">SELL</p>
        <div id="merchant-sell-list"></div>
        <div class="merchant-divider"></div>
        <p class="merchant-section-title">WEAPONS</p>
        <div id="merchant-weapon-list"></div>
        <p>Votre argent : <span id="merchant-gold">$0</span></p>
        <p class="merchant-feedback" id="merchant-feedback"></p>
        <button type="button" id="merchant-close">FERMER</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.sellListEl = this.root.querySelector(
      "#merchant-sell-list",
    ) as HTMLElement;
    this.weaponListEl = this.root.querySelector(
      "#merchant-weapon-list",
    ) as HTMLElement;
    this.goldEl = this.root.querySelector("#merchant-gold") as HTMLElement;
    this.feedbackEl = this.root.querySelector("#merchant-feedback") as HTMLElement;

    this.sellListEl.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      const row = button?.closest(".merchant-sell-row") as HTMLElement | null;
      const itemId = row?.dataset.itemId;
      if (!button || !itemId || button.disabled) {
        return;
      }

      if (button.dataset.sell === "one") {
        callbacks.onSellOne(itemId);
      } else if (button.dataset.sell === "all") {
        callbacks.onSellAll(itemId);
      }
    });

    this.weaponListEl.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      const row = button?.closest(".merchant-weapon-row") as HTMLElement | null;
      const weaponId = row?.dataset.weaponId;
      if (!button || !weaponId || button.disabled) {
        return;
      }

      if (button.dataset.action === "buy") {
        callbacks.onBuy(weaponId);
      } else if (button.dataset.action === "equip") {
        callbacks.onEquip(weaponId);
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
    this.goldEl.textContent = `$${view.gold}`;

    this.sellListEl.innerHTML = view.sellItems
      .map((item) => {
        const disabled = item.quantity < 1 ? "disabled" : "";
        return `
          <div class="merchant-sell-row" data-item-id="${item.itemId}">
            <p class="merchant-item-name">${item.name}</p>
            <p>Owned: ${item.quantity}</p>
            <p>Sell: $${item.sellPrice}</p>
            <div class="merchant-actions">
              <button type="button" data-sell="one" ${disabled}>VENDRE 1</button>
              <button type="button" data-sell="all" ${disabled}>VENDRE TOUT</button>
            </div>
          </div>
        `;
      })
      .join("");

    this.weaponListEl.innerHTML = view.weapons
      .map((weapon) => {
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
      })
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
