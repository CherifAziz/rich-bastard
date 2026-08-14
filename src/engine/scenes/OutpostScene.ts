import { OUTPOST_MARKET } from "../../data/markets";
import { OUTPOST_MERCHANT } from "../../data/merchants";
import {
  OUTPOST_EXIT,
  OUTPOST_HEIGHT,
  OUTPOST_OBSTACLES,
  OUTPOST_SPAWN,
  OUTPOST_WALLS,
  OUTPOST_WIDTH,
} from "../../game/world/outpost";
import { drawOutpostWorld } from "../world/outpostArt";
import { SafeHubScene } from "./SafeHubScene";

export class OutpostScene extends SafeHubScene {
  constructor() {
    super("outpost", {
      hubId: "outpost",
      width: OUTPOST_WIDTH,
      height: OUTPOST_HEIGHT,
      spawn: OUTPOST_SPAWN,
      exit: OUTPOST_EXIT,
      walls: OUTPOST_WALLS,
      obstacles: OUTPOST_OBSTACLES,
      merchant: OUTPOST_MERCHANT,
      market: OUTPOST_MARKET,
      standStyle: "outpost",
      drawWorld: drawOutpostWorld,
      exitTitle: "SORTIE",
      exitPrompt: "E — PARTIR",
      hint: "ZQSD  ·  ESPACE dash  ·  E parler / partir",
    });
  }
}
