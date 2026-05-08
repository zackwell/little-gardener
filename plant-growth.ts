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

/** 生长中剩余时间简短文案 */
export function formatPlantRemainShort(plant: GrowingPlantSlot, opts?: GrowthComputeOpts): string {
  const duration =
    typeof plant.growDurationMs === "number" && plant.growDurationMs > 0
      ? plant.growDurationMs
      : getGrowDurationMs(plant.plantId);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || duration <= 0) return "";
  const factor = effectiveGrowthFactor(plant, opts);
  const remain = plantedAt + duration / factor - Date.now();
  if (remain <= 0) return "即将成熟";
  const sec = Math.ceil(remain / 1000);
  const m = Math.ceil(sec / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm > 0 ? `剩余约 ${h} 小时 ${mm} 分` : `剩余约 ${h} 小时`;
  }
  if (m <= 1) return "剩余不到 1 分钟";
  return `剩余约 ${m} 分钟`;
}
