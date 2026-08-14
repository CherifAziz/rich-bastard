export type MerchantPanelCallbacks = {
  onSellOne: () => void;
  onSellAll: () => void;
  onBuy: () => void;
  onClose: () => void;
};

export type MerchantPanelView = {
  itemName: string;
  quantity: number;
  sellPrice: number;
  gold: number;
  weaponName: string;
  weaponPrice: number;
  weaponOwned: boolean;
};

export class MerchantPanel {
  private readonly root: HTMLElement;
  private readonly quantityEl: HTMLElement;
  private readonly goldEl: HTMLElement;
  private readonly priceEl: HTMLElement;
  private readonly weaponNameEl: HTMLElement;
  private readonly weaponPriceEl: HTMLElement;
  private readonly weaponStatusEl: HTMLElement;
  private readonly feedbackEl: HTMLElement;
  private readonly sellOneButton: HTMLButtonElement;
  private readonly sellAllButton: HTMLButtonElement;
  private readonly buyButton: HTMLButtonElement;
  private openState = false;

  constructor(callbacks: MerchantPanelCallbacks) {
    document.getElementById("merchant-panel")?.remove();

    this.root = document.createElement("div");
    this.root.id = "merchant-panel";
    this.root.innerHTML = `
      <div class="merchant-card">
        <h2>MARCHAND</h2>
        <p class="merchant-item-name" id="merchant-item-name">Cheese</p>
        <p>Vous avez : <span id="merchant-qty">0</span></p>
        <p>Prix de vente : <span id="merchant-price">$0</span></p>
        <div class="merchant-actions">
          <button type="button" id="merchant-sell-one">VENDRE 1</button>
          <button type="button" id="merchant-sell-all">VENDRE TOUT</button>
        </div>
        <div class="merchant-divider"></div>
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

    this.quantityEl = this.root.querySelector("#merchant-qty") as HTMLElement;
    this.goldEl = this.root.querySelector("#merchant-gold") as HTMLElement;
    this.priceEl = this.root.querySelector("#merchant-price") as HTMLElement;
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
    this.sellOneButton = this.root.querySelector(
      "#merchant-sell-one",
    ) as HTMLButtonElement;
    this.sellAllButton = this.root.querySelector(
      "#merchant-sell-all",
    ) as HTMLButtonElement;
    this.buyButton = this.root.querySelector("#merchant-buy") as HTMLButtonElement;

    this.sellOneButton.addEventListener("click", () => callbacks.onSellOne());
    this.sellAllButton.addEventListener("click", () => callbacks.onSellAll());
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
    const nameEl = this.root.querySelector("#merchant-item-name");
    if (nameEl) {
      nameEl.textContent = view.itemName;
    }

    this.quantityEl.textContent = String(view.quantity);
    this.priceEl.textContent = `$${view.sellPrice}`;
    this.goldEl.textContent = `$${view.gold}`;
    this.weaponNameEl.textContent = view.weaponName;
    this.weaponPriceEl.textContent = `$${view.weaponPrice}`;
    this.sellOneButton.disabled = view.quantity < 1;
    this.sellAllButton.disabled = view.quantity < 1;

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
