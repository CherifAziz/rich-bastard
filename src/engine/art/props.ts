import Phaser from "phaser";
import { FONT, THEME, THEME_HEX } from "../../data/theme";
import type { ZoneRect } from "../../game/world/geometry";
import { DEPTH } from "./depth";
import { createRng } from "./textures";

export function addShadow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Ellipse {
  return scene.add
    .ellipse(x, y, width, height, THEME.shadow, 0.28)
    .setDepth(DEPTH.shadow);
}

export function addPrompt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
): { label: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle } {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: "15px",
      fontStyle: "bold",
      color: THEME_HEX.paper,
      stroke: THEME_HEX.stroke,
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.prompt)
    .setVisible(false);

  const bg = scene.add
    .rectangle(x, y, Math.max(160, text.length * 9 + 20), 24, THEME.ink, 0.62)
    .setStrokeStyle(1, THEME.gold, 0.55)
    .setDepth(DEPTH.prompt - 1)
    .setVisible(false);

  return { label, bg };
}

export function addTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options?: { dead?: boolean; scale?: number },
): void {
  const scale = options?.scale ?? 1;
  const dead = options?.dead ?? false;
  scene.add
    .ellipse(x, y + 10 * scale, 22 * scale, 10 * scale, THEME.shadow, 0.22)
    .setDepth(DEPTH.shadow);
  scene.add
    .rectangle(x, y, 8 * scale, 22 * scale, THEME.wildTrunk)
    .setDepth(DEPTH.prop);
  const canopy = dead ? THEME.dangerDead : THEME.wildCanopy;
  const light = dead ? THEME.dangerGround : THEME.wildCanopyLight;
  scene.add
    .ellipse(x, y - 16 * scale, 36 * scale, 28 * scale, canopy)
    .setDepth(DEPTH.canopy);
  scene.add
    .ellipse(x - 8 * scale, y - 20 * scale, 20 * scale, 16 * scale, light)
    .setDepth(DEPTH.canopy);
}

export function addBush(
  scene: Phaser.Scene,
  x: number,
  y: number,
  dead = false,
): void {
  const color = dead ? THEME.dangerDead : THEME.townLeaf;
  const light = dead ? THEME.dangerGround : THEME.townLeafDark;
  scene.add.ellipse(x, y + 6, 18, 8, THEME.shadow, 0.2).setDepth(DEPTH.shadow);
  scene.add.ellipse(x, y, 20, 14, color).setDepth(DEPTH.prop);
  scene.add.ellipse(x - 6, y - 2, 12, 10, light).setDepth(DEPTH.prop);
}

export function addRock(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  scorched = false,
): void {
  const color = scorched ? THEME.dangerGroundDark : THEME.wildRock;
  const dark = scorched ? THEME.ink : THEME.wildRockDark;
  scene.add
    .ellipse(x, y + height * 0.28, width * 0.9, height * 0.4, THEME.shadow, 0.25)
    .setDepth(DEPTH.shadow);
  scene.add.ellipse(x, y, width, height * 0.85, color).setDepth(DEPTH.prop);
  scene.add
    .ellipse(x - width * 0.12, y - height * 0.12, width * 0.4, height * 0.28, dark)
    .setDepth(DEPTH.prop);
}

export function addLog(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  scene.add
    .ellipse(x, y + 6, width * 0.9, height * 0.7, THEME.shadow, 0.22)
    .setDepth(DEPTH.shadow);
  scene.add.ellipse(x, y, width, height * 0.7, THEME.wildTrunk).setDepth(DEPTH.prop);
  scene.add
    .ellipse(x - width * 0.42, y, height * 0.55, height * 0.7, THEME.playerBatDark)
    .setDepth(DEPTH.prop);
  scene.add
    .ellipse(x + width * 0.42, y, height * 0.55, height * 0.7, THEME.playerBatDark)
    .setDepth(DEPTH.prop);
}

