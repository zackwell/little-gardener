/** 单局限时时长（秒） */
export const ROUND_SECONDS = 120;

/**
 * 过关金币：依据本局从开局到清盘所消耗的秒数（越少越快，金币越多）。
 * 公式可调：当前为 600 - 3×秒数，并设上下限。
 */
export function goldForSecondsUsed(secondsUsed: number): number {
  const u = Math.min(ROUND_SECONDS, Math.max(0, secondsUsed));
  return Math.max(30, Math.round(600 - u * 3));
}

/** 时间耗尽失败时固定赠送的安慰金币 */
export const DEFEAT_CONSOLATION_GOLD = 10;
