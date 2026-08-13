export type PlayerState = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  gold: number;
  equippedWeaponId: string | null;
  facingX: number;
  facingY: number;
  lastAttackAt: number;
};

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    width: 28,
    height: 28,
    speed: 260,
    hp: 100,
    maxHp: 100,
    damage: 10,
    defense: 0,
    gold: 0,
    equippedWeaponId: null,
    facingX: 1,
    facingY: 0,
    lastAttackAt: -1000,
  };
}

export function velocityFromInput(
  dirX: number,
  dirY: number,
  speed: number,
): { x: number; y: number } {
  const length = Math.hypot(dirX, dirY);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: (dirX / length) * speed,
    y: (dirY / length) * speed,
  };
}
