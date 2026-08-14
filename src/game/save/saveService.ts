import type { PlayerState } from "../player/player";
import {
  SAVE_KEY,
  parseSaveData,
  saveDataFromPlayer,
  type SaveDataV1,
} from "./saveData";

export function loadSave(): SaveDataV1 | null {
  const raw = readRawSave();
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warnInvalidSave("JSON invalide");
    return null;
  }

  const result = parseSaveData(parsed);
  if (!result.ok) {
    warnInvalidSave(result.reason);
    return null;
  }

  return result.data;
}

export function saveGame(data: SaveDataV1): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    warnInvalidSave("écriture localStorage impossible");
  }
}

export function persistPlayerProgress(player: PlayerState): void {
  saveGame(saveDataFromPlayer(player));
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    warnInvalidSave("suppression localStorage impossible");
  }
}

function readRawSave(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    warnInvalidSave("lecture localStorage impossible");
    return null;
  }
}

function warnInvalidSave(reason: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[Rich Bastard] Sauvegarde ignorée : ${reason}`);
  }
}
