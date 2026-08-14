export type MerchantPanelCallbacks = {
  onSellOne: (itemId: string) => void;
  onSellAll: (itemId: string) => void;
  onBuy: () => void;
  onClose: () => void;
};

export type MerchantSellRow = {
  itemId: string;
  name: string;
  quantity: number;
  sellPrice: number;
};

export type MerchantPanelView = {
  sellItems: MerchantSellRow[];
  gold: number;
  weaponName: string;
  weaponPrice: number;
  weaponOwned: boolean;
};

export class MerchantPanel {
  private readonly root: HTMLElement;
  private readonly sellListEl: HTMLElement;
  private readonly goldEl: HTMLElement;
  private readonly weaponNameEl: HTMLElement;
  private readonly weaponPriceEl: HTMLElement;
  private readonly weaponStatusEl: HTMLElement;
  private readonly feedbackEl: HTMLElement;
  private readonly buyButton: HTMLButtonElement;
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
        <p class="merchant-section-title">BUY</p>
        <p class="merchant-item-name" id="merchant-weapon-name">Rusty Bat</p>
        <p>Prix : <span id="merchant-weapon-price">$150</span></p>
        <p class="merchant-weapon-status" id="merchant-weapon-status"></p>
        <div class="merchant-actions">
          <button type="button" id="merchant-buy">ACHETER</button>
        </div>
        <p>Votre argent : <span id="merchant-gold">$0</span></p>
        <p class="merchant-feedback" id="merchant-feedback"></p>
        <button type="button" id="merchant-close">FERMER</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.sellListEl = this.root.querySelector(
      "#merchant-sell-list",
    ) as HTMLElement;
    this.goldEl = this.root.querySelector("#merchant-gold") as HTMLElement;
    this.weaponNameEl = this.root.querySelector(
      "#merchant-weapon-name",
    ) as HTMLElement;
    this.weaponPriceEl = this.root.querySelector(
      "#merchant-weapon-price",
    ) as HTMLElement;
    this.weaponStatusEl = this.root.querySelector(
      "#merchant-weapon-status",
    ) as HTMLElement;
    this.feedbackEl = this.root.querySelector("#merchant-feedback") as HTMLElement;
    this.buyButton = this.root.querySelector("#merchant-buy") as HTMLButtonElement;

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

    this.buyButton.addEventListener("click", () => callbacks.onBuy());
    this.root
      .querySelector("#merchant-close")
      ?.addEventListener("click", () => callbacks.onClose());

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.openState) {
        event.preventDefault();
        callbacks.onClose();
      }
    });
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
    this.weaponNameEl.textContent = view.weaponName;
    this.weaponPriceEl.textContent = `$${view.weaponPrice}`;

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

    if (view.weaponOwned) {
      this.weaponStatusEl.textContent = "OWNED / EQUIPPED";
      this.buyButton.disabled = true;
    } else if (view.gold < view.weaponPrice) {
      this.weaponStatusEl.textContent = "Fonds insuffisants";
      this.buyButton.disabled = true;
    } else {
      this.weaponStatusEl.textContent = "";
      this.buyButton.disabled = false;
    }
  }

  showFeedback(text: string): void {
    this.feedbackEl.textContent = text;
  }
}
