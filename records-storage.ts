/** 通关一条记录（按用时参与排行，数值越小越好） */
export interface VictoryRecord {
  secondsUsed: number;
  roundSeconds: number;
  score: number;
  /** ISO 时间 */
  at: string;
}

const STORAGE_KEY = "little-gardener-victory-records-v1";
const TOP_N = 5;

function safeParse(raw: string | null): VictoryRecord[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is VictoryRecord =>
        x &&
        typeof x === "object" &&
        typeof (x as VictoryRecord).secondsUsed === "number" &&
        typeof (x as VictoryRecord).roundSeconds === "number" &&
        typeof (x as VictoryRecord).score === "number" &&
        typeof (x as VictoryRecord).at === "string",
    );
  } catch {
    return [];
  }
}

/** 读取当前保存的前五佳（已按用时升序） */
export function getBestVictoryRecords(): VictoryRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

/**
 * 写入一次通关；与已有记录合并后按「用时」排序，只保留最快的 {@link TOP_N} 条。
 */
export function addVictoryRecord(entry: Omit<VictoryRecord, "at">): VictoryRecord[] {
  if (typeof window === "undefined") return [];
  const row: VictoryRecord = {
    ...entry,
    at: new Date().toISOString(),
  };
  const merged = [...safeParse(localStorage.getItem(STORAGE_KEY)), row];
  merged.sort((a, b) => a.secondsUsed - b.secondsUsed);
  const next = merged.slice(0, TOP_N);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function formatSecondsUsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r} 秒`;
  return `${m} 分 ${r} 秒`;
}
