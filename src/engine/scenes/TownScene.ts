import { TOWN_MARKET } from "../../data/markets";
import { TOWN_MERCHANT } from "../../data/merchants";
import {
  TOWN_EXIT,
  TOWN_HEIGHT,
  TOWN_OBSTACLES,
  TOWN_SPAWN,
  TOWN_WALLS,
  TOWN_WIDTH,
} from "../../game/world/town";
import { drawTownWorld } from "../world/townArt";
import { SafeHubScene } from "./SafeHubScene";

export class TownScene extends SafeHubScene {
  constructor() {
    super("town", {
      hubId: "town",
      width: TOWN_WIDTH,
      height: TOWN_HEIGHT,
      spawn: TOWN_SPAWN,
      exit: TOWN_EXIT,
      walls: TOWN_WALLS,
      obstacles: TOWN_OBSTACLES,
      merchant: TOWN_MERCHANT,
      market: TOWN_MARKET,
      standStyle: "town",
      drawWorld: drawTownWorld,
      exitTitle: "SORTIE",
      exitPrompt: "E — PARTIR",
      hint: "ZQSD  ·  ESPACE dash  ·  E parler / partir",
    });
  }
}
