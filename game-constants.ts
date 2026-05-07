/** 参照难度「困难」档的单局限时（秒），仅作文档 / 公式锚点 */
export const ROUND_SECONDS_HARD = 120;

/**
 * 过关金币：依据本局用时与本局限时时长；不同时长的关卡按 `roundSeconds` 缩放基础奖励。
 */
export function goldForSecondsUsed(secondsUsed: number, roundSeconds: number): number {
  const u = Math.min(roundSeconds, Math.max(0, secondsUsed));
  const scale = roundSeconds / ROUND_SECONDS_HARD;
  return Math.max(30, Math.round(600 * scale - u * 3));
}

/** 时间耗尽失败时固定赠送的安慰金币 */
export const DEFEAT_CONSOLATION_GOLD = 10;
