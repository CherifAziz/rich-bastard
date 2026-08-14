export type ZoneRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const TEST_ZONE_WIDTH = 2560;
export const TEST_ZONE_HEIGHT = 1600;
export const TEST_ZONE_WALL_THICKNESS = 48;

export const TEST_ZONE_SPAWN = {
  x: 360,
  y: 360,
};

export const TEST_ZONE_WALLS: ZoneRect[] = [
  {
    x: 0,
    y: 0,
    width: TEST_ZONE_WIDTH,
    height: TEST_ZONE_WALL_THICKNESS,
  },
  {
    x: 0,
    y: TEST_ZONE_HEIGHT - TEST_ZONE_WALL_THICKNESS,
    width: TEST_ZONE_WIDTH,
    height: TEST_ZONE_WALL_THICKNESS,
  },
  {
    x: 0,
    y: 0,
    width: TEST_ZONE_WALL_THICKNESS,
    height: TEST_ZONE_HEIGHT,
  },
  {
    x: TEST_ZONE_WIDTH - TEST_ZONE_WALL_THICKNESS,
    y: 0,
    width: TEST_ZONE_WALL_THICKNESS,
    height: TEST_ZONE_HEIGHT,
  },
];

export type EnemySpawn = {
  typeId: string;
  x: number;
  y: number;
};

export const DANGER_ZONE: ZoneRect = {
  x: 1280,
  y: 0,
  width: TEST_ZONE_WIDTH - 1280,
  height: TEST_ZONE_HEIGHT,
};

export const TEST_ZONE_ENEMIES: EnemySpawn[] = [
  { typeId: "rat", x: 560, y: 520 },
  { typeId: "rat", x: 240, y: 620 },
  { typeId: "rat", x: 780, y: 480 },
  { typeId: "bandit", x: 1580, y: 520 },
  { typeId: "bandit", x: 1920, y: 980 },
];

export const TEST_ZONE_OBSTACLES: ZoneRect[] = [
  { x: 620, y: 260, width: 180, height: 56 },
  { x: 980, y: 620, width: 72, height: 240 },
  { x: 1500, y: 380, width: 220, height: 160 },
  { x: 420, y: 880, width: 300, height: 52 },
  { x: 1880, y: 720, width: 64, height: 64 },
  { x: 1980, y: 720, width: 64, height: 64 },
  { x: 1760, y: 1080, width: 200, height: 80 },
  { x: 720, y: 1200, width: 120, height: 180 },
];