export function addRuin(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  scene.add
    .rectangle(x, y, width, height, THEME.dangerGroundDark)
    .setDepth(DEPTH.prop);
  scene.add
    .rectangle(x - width * 0.2, y - height * 0.15, width * 0.35, height * 0.4, THEME.wildRock)
    .setDepth(DEPTH.prop);
  scene.add
    .rectangle(
      x + width * 0.22,
      y + height * 0.1,
      width * 0.28,
      height * 0.35,
      THEME.wallTown,
    )
    .setDepth(DEPTH.prop);
}

export function addCrate(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.ellipse(x, y + 10, 18, 8, THEME.shadow, 0.22).setDepth(DEPTH.shadow);
  scene.add.rectangle(x, y, 18, 16, THEME.townWood).setDepth(DEPTH.prop);
  scene.add.rectangle(x, y - 2, 18, 3, THEME.townWoodDark).setDepth(DEPTH.prop);
}

export function addBarrel(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.ellipse(x, y + 10, 14, 7, THEME.shadow, 0.22).setDepth(DEPTH.shadow);
  scene.add.ellipse(x, y, 14, 18, THEME.townWood).setDepth(DEPTH.prop);
  scene.add.rectangle(x, y, 14, 2, THEME.gold, 0.35).setDepth(DEPTH.prop);
}

export function addWell(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.ellipse(x, y + 14, 40, 16, THEME.shadow, 0.25).setDepth(DEPTH.shadow);
  scene.add.ellipse(x, y, 44, 28, THEME.wallTown).setDepth(DEPTH.prop);
  scene.add.ellipse(x, y, 26, 16, 0x2a3a48).setDepth(DEPTH.prop);
  scene.add.rectangle(x, y - 18, 6, 22, THEME.townWood).setDepth(DEPTH.prop);
  scene.add.rectangle(x, y - 28, 28, 6, THEME.townWoodDark).setDepth(DEPTH.prop);
}

export function addCart(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  scene.add
    .ellipse(x, y + 8, width * 0.9, height * 0.5, THEME.shadow, 0.2)
    .setDepth(DEPTH.shadow);
  scene.add.rectangle(x, y, width * 0.9, height * 0.7, THEME.townWood).setDepth(DEPTH.prop);
  scene.add.circle(x - width * 0.28, y + height * 0.2, 7, THEME.ink).setDepth(DEPTH.prop);
  scene.add.circle(x + width * 0.28, y + height * 0.2, 7, THEME.ink).setDepth(DEPTH.prop);
}

export function addCrateRow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
): void {
  const count = Math.max(2, Math.round(width / 36));
  const start = x - width / 2 + 18;
  for (let i = 0; i < count; i++) {
    addCrate(scene, start + i * 36, y + (i % 2) * 4);
  }
}

