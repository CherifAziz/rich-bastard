export const THEME = {
  gold: 0xe0b44a,
  goldSoft: 0xf0d78c,
  ink: 0x1a140e,
  paper: 0xf3ead4,
  muted: 0xb8b09f,

  uiBg: 0x1c1610,
  uiPanel: 0x2a2218,
  uiHp: 0xd4544a,
  uiHpBg: 0x3a201c,
  uiDash: 0x6eb3c9,
  uiDashBg: 0x243038,

  playerTunic: 0xc45a2c,
  playerShirt: 0xe8d2a8,
  playerSkin: 0xf0c2a0,
  playerHair: 0x3a241c,
  playerBoot: 0x4a3024,
  playerKnife: 0xc8c2b4,
  playerKnifeDark: 0x7a7568,
  playerBat: 0x8a5a32,
  playerBatDark: 0x5a3a20,
  playerSpear: 0x6a4a2e,
  playerSpearTip: 0xb8c0c8,

  ratFur: 0x8b5e45,
  ratFurDark: 0x5c3c2e,
  ratEar: 0xd4a090,
  ratEye: 0x1a1208,
  ratNose: 0x3a2020,

  banditCloak: 0x2e1a1e,
  banditShirt: 0x4a2c28,
  banditBandana: 0xa81e28,
  banditSkin: 0xc9a07a,
  banditSteel: 0x8a9098,

  cheese: 0xf2c43c,
  cheeseHole: 0xd9a628,
  cheeseRind: 0xe8b84a,
  scrap: 0x8f98a3,
  scrapDark: 0x5c646e,
  scrapLight: 0xc5ccd4,

  townFloor: 0x7a6a52,
  townPath: 0x9a8264,
  townWood: 0x6b4a2e,
  townWoodDark: 0x4a301c,
  townRoof: 0x8b3a28,
  townPlaster: 0xc4b090,
  townLeaf: 0x3f6a38,
  townLeafDark: 0x2c4a28,

  wildGrass: 0x4a6b3c,
  wildGrassDark: 0x35522e,
  wildDirt: 0x6e5a3c,
  wildRock: 0x6e6a66,
  wildRockDark: 0x4a4844,
  wildTrunk: 0x5a3e28,
  wildCanopy: 0x2f5c32,
  wildCanopyLight: 0x4a7a3e,

  dangerGround: 0x5a4a38,
  dangerGroundDark: 0x3c3228,
  dangerAccent: 0xa85a48,
  dangerDead: 0x6a5c40,
  dryGrass: 0x6b6a3c,

  wallTown: 0x5c564c,
  wallTownDark: 0x3f3b34,
  wallWild: 0x3d4a38,
  wallWildDark: 0x2a3328,

  shadow: 0x000000,
  telegraphFill: 0xe05a4f,
  telegraphEdge: 0xffe7a0,
  swing: 0xfff2a8,
  miss: 0x9a958c,
} as const;

export const THEME_HEX = {
  gold: "#e0b44a",
  goldSoft: "#f0d78c",
  paper: "#f3ead4",
  muted: "#b8b09f",
  hp: "#d4544a",
  damage: "#e05a4f",
  pickup: "#f3ead4",
  sale: "#c5d48a",
  miss: "#9a958c",
  ink: "#1a140e",
  uiText: "#efe6d4",
  stroke: "#1a140e",
} as const;

export const FONT = "Trebuchet MS, Segoe UI, sans-serif";

export function colorCss(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
