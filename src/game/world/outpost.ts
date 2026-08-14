import { borderWalls, type InteractSpot, type ZoneRect } from "./geometry";

export const OUTPOST_WIDTH = 960;
export const OUTPOST_HEIGHT = 640;
export const OUTPOST_WALL_THICKNESS = 48;

export const OUTPOST_SPAWN = {
  x: 220,
  y: 340,
};

export const OUTPOST_EXIT: InteractSpot = {
  x: 120,
  y: 320,
  talkRange: 70,
};

export const OUTPOST_WALLS: ZoneRect[] = borderWalls(
  OUTPOST_WIDTH,
  OUTPOST_HEIGHT,
  OUTPOST_WALL_THICKNESS,
);

export const OUTPOST_OBSTACLES: ZoneRect[] = [
  { x: 700, y: 140, width: 90, height: 48 },
  { x: 360, y: 480, width: 64, height: 64 },
  { x: 760, y: 400, width: 140, height: 40 },
];
