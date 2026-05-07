export type Difficulty = "easy" | "normal" | "hard";

export interface GameSettings {
  difficulty: Difficulty;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  /** 主音量 0–1 */
  volume: number;
}

const STORAGE_KEY = "little-gardener-settings-v1";

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "hard",
  /** 暂无正式 BGM 文件时默认关闭；接入音频后可改为 true */
  musicEnabled: false,
  sfxEnabled: true,
  volume: 0.75,
};

/** 根据本局限时秒数显示难度文案（需与 roundSecondsForDifficulty 一致） */
export function labelForRoundLimit(roundSeconds: number): string {
  switch (roundSeconds) {
    case 360:
      return "简单";
    case 240:
      return "一般";
    case 120:
      return "困难";
    default:
      return `${Math.round(roundSeconds / 60)} 分钟`;
  }
}

export function roundSecondsForDifficulty(d: Difficulty): number {
  switch (d) {
    case "easy":
      return 360;
    case "normal":
      return 240;
    case "hard":
      return 120;
    default:
      return 120;
  }
}

export function loadSettings(): GameSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_SETTINGS.volume,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: GameSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
