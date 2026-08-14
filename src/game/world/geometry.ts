export type ZoneRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EnemySpawn = {
  typeId: string;
  x: number;
  y: number;
};

export type InteractSpot = {
  x: number;
  y: number;
  talkRange: number;
};

export function borderWalls(
  width: number,
  height: number,
  thickness: number,
): ZoneRect[] {
  return [
    { x: 0, y: 0, width, height: thickness },
    { x: 0, y: height - thickness, width, height: thickness },
    { x: 0, y: 0, width: thickness, height },
    { x: width - thickness, y: 0, width: thickness, height },
  ];
}

export function isInRange(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
  range: number,
): boolean {
  return Math.hypot(playerX - targetX, playerY - targetY) <= range;
}
