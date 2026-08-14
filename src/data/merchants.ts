export type MerchantSpot = {
  id: string;
  name: string;
  x: number;
  y: number;
  talkRange: number;
};

export const TOWN_MERCHANT: MerchantSpot = {
  id: "town-merchant",
  name: "Marchand",
  x: 280,
  y: 280,
  talkRange: 58,
};

export const OUTPOST_MERCHANT: MerchantSpot = {
  id: "outpost-merchant",
  name: "Comptoir",
  x: 540,
  y: 300,
  talkRange: 58,
};
