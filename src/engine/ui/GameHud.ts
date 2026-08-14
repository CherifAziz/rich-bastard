import Phaser from "phaser";
import { ITEM_BY_ID } from "../../data/items";
import { getItemQuantity } from "../../game/inventory/inventory";
import {
  DASH_COOLDOWN_MS,
  canDash,
  isDashing,
} from "../../game/player/dash";
import { getEquippedWeapon } from "../../game/player/player";
import type { PlayerState } from "../../game/player/player";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class GameHud {
  private readonly root: HTMLElement;
  private readonly hpText: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly gold: HTMLElement;
  private readonly weapon: HTMLElement;
  private readonly inventory: HTMLElement;
  private readonly dashFill: HTMLElement;
  private readonly dashText: HTMLElement;
  private readonly coords: HTMLElement;
  private readonly onResize: () => void;
  private readonly onKeyDown: (event: KeyboardEvent) => void;
  private debug = false;

  constructor(scene: Phaser.Scene, hint: string) {
    document.getElementById("game-hud")?.remove();

    this.root = document.createElement("div");
    this.root.id = "game-hud";
    this.root.innerHTML = `
      <div class="hud-panel">
        <div class="hud-row">
          <span class="hud-hp" data-hud="hp"></span>
          <span class="hud-gold" data-hud="gold"></span>
        </div>
        <div class="hud-track hud-track-hp">
          <div class="hud-fill hud-fill-hp" data-hud="hp-fill"></div>
        </div>
        <p class="hud-weapon" data-hud="weapon"></p>
        <p class="hud-inv" data-hud="inv"></p>
        <div class="hud-row hud-dash-row">
          <span class="hud-dash" data-hud="dash"></span>
          <div class="hud-track hud-track-dash">
            <div class="hud-fill hud-fill-dash" data-hud="dash-fill"></div>
          </div>
        </div>
      </div>
      <p class="hud-coords" data-hud="coords" hidden></p>
      <p class="hud-hint">${hint}</p>
    `;

    const parent = scene.game.canvas.parentElement ?? document.getElementById("game");
    (parent ?? document.body).appendChild(this.root);

    this.hpText = this.root.querySelector("[data-hud='hp']") as HTMLElement;
    this.hpFill = this.root.querySelector("[data-hud='hp-fill']") as HTMLElement;
    this.gold = this.root.querySelector("[data-hud='gold']") as HTMLElement;
    this.weapon = this.root.querySelector("[data-hud='weapon']") as HTMLElement;
    this.inventory = this.root.querySelector("[data-hud='inv']") as HTMLElement;
    this.dashFill = this.root.querySelector("[data-hud='dash-fill']") as HTMLElement;
    this.dashText = this.root.querySelector("[data-hud='dash']") as HTMLElement;
    this.coords = this.root.querySelector("[data-hud='coords']") as HTMLElement;

    this.onResize = () => this.syncToCanvas(scene.game);
    this.onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== "F3") {
        return;
      }
      event.preventDefault();
      this.debug = !this.debug;
      this.coords.hidden = !this.debug;
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("resize", this.onResize);
    scene.scale.on("resize", this.onResize);
    this.syncToCanvas(scene.game);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy(scene);
    });
  }

  refresh(player: PlayerState, time: number): void {
    const weapon = getEquippedWeapon(player);
    const hpRatio = player.hp / Math.max(1, player.maxHp);
    this.hpFill.style.width = `${Math.round(hpRatio * 100)}%`;
    this.hpText.textContent = `HP ${player.hp}/${player.maxHp}`;
    this.gold.textContent = `$${player.gold}`;
    this.weapon.textContent = `${weapon.name} · ${weapon.damage} DMG`;
    this.inventory.textContent = Object.values(ITEM_BY_ID)
      .map(
        (item) =>
          `${item.name} ×${getItemQuantity(player.inventory, item.id)}`,
      )
      .join("  ");

    this.dashFill.classList.toggle("is-dash", isDashing(player, time));
    if (isDashing(player, time)) {
      this.dashFill.style.width = "100%";
      this.dashText.textContent = "DASH";
    } else if (canDash(player, time)) {
      this.dashFill.style.width = "100%";
      this.dashText.textContent = "READY";
    } else {
      const remaining = Math.max(0, player.dashCooldownUntil - time);
      this.dashFill.style.width = `${Math.round((1 - remaining / DASH_COOLDOWN_MS) * 100)}%`;
      this.dashText.textContent = `${(remaining / 1000).toFixed(1)}s`;
    }

    if (this.debug) {
      this.coords.textContent = `${Math.round(player.x)}, ${Math.round(player.y)}`;
    }
  }

  private syncToCanvas(game: Phaser.Game): void {
    const canvas = game.canvas;
    const scaleX = canvas.clientWidth / GAME_WIDTH;
    const scaleY = canvas.clientHeight / GAME_HEIGHT;
    this.root.style.left = `${canvas.offsetLeft}px`;
    this.root.style.top = `${canvas.offsetTop}px`;
    this.root.style.width = `${GAME_WIDTH}px`;
    this.root.style.height = `${GAME_HEIGHT}px`;
    this.root.style.transform = `scale(${scaleX}, ${scaleY})`;
  }

  private destroy(scene: Phaser.Scene): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onResize);
    scene.scale.off("resize", this.onResize);
    this.root.remove();
  }
}
