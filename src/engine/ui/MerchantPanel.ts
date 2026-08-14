export type MerchantPanelCallbacks = {
  onSellOne: () => void;
  onSellAll: () => void;
  onClose: () => void;
};

export class MerchantPanel {
  private readonly root: HTMLElement;
  private readonly quantityEl: HTMLElement;
  private readonly goldEl: HTMLElement;
  private readonly priceEl: HTMLElement;
  private readonly feedbackEl: HTMLElement;
  private readonly sellOneButton: HTMLButtonElement;
  private readonly sellAllButton: HTMLButtonElement;
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
        <p>Votre argent : <span id="merchant-gold">$0</span></p>
        <p class="merchant-feedback" id="merchant-feedback"></p>
        <button type="button" id="merchant-close">FERMER</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.quantityEl = this.root.querySelector("#merchant-qty") as HTMLElement;
    this.goldEl = this.root.querySelector("#merchant-gold") as HTMLElement;
    this.priceEl = this.root.querySelector("#merchant-price") as HTMLElement;
    this.feedbackEl = this.root.querySelector("#merchant-feedback") as HTMLElement;
    this.sellOneButton = this.root.querySelector(
      "#merchant-sell-one",
    ) as HTMLButtonElement;
    this.sellAllButton = this.root.querySelector(
      "#merchant-sell-all",
    ) as HTMLButtonElement;

    this.sellOneButton.addEventListener("click", () => callbacks.onSellOne());
    this.sellAllButton.addEventListener("click", () => callbacks.onSellAll());
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

  refresh(itemName: string, quantity: number, sellPrice: number, gold: number): void {
    const nameEl = this.root.querySelector("#merchant-item-name");
    if (nameEl) {
      nameEl.textContent = itemName;
    }

    this.quantityEl.textContent = String(quantity);
    this.priceEl.textContent = `$${sellPrice}`;
    this.goldEl.textContent = `$${gold}`;
    this.sellOneButton.disabled = quantity < 1;
    this.sellAllButton.disabled = quantity < 1;
  }

  showFeedback(text: string): void {
    this.feedbackEl.textContent = text;
  }
}
