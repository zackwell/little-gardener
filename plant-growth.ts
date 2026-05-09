import type { GrowingPlantSlot } from "./game-progress-storage";
import { FERTILIZER_GROWTH_MULT, FERTILIZER_MAX_USES_PER_PLANT } from "./item-catalog";
import { getGrowDurationMs } from "./seed-catalog";

export interface GrowthComputeOpts {
  /** 模拟太阳等：全局时间流逝倍率（>1 表示生长更快） */
  globalGrowthMult?: number;
}

function effectiveGrowthFactor(plant: GrowingPlantSlot, opts?: GrowthComputeOpts): number {
  const g = opts?.globalGrowthMult ?? 1;
  const legacyThermo = plant.growthMult ?? 1;
  const uses = Math.min(FERTILIZER_MAX_USES_PER_PLANT, plant.fertilizerUses ?? 0);
  const fert = uses > 0 ? Math.pow(FERTILIZER_GROWTH_MULT, uses) : 1;
  return Math.max(0.01, g * legacyThermo * fert);
}

/** 0–100，依据种下时间与生长总时长计算（全局加速与控温槽位叠乘） */
export function computePlantProgress(plant: GrowingPlantSlot, opts?: GrowthComputeOpts): number {
  const duration =
    typeof plant.growDurationMs === "number" && plant.growDurationMs > 0
      ? plant.growDurationMs
      : getGrowDurationMs(plant.plantId);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || plantedAt <= 0 || duration <= 0) return 0;
  const elapsed = Date.now() - plantedAt;
  const factor = effectiveGrowthFactor(plant, opts);
  const elapsedEff = elapsed * factor;
  return Math.min(100, Math.max(0, Math.floor((elapsedEff / duration) * 100)));
}

/** 生长中剩余真实时间（加速状态下倒计时走得更快），精确到秒 */
export function formatPlantRemainClock(plant: GrowingPlantSlot, opts?: GrowthComputeOpts, now = Date.now()): string {
  const duration =
    typeof plant.growDurationMs === "number" && plant.growDurationMs > 0
      ? plant.growDurationMs
      : getGrowDurationMs(plant.plantId);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || duration <= 0) return "";
  const factor = effectiveGrowthFactor(plant, opts);
  const remainMs = plantedAt + duration / factor - now;
  if (remainMs <= 0) return "即将成熟";
  const totalSec = Math.max(0, Math.ceil(remainMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `剩余 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `剩余 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** @deprecated 保留兼容；培育室请用 formatPlantRemainClock */
export function formatPlantRemainShort(plant: GrowingPlantSlot, opts?: GrowthComputeOpts): string {
  return formatPlantRemainClock(plant, opts);
}
