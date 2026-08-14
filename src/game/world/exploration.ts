import { borderWalls, type EnemySpawn, type InteractSpot, type ZoneRect } from "./geometry";

export const EXPLORATION_WIDTH = 2560;
export const EXPLORATION_HEIGHT = 1600;
export const EXPLORATION_WALL_THICKNESS = 48;

export const EXPLORATION_ENTRY = {
  x: 220,
  y: 280,
};

export const EXPLORATION_EXIT: InteractSpot = {
  x: 180,
  y: 160,
  talkRange: 64,
};

export const EXPLORATION_WALLS: ZoneRect[] = borderWalls(
  EXPLORATION_WIDTH,
  EXPLORATION_HEIGHT,
  EXPLORATION_WALL_THICKNESS,
);

export const DANGER_ZONE: ZoneRect = {
  x: 1280,
  y: 0,
  width: EXPLORATION_WIDTH - 1280,
  height: EXPLORATION_HEIGHT,
};

export const EXPLORATION_ENEMIES: EnemySpawn[] = [
  { typeId: "rat", x: 560, y: 520 },
  { typeId: "rat", x: 240, y: 620 },
  { typeId: "rat", x: 780, y: 480 },
  { typeId: "bandit", x: 1580, y: 520 },
  { typeId: "bandit", x: 1920, y: 980 },
];

export const EXPLORATION_OBSTACLES: ZoneRect[] = [
  { x: 620, y: 260, width: 180, height: 56 },
  { x: 980, y: 620, width: 72, height: 240 },
  { x: 1500, y: 380, width: 220, height: 160 },
  { x: 420, y: 880, width: 300, height: 52 },
  { x: 1880, y: 720, width: 64, height: 64 },
  { x: 1980, y: 720, width: 64, height: 64 },
  { x: 1760, y: 1080, width: 200, height: 80 },
  { x: 720, y: 1200, width: 120, height: 180 },
];
