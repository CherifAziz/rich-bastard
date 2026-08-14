export type Cardinal = "up" | "down" | "left" | "right";

export function cardinalFrom(dirX: number, dirY: number): Cardinal {
  if (Math.abs(dirX) > Math.abs(dirY)) {
    return dirX < 0 ? "left" : "right";
  }
  return dirY < 0 ? "up" : "down";
}
