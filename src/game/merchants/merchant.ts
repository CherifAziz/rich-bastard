export function isInTalkRange(
  playerX: number,
  playerY: number,
  merchantX: number,
  merchantY: number,
  talkRange: number,
): boolean {
  return Math.hypot(playerX - merchantX, playerY - merchantY) <= talkRange;
}
