import { borderWalls, type InteractSpot, type ZoneRect } from "./geometry";

export const TOWN_WIDTH = 1280;
export const TOWN_HEIGHT = 800;
export const TOWN_WALL_THICKNESS = 48;

export const TOWN_SPAWN = {
  x: 360,
  y: 480,
};

export const TOWN_EXIT: InteractSpot = {
  x: 1140,
  y: 400,
  talkRange: 70,
};

export const TOWN_WALLS: ZoneRect[] = borderWalls(
  TOWN_WIDTH,
  TOWN_HEIGHT,
  TOWN_WALL_THICKNESS,
);

export const TOWN_OBSTACLES: ZoneRect[] = [
  { x: 560, y: 180, width: 90, height: 48 },
  { x: 720, y: 520, width: 64, height: 64 },
  { x: 140, y: 600, width: 140, height: 40 },
];
