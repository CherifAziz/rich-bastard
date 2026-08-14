import Phaser from "phaser";
import { THEME } from "../../data/theme";

export const TEX = {
  townFloor: "tex-town-floor",
  wildFloor: "tex-wild-floor",
  dangerFloor: "tex-danger-floor",
  stoneWall: "tex-stone-wall",
  earthWall: "tex-earth-wall",
} as const;

const TILE = 128;

export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function rgb(color: number, shade = 0): string {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 255) + shade));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 255) + shade));
  const b = Math.max(0, Math.min(255, (color & 255) + shade));
  return `rgb(${r},${g},${b})`;
}

function ensureCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  paint: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const texture = scene.textures.createCanvas(key, TILE, TILE);
  if (!texture) {
    throw new Error(`Could not create texture ${key}`);
  }

  paint(texture.getContext());
  texture.refresh();
}

function paintCobble(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(11);
  ctx.fillStyle = rgb(THEME.townFloor, -18);
  ctx.fillRect(0, 0, TILE, TILE);
  const gw = 20;
  const gh = 14;
  for (let y = 0; y < TILE + gh; y += gh) {
    const stagger = ((y / gh) % 2) * (gw / 2);
    for (let x = -gw; x < TILE + gw; x += gw) {
      ctx.fillStyle = rgb(THEME.townFloor, rng() * 26 - 12);
      ctx.fillRect(x + stagger + 1, y + 1, gw - 3, gh - 3);
      ctx.strokeStyle = "rgba(42, 32, 22, 0.28)";
      ctx.strokeRect(x + stagger + 1, y + 1, gw - 3, gh - 3);
    }
  }
}

function paintGrass(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(27);
  ctx.fillStyle = rgb(THEME.wildGrass);
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 220; i++) {
    const x = rng() * TILE;
    const y = rng() * TILE;
    ctx.fillStyle = rgb(
      rng() > 0.15 ? THEME.wildGrass : THEME.wildDirt,
      rng() * 30 - 20,
    );
    ctx.fillRect(x, y, 2 + rng() * 3, 2 + rng() * 5);
  }
}

function paintDanger(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(44);
  ctx.fillStyle = rgb(THEME.dangerGround);
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = rgb(
      rng() > 0.55 ? THEME.dangerGroundDark : THEME.dangerAccent,
      rng() * 14 - 18,
    );
    ctx.globalAlpha = 0.28 + rng() * 0.25;
    ctx.fillRect(rng() * TILE, rng() * TILE, 18 + rng() * 36, 10 + rng() * 22);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(20, 10, 8, 0.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(rng() * TILE, rng() * TILE);
    ctx.lineTo(rng() * TILE, rng() * TILE);
    ctx.stroke();
  }
}

function paintBrick(
  ctx: CanvasRenderingContext2D,
  base: number,
  dark: number,
): void {
  const rng = createRng(base);
  ctx.fillStyle = rgb(dark);
  ctx.fillRect(0, 0, TILE, TILE);
  const bw = 28;
  const bh = 14;
  for (let y = 0; y < TILE + bh; y += bh) {
    const stagger = ((y / bh) % 2) * (bw / 2);
    for (let x = -bw; x < TILE + bw; x += bw) {
      ctx.fillStyle = rgb(base, rng() * 16 - 8);
      ctx.fillRect(x + stagger + 1, y + 1, bw - 2, bh - 2);
    }
  }
}

export function ensureWorldTextures(scene: Phaser.Scene): void {
  ensureCanvasTexture(scene, TEX.townFloor, paintCobble);
  ensureCanvasTexture(scene, TEX.wildFloor, paintGrass);
  ensureCanvasTexture(scene, TEX.dangerFloor, paintDanger);
  ensureCanvasTexture(scene, TEX.stoneWall, (ctx) =>
    paintBrick(ctx, THEME.wallTown, THEME.wallTownDark),
  );
  ensureCanvasTexture(scene, TEX.earthWall, (ctx) =>
    paintBrick(ctx, THEME.wallWild, THEME.wallWildDark),
  );
}

export function addTiledFloor(
  scene: Phaser.Scene,
  width: number,
  height: number,
  texture: string,
  depth: number,
): Phaser.GameObjects.TileSprite {
  return scene.add
    .tileSprite(width / 2, height / 2, width, height, texture)
    .setDepth(depth);
}
