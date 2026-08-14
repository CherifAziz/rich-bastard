import Phaser from "phaser";
import { THEME } from "../../data/theme";

export const TEX = {
  townFloor: "tex-town-floor-v2",
  wildFloor: "tex-wild-floor-v2",
  dryFloor: "tex-dry-floor-v2",
  dangerFloor: "tex-danger-floor-v2",
  stoneWall: "tex-stone-wall-v2",
  earthWall: "tex-earth-wall-v2",
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
  ctx.fillStyle = rgb(THEME.townFloor, -8);
  ctx.fillRect(0, 0, TILE, TILE);
  const gw = 22;
  const gh = 16;
  for (let y = 0; y < TILE + gh; y += gh) {
    const stagger = ((y / gh) % 2) * (gw / 2);
    for (let x = -gw; x < TILE + gw; x += gw) {
      ctx.fillStyle = rgb(THEME.townFloor, rng() * 14 - 7);
      ctx.fillRect(x + stagger + 1, y + 1, gw - 2, gh - 2);
    }
  }
}

function paintGrass(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(27);
  ctx.fillStyle = rgb(THEME.wildGrass);
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 48; i++) {
    ctx.fillStyle = rgb(THEME.wildGrass, rng() * 16 - 10);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(rng() * TILE, rng() * TILE, 8 + rng() * 18, 6 + rng() * 12);
  }
  ctx.globalAlpha = 1;
}

function paintDry(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(33);
  ctx.fillStyle = rgb(THEME.dryGrass);
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 36; i++) {
    ctx.fillStyle = rgb(
      rng() > 0.5 ? THEME.wildDirt : THEME.wildGrassDark,
      rng() * 12 - 8,
    );
    ctx.globalAlpha = 0.32;
    ctx.fillRect(rng() * TILE, rng() * TILE, 10 + rng() * 22, 7 + rng() * 14);
  }
  ctx.globalAlpha = 1;
}

function paintDanger(ctx: CanvasRenderingContext2D): void {
  const rng = createRng(44);
  ctx.fillStyle = rgb(THEME.dangerGround);
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = rgb(THEME.dangerGroundDark, rng() * 10 - 6);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(rng() * TILE, rng() * TILE, 16 + rng() * 28, 10 + rng() * 20);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = rgb(THEME.dangerAccent);
    ctx.globalAlpha = 0.16;
    ctx.fillRect(rng() * TILE, rng() * TILE, 8 + rng() * 14, 6 + rng() * 10);
  }
  ctx.globalAlpha = 1;
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
  ensureCanvasTexture(scene, TEX.dryFloor, paintDry);
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