export function addSignPost(
  scene: Phaser.Scene,
  x: number,
  y: number,
  line1: string,
  line2?: string,
  color: string = THEME_HEX.gold,
): void {
  scene.add.rectangle(x, y, 6, 28, THEME.townWoodDark).setDepth(DEPTH.prop);
  scene.add
    .rectangle(x, y - 18, 52, line2 ? 28 : 18, THEME.townWood)
    .setStrokeStyle(2, THEME.gold, 0.8)
    .setDepth(DEPTH.prop);
  scene.add
    .text(x, y - (line2 ? 22 : 18), line1, {
      fontFamily: FONT,
      fontSize: "10px",
      fontStyle: "bold",
      color,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.prop);
  if (line2) {
    scene.add
      .text(x, y - 12, line2, {
        fontFamily: FONT,
        fontSize: "10px",
        fontStyle: "bold",
        color,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.prop);
  }
}

export function addArchGate(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string,
  warm: boolean,
): void {
  const pillar = warm ? THEME.wallTown : THEME.dangerGroundDark;
  const roof = warm ? THEME.townRoof : THEME.dangerAccent;
  scene.add.ellipse(x, y + 28, 70, 18, THEME.shadow, 0.22).setDepth(DEPTH.shadow);
  scene.add.rectangle(x - 28, y + 6, 14, 52, pillar).setDepth(DEPTH.prop);
  scene.add.rectangle(x + 28, y + 6, 14, 52, pillar).setDepth(DEPTH.prop);
  scene.add.rectangle(x, y - 24, 72, 16, roof).setDepth(DEPTH.prop);
  scene.add.ellipse(x, y - 18, 70, 22, roof).setDepth(DEPTH.prop);
  scene.add
    .text(x, y - 58, title, {
      fontFamily: FONT,
      fontSize: "13px",
      fontStyle: "bold",
      color: THEME_HEX.gold,
      stroke: THEME_HEX.stroke,
      strokeThickness: 3,
      align: "center",
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.prop);
}

export function addBuildingFacade(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  scene.add.rectangle(x, y, width, height, THEME.townPlaster).setDepth(DEPTH.wall);
  scene.add
    .rectangle(x, y - height / 2 - 8, width + 12, 18, THEME.townRoof)
    .setDepth(DEPTH.wall);
  scene.add
    .triangle(
      x,
      y - height / 2 - 18,
      0,
      -10,
      -width / 2 - 8,
      10,
      width / 2 + 8,
      10,
      THEME.townRoof,
    )
    .setDepth(DEPTH.wall);
  const windows = Math.max(1, Math.floor(width / 50));
  for (let i = 0; i < windows; i++) {
    const wx = x - width / 2 + 24 + i * (width / windows);
    scene.add.rectangle(wx, y - 4, 10, 12, 0x2a3a48).setDepth(DEPTH.wall);
  }
}

export function dressWalls(
  scene: Phaser.Scene,
  walls: ZoneRect[],
  texture: string,
): void {
  for (const wall of walls) {
    scene.add
      .tileSprite(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width,
        wall.height,
        texture,
      )
      .setDepth(DEPTH.wall);
  }
}

export function dressObstacle(
  scene: Phaser.Scene,
  rect: ZoneRect,
  kind: "town" | "wild" | "danger",
): void {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const ratio = rect.width / rect.height;

  if (kind === "town") {
    if (rect.width > 120) {
      addCrateRow(scene, x, y, rect.width);
      return;
    }
    if (Math.abs(rect.width - rect.height) < 8) {
      addWell(scene, x, y);
      return;
    }
    addCart(scene, x, y, rect.width, rect.height);
    return;
  }

  if (ratio > 2.2) {
    addLog(scene, x, y, rect.width, rect.height);
    return;
  }
  if (ratio < 0.45) {
    addRock(scene, x, y, rect.width, rect.height, kind === "danger");
    return;
  }
  if (rect.width > 150) {
    addRuin(scene, x, y, rect.width, rect.height);
    return;
  }
  addRock(scene, x, y, rect.width, rect.height, kind === "danger");
}

export function addPath(
  scene: Phaser.Scene,
  points: { x: number; y: number }[],
  radius: number,
  color: number,
): void {
  const g = scene.add.graphics();
  g.setDepth(DEPTH.path);
  g.fillStyle(color, 0.92);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 10));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      g.fillCircle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, radius);
    }
  }
}

export function addGroundSpecks(
  scene: Phaser.Scene,
  bounds: { width: number; height: number; margin: number },
  seed: number,
  color: number,
  count: number,
): void {
  const rng = createRng(seed);
  const g = scene.add.graphics();
  g.setDepth(DEPTH.floorDetail);
  g.fillStyle(color, 0.35);
  for (let i = 0; i < count; i++) {
    const x = bounds.margin + rng() * (bounds.width - bounds.margin * 2);
    const y = bounds.margin + rng() * (bounds.height - bounds.margin * 2);
    g.fillCircle(x, y, 1 + rng() * 2.4);
  }
}
