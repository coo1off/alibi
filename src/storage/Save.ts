export type Settings = { sound: boolean; volume: number };

export type SaveData = {
  version: 1;
  bestScore: number;
  bestCombo: number;
  settings: Settings;
  seenHowto: boolean;
};

const KEY = "alibi.save.v1";

const DEFAULTS: SaveData = {
  version: 1,
  bestScore: 0,
  bestCombo: 0,
  settings: { sound: true, volume: 0.6 },
  seenHowto: false,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, settings: { ...DEFAULTS.settings } };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return { ...DEFAULTS, settings: { ...DEFAULTS.settings } };
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* приватный режим — просто не сохраняем */
  }
}
