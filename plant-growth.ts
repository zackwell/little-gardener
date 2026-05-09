import type { GrowingPlantSlot } from "./game-progress-storage";
import {
  FERTILIZER_DIRECT_DURATION_RATIO,
  FERTILIZER_GROWTH_MULT,
  FERTILIZER_MAX_USES_PER_PLANT,
} from "./item-catalog";
import { getGrowDurationMs } from "./seed-catalog";

export interface GrowthComputeOpts {
  /** 模拟太阳 + 自动浇水：全局时间流逝倍率（>1 表示生长更快）；肥料不走此项 */
  globalGrowthMult?: number;
}

export function getPlantDuration(plant: GrowingPlantSlot): number {
  const duration =
    typeof plant.growDurationMs === "number" && plant.growDurationMs > 0
      ? plant.growDurationMs
      : getGrowDurationMs(plant.plantId);
  return duration > 0 ? duration : getGrowDurationMs(plant.plantId);
}

/** 日照、浇水、控温：乘在 wall-clock 上的加速倍率（不含肥料） */
export function accelerationOmega(plant: GrowingPlantSlot, opts?: GrowthComputeOpts): number {
  const g = opts?.globalGrowthMult ?? 1;
  const thermo = plant.growthMult ?? 1;
  return Math.max(0.01, g * thermo);
}

/** 旧版（肥料叠乘进 omega）— 仅用于读档迁移 */
function legacyTotalProgressPercent(plant: GrowingPlantSlot, opts: GrowthComputeOpts, now: number): number {
  const duration = getPlantDuration(plant);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || plantedAt <= 0 || duration <= 0) return 0;
  const elapsed = now - plantedAt;
  const g = opts.globalGrowthMult ?? 1;
  const thermo = plant.growthMult ?? 1;
  const uses = Math.min(FERTILIZER_MAX_USES_PER_PLANT, plant.fertilizerUses ?? 0);
  const fertPow = uses > 0 ? Math.pow(FERTILIZER_GROWTH_MULT, uses) : 1;
  const factor = Math.max(0.01, g * thermo * fertPow);
  const elapsedEff = elapsed * factor;
  return Math.min(100, Math.max(0, Math.floor((elapsedEff / duration) * 100)));
}

/**
 * 读档一次：把旧算法进度拆成「加速段 + 肥料直加段」，避免后续开关日照时进度回退。
 */
export function migrateLegacyPlantGrowthFields(
  plant: GrowingPlantSlot,
  opts: GrowthComputeOpts,
  now = Date.now(),
): GrowingPlantSlot {
  if (plant.growthModelVersion === 2) {
    return plant;
  }

  const duration = getPlantDuration(plant);
  if (duration <= 0) return plant;

  const pct = legacyTotalProgressPercent(plant, opts, now);
  const totalEff = (pct / 100) * duration;
  const uses = Math.min(FERTILIZER_MAX_USES_PER_PLANT, plant.fertilizerUses ?? 0);
  const fertTarget = Math.min(duration, uses * duration * FERTILIZER_DIRECT_DURATION_RATIO);

  let fertilizerBonusMs = fertTarget;
  let growthAccelMs = totalEff - fertilizerBonusMs;

  if (growthAccelMs < 0) {
    fertilizerBonusMs = Math.min(duration, totalEff);
    growthAccelMs = 0;
  }

  growthAccelMs = Math.min(Math.max(0, duration - fertilizerBonusMs), growthAccelMs);

  return {
    ...plant,
    growthAccelMs,
    growthAccelAnchorAt: now,
    fertilizerBonusMs,
    growthModelVersion: 2,
  };
}

/**
 * 在全局加速倍率或单株控温即将变化前调用：把当前锚点以来的加速进度写入 growthAccelMs。
 */
export function flushPlantGrowthAccel(
  plant: GrowingPlantSlot,
  opts: GrowthComputeOpts,
  now: number,
): GrowingPlantSlot {
  const duration = getPlantDuration(plant);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || plantedAt <= 0 || duration <= 0) return plant;

  const omega = accelerationOmega(plant, opts);
  const fertBonus = Math.min(duration, Math.max(0, plant.fertilizerBonusMs ?? 0));
  const anchor = plant.growthAccelAnchorAt ?? plantedAt;
  const dt = Math.max(0, now - anchor);
  const baseAccel = Math.min(duration - fertBonus, Math.max(0, plant.growthAccelMs ?? 0));
  const newAccel = Math.min(duration - fertBonus, baseAccel + dt * omega);

  return {
    ...plant,
    growthAccelMs: newAccel,
    growthAccelAnchorAt: now,
  };
}

export function mapFlushAllGrowingPlants(
  plants: Array<GrowingPlantSlot | null>,
  opts: GrowthComputeOpts,
  now: number,
): Array<GrowingPlantSlot | null> {
  return plants.map((p) => (p ? flushPlantGrowthAccel(p, opts, now) : null));
}

/** 0–100：肥料为直接推进；日照/浇水/控温为对 wall-clock 积分加速，关闭日照不会回退 */
export function computePlantProgress(plant: GrowingPlantSlot, opts?: GrowthComputeOpts, now = Date.now()): number {
  const duration = getPlantDuration(plant);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || plantedAt <= 0 || duration <= 0) return 0;

  const fertBonus = Math.min(duration, Math.max(0, plant.fertilizerBonusMs ?? 0));
  const anchor = plant.growthAccelAnchorAt ?? plantedAt;
  const baseAccel = Math.min(duration - fertBonus, Math.max(0, plant.growthAccelMs ?? 0));
  const omega = accelerationOmega(plant, opts);
  const dt = Math.max(0, now - anchor);
  const accelLive = Math.min(duration - fertBonus, baseAccel + dt * omega);
  const totalEff = Math.min(duration, accelLive + fertBonus);
  return Math.min(100, Math.max(0, Math.floor((totalEff / duration) * 100)));
}

/** 生长中剩余「有效生长量」，按当前加速倍率换算成大致 wall-clock 倒计时 */
export function formatPlantRemainClock(plant: GrowingPlantSlot, opts?: GrowthComputeOpts, now = Date.now()): string {
  const duration = getPlantDuration(plant);
  const plantedAt = plant.plantedAt;
  if (!Number.isFinite(plantedAt) || duration <= 0) return "";

  const fertBonus = Math.min(duration, Math.max(0, plant.fertilizerBonusMs ?? 0));
  const anchor = plant.growthAccelAnchorAt ?? plantedAt;
  const baseAccel = Math.min(duration - fertBonus, Math.max(0, plant.growthAccelMs ?? 0));
  const omega = accelerationOmega(plant, opts);
  const dt = Math.max(0, now - anchor);
  const accelLive = Math.min(duration - fertBonus, baseAccel + dt * omega);
  const totalEff = Math.min(duration, accelLive + fertBonus);
  const remainEff = duration - totalEff;
  if (remainEff <= 0) return "即将成熟";

  const omegaNow = accelerationOmega(plant, opts);
  const remainMs = remainEff / omegaNow;
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
