export const HUB_IDS = ["town", "outpost"] as const;

export type HubId = (typeof HUB_IDS)[number];

export const HUB_SCENE_KEY: Record<HubId, string> = {
  town: "town",
  outpost: "outpost",
};

export function isHubId(value: unknown): value is HubId {
  return value === "town" || value === "outpost";
}

export function sceneKeyForHub(hubId: HubId): string {
  return HUB_SCENE_KEY[hubId];
}
