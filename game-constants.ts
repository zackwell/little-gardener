import { COLS, ROWS } from "./game-grid-gen";

/** 参照难度「困难」档的单局限时（秒），仅作文档 / 公式锚点 */
export const ROUND_SECONDS_HARD = 120;

const TOTAL_GRID_CELLS = ROWS * COLS;

/**
 * 过关金币：按「在本局限时内用掉的时间比例」计算效率；困难档满分与下限都高于简单，
 * 避免「限时越长基础金币越高」导致简单稳定碾压困难。
 */
export function goldForSecondsUsed(secondsUsed: number, roundSeconds: number): number {
  const u = Math.min(roundSeconds, Math.max(0, secondsUsed));
  const T = roundSeconds;
  const timeUsedRatio = T > 0 ? u / T : 0;
  const speedFactor = Math.pow(1 - timeUsedRatio, 1.2);

  let maxGold: number;
  if (T <= ROUND_SECONDS_HARD * 1.25) maxGold = 640;
  else if (T <= ROUND_SECONDS_HARD * 2.1) maxGold = 540;
  else maxGold = 480;

  const minGold = 40;
  const gold = minGold + (maxGold - minGold) * speedFactor;
  return Math.max(minGold, Math.round(gold));
}

/**
 * 失败安慰金币：剩余格子越少（进度越高）越多；`roundSeconds` 越短（难度越高）加成越高。
 */
export function defeatConsolationGold(cellsRemaining: number, roundSeconds: number): number {
  const total = TOTAL_GRID_CELLS;
  const rem = Math.max(0, Math.min(total, cellsRemaining));
  const clearedRatio = total > 0 ? (total - rem) / total : 0;

  const base = 8;
  const progressPart = Math.round(68 * clearedRatio);
  const difficultyMult = ROUND_SECONDS_HARD / roundSeconds;

  const gold = Math.round((base + progressPart) * difficultyMult);
  return Math.max(6, gold);
}
