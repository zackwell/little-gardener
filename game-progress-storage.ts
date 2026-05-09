/** 游戏进度（金币、养成等），存 localStorage */

import type { PersistentSoilTier } from "./item-catalog";
import {
  ITEM_ADVANCED_SOIL,
  ITEM_AUTO_WATERING,
  ITEM_GARDEN_GLOVES,
  ITEM_SIMULATED_SUN,
  ITEM_SUPER_SOIL,
} from "./item-catalog";
import { getGrowDurationMs } from "./seed-catalog";

/** 四槽位土壤效果（空槽也可预先铺土） */
export type PersistentSlotSoil = [
  PersistentSoilTier | null,
  PersistentSoilTier | null,
  PersistentSoilTier | null,
  PersistentSoilTier | null,
];

/** 槽位内作物（按真实时间生长：plantedAt + growDurationMs） */
export interface GrowingPlantSlot {
  slotId: number;
  plantId: string;
  plantedAt: number;
  growDurationMs: number;
  /** 旧存档控温器等：单株生长倍率 */
  growthMult?: number;
  /** 肥料：本株已施肥次数（最多 3，与 item-catalog 一致） */
  fertilizerUses?: number;
  /** 旧存档：已废弃，读档时迁移为 fertilizerUses */
  fertilizerMult?: number;
  /** 旧存档：超级土壤标在植株上，读档后会迁移到 persistentSlotSoil */
  superSoil?: boolean;
}

export interface GameProgress {
  coins: number;
  unlockedSlots: number;
  growingPlants: Array<GrowingPlantSlot | null>;
  seedInventory: Record<string, number>;
  exhibitionPlants: string[];
  harvestedFruits: Record<string, number>;
  /** 收获藏品背包（defId → 数量） */
  collectibleBackpack: Record<string, number>;
  /** 展览区已上架的藏品实例（defId，可重复） */
  exhibitionCollectibles: string[];
  /** 果实展台：各作物果实数量 */
  exhibitionFruits: Record<string, number>;
  /** 仅消耗品：肥料、蓄水 */
  itemInventory: Record<string, number>;
  /** 模拟太阳：开启则全局加速，无时限，可关闭 */
  sunBoostActive: boolean;
  /** 浇水效果结束时间 */
  wateringBoostUntil: number | null;
  /** 浇水一轮结束后需蓄水才可再启动 */
  wateringNeedsRefill: boolean;
  ownsGardenGloves: boolean;
  ownsSimulatedSun: boolean;
  ownsAutoWatering: boolean;
  ownsAdvancedSoil: boolean;
  ownsSuperSoil: boolean;
  persistentSlotSoil: PersistentSlotSoil;
  /** 园艺手套：下一次收获果实数量翻倍 */
  pendingGloveDoubleNextHarvest: boolean;
}

const STORAGE_KEY = "little-gardener-progress-v1";

export const DEFAULT_GAME_PROGRESS: GameProgress = {
  coins: 500,
  unlockedSlots: 1,
  growingPlants: [null, null, null, null],
  seedInventory: {},
  exhibitionPlants: [],
  harvestedFruits: {},
  collectibleBackpack: {},
  exhibitionCollectibles: [],
  exhibitionFruits: {},
  itemInventory: {},
  sunBoostActive: false,
  wateringBoostUntil: null,
  wateringNeedsRefill: false,
  ownsGardenGloves: false,
  ownsSimulatedSun: false,
  ownsAutoWatering: false,
  ownsAdvancedSoil: false,
  ownsSuperSoil: false,
  persistentSlotSoil: [null, null, null, null],
  pendingGloveDoubleNextHarvest: false,
};

function clampInt(n: unknown, fallback: number, min: number, max: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function normalizeInventory(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  }
  return out;
}

function normalizePersistentSlotSoil(raw: unknown): PersistentSlotSoil {
  const base = [null, null, null, null] as PersistentSlotSoil;
  if (!Array.isArray(raw)) return base;
  for (let i = 0; i < 4; i++) {
    const v = raw[i];
    if (v === "advanced" || v === "super") base[i] = v;
  }
  return base;
}

function normalizeGrowingPlants(raw: unknown): GameProgress["growingPlants"] {
  const base: GameProgress["growingPlants"] = [null, null, null, null];
  if (!Array.isArray(raw)) return base;
  for (let i = 0; i < 4; i++) {
    const x = raw[i];
    if (x === null || x === undefined) {
      base[i] = null;
      continue;
    }
    if (typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.plantId !== "string") continue;

    const slotId = clampInt(o.slotId, i, 0, 3);
    const plantId = o.plantId;
    const catalogMs = getGrowDurationMs(plantId);

    let plantedAt: number;
    let growDurationMs: number;

    if (
      typeof o.plantedAt === "number" &&
      Number.isFinite(o.plantedAt) &&
      typeof o.growDurationMs === "number" &&
      Number.isFinite(o.growDurationMs) &&
      o.growDurationMs >= 1000
    ) {
      plantedAt = Math.round(o.plantedAt);
      growDurationMs = Math.min(Math.round(o.growDurationMs), 86400000 * 30);
    } else {
      const legacyProgress = clampInt(o.progress, 0, 0, 100);
      growDurationMs = catalogMs > 0 ? catalogMs : 2 * 60 * 60 * 1000;
      plantedAt = Date.now() - Math.round((legacyProgress / 100) * growDurationMs);
    }

    const slot: GrowingPlantSlot = { slotId, plantId, plantedAt, growDurationMs };

    if (typeof o.growthMult === "number" && Number.isFinite(o.growthMult) && o.growthMult > 1 && o.growthMult < 5) {
      slot.growthMult = o.growthMult;
    }
    let fertilizerUses = 0;
    if (typeof o.fertilizerUses === "number" && Number.isFinite(o.fertilizerUses)) {
      fertilizerUses = Math.min(3, Math.max(0, Math.floor(o.fertilizerUses)));
    }
    if (
      fertilizerUses === 0 &&
      typeof o.fertilizerMult === "number" &&
      Number.isFinite(o.fertilizerMult) &&
      o.fertilizerMult > 1
    ) {
      fertilizerUses = 1;
    }
    if (fertilizerUses > 0) slot.fertilizerUses = fertilizerUses;
    if (o.superSoil === true) slot.superSoil = true;

    base[i] = slot;
  }
  return base;
}

function migrateLegacyOwnership(inv: Record<string, number>, o: Record<string, unknown>): Partial<GameProgress> {
  const legacy = normalizeInventory(o.itemInventory);
  const out: Partial<GameProgress> = {};

  const gl = o.ownsGardenGloves === true || (legacy[ITEM_GARDEN_GLOVES] || 0) > 0;
  const sn = o.ownsSimulatedSun === true || (legacy[ITEM_SIMULATED_SUN] || 0) > 0;
  const aw = o.ownsAutoWatering === true || (legacy[ITEM_AUTO_WATERING] || 0) > 0;
  const ad = o.ownsAdvancedSoil === true || (legacy[ITEM_ADVANCED_SOIL] || 0) > 0;
  const su = o.ownsSuperSoil === true || (legacy[ITEM_SUPER_SOIL] || 0) > 0;

  if (gl) out.ownsGardenGloves = true;
  if (sn) out.ownsSimulatedSun = true;
  if (aw) out.ownsAutoWatering = true;
  if (ad) out.ownsAdvancedSoil = true;
  if (su) out.ownsSuperSoil = true;

  return out;
}

function parseProgress(raw: string | null): GameProgress | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return null;
    const o = j as Record<string, unknown>;

    let sunBoostActive = false;
    if (typeof o.sunBoostActive === "boolean") {
      sunBoostActive = o.sunBoostActive;
    } else if (
      typeof o.sunBoostUntil === "number" &&
      Number.isFinite(o.sunBoostUntil) &&
      o.sunBoostUntil > Date.now()
    ) {
      sunBoostActive = true;
    }

    let wateringBoostUntil: number | null = null;
    if (typeof o.wateringBoostUntil === "number" && Number.isFinite(o.wateringBoostUntil) && o.wateringBoostUntil > 0) {
      wateringBoostUntil = Math.round(o.wateringBoostUntil);
    }

    const legacyInv = normalizeInventory(o.itemInventory);
    const migratedOwns = migrateLegacyOwnership(legacyInv, o);

    /** 旧版永久道具堆叠 → 仅保留消耗品格子 */
    const cleanInv: Record<string, number> = { ...legacyInv };
    delete cleanInv[ITEM_GARDEN_GLOVES];
    delete cleanInv[ITEM_SIMULATED_SUN];
    delete cleanInv[ITEM_AUTO_WATERING];
    delete cleanInv[ITEM_ADVANCED_SOIL];
    delete cleanInv[ITEM_SUPER_SOIL];

    let wateringNeedsRefill = o.wateringNeedsRefill === true;
    if (
      typeof o.wateringBoostUntil === "number" &&
      Number.isFinite(o.wateringBoostUntil) &&
      Date.now() >= o.wateringBoostUntil &&
      o.ownsAutoWatering === true
    ) {
      wateringNeedsRefill = true;
    }

    const persistentSlotSoil = normalizePersistentSlotSoil(o.persistentSlotSoil);

    return {
      coins: clampInt(o.coins, DEFAULT_GAME_PROGRESS.coins, 0, 999999999),
      unlockedSlots: clampInt(o.unlockedSlots, DEFAULT_GAME_PROGRESS.unlockedSlots, 1, 4),
      growingPlants: normalizeGrowingPlants(o.growingPlants),
      seedInventory: normalizeInventory(o.seedInventory),
      exhibitionPlants: Array.isArray(o.exhibitionPlants)
        ? o.exhibitionPlants.filter((x): x is string => typeof x === "string")
        : [],
      harvestedFruits: normalizeInventory(o.harvestedFruits),
      collectibleBackpack: normalizeInventory(o.collectibleBackpack),
      exhibitionCollectibles: Array.isArray(o.exhibitionCollectibles)
        ? o.exhibitionCollectibles.filter((x): x is string => typeof x === "string")
        : [],
      exhibitionFruits: normalizeInventory(o.exhibitionFruits),
      itemInventory: cleanInv,
      sunBoostActive,
      wateringBoostUntil,
      wateringNeedsRefill,
      ownsGardenGloves: Boolean(migratedOwns.ownsGardenGloves || o.ownsGardenGloves === true),
      ownsSimulatedSun: Boolean(migratedOwns.ownsSimulatedSun || o.ownsSimulatedSun === true),
      ownsAutoWatering: Boolean(migratedOwns.ownsAutoWatering || o.ownsAutoWatering === true),
      ownsAdvancedSoil: Boolean(migratedOwns.ownsAdvancedSoil || o.ownsAdvancedSoil === true),
      ownsSuperSoil: Boolean(migratedOwns.ownsSuperSoil || o.ownsSuperSoil === true),
      persistentSlotSoil,
      pendingGloveDoubleNextHarvest:
        typeof o.pendingGloveDoubleNextHarvest === "boolean"
          ? o.pendingGloveDoubleNextHarvest
          : typeof o.pendingGloveHarvestBonus === "number" &&
              Number.isFinite(o.pendingGloveHarvestBonus) &&
              Math.floor(o.pendingGloveHarvestBonus) > 0,
    };
  } catch {
    return null;
  }
}

function applyPostLoadMigration(p: GameProgress): GameProgress {
  const soil = [...p.persistentSlotSoil] as PersistentSlotSoil;
  const growingPlants = p.growingPlants.map((plant, i) => {
    if (!plant?.superSoil) return plant;
    if (soil[i] == null) soil[i] = "super";
    const { superSoil: _s, ...rest } = plant;
    return { ...rest } as GrowingPlantSlot;
  });

  let wateringNeedsRefill = p.wateringNeedsRefill;
  let wateringBoostUntil = p.wateringBoostUntil;
  if (
    p.ownsAutoWatering &&
    wateringBoostUntil != null &&
    Date.now() >= wateringBoostUntil
  ) {
    wateringNeedsRefill = true;
    wateringBoostUntil = null;
  }

  return {
    ...p,
    growingPlants,
    persistentSlotSoil: soil,
    wateringNeedsRefill,
    wateringBoostUntil,
    ownsGardenGloves: p.ownsGardenGloves,
    ownsSimulatedSun: p.ownsSimulatedSun,
    ownsAutoWatering: p.ownsAutoWatering,
    ownsAdvancedSoil: p.ownsAdvancedSoil,
    ownsSuperSoil: p.ownsSuperSoil,
  };
}

export function loadGameProgress(): GameProgress {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_GAME_PROGRESS,
      growingPlants: [...DEFAULT_GAME_PROGRESS.growingPlants],
      seedInventory: { ...DEFAULT_GAME_PROGRESS.seedInventory },
      exhibitionPlants: [...DEFAULT_GAME_PROGRESS.exhibitionPlants],
      harvestedFruits: { ...DEFAULT_GAME_PROGRESS.harvestedFruits },
      collectibleBackpack: { ...DEFAULT_GAME_PROGRESS.collectibleBackpack },
      exhibitionCollectibles: [...DEFAULT_GAME_PROGRESS.exhibitionCollectibles],
      exhibitionFruits: { ...DEFAULT_GAME_PROGRESS.exhibitionFruits },
      itemInventory: { ...DEFAULT_GAME_PROGRESS.itemInventory },
      persistentSlotSoil: [...DEFAULT_GAME_PROGRESS.persistentSlotSoil] as PersistentSlotSoil,
    };
  }
  const parsed = parseProgress(localStorage.getItem(STORAGE_KEY));
  if (!parsed) {
    return {
      ...DEFAULT_GAME_PROGRESS,
      growingPlants: [...DEFAULT_GAME_PROGRESS.growingPlants],
      seedInventory: { ...DEFAULT_GAME_PROGRESS.seedInventory },
      exhibitionPlants: [...DEFAULT_GAME_PROGRESS.exhibitionPlants],
      harvestedFruits: { ...DEFAULT_GAME_PROGRESS.harvestedFruits },
      collectibleBackpack: { ...DEFAULT_GAME_PROGRESS.collectibleBackpack },
      exhibitionCollectibles: [...DEFAULT_GAME_PROGRESS.exhibitionCollectibles],
      exhibitionFruits: { ...DEFAULT_GAME_PROGRESS.exhibitionFruits },
      itemInventory: { ...DEFAULT_GAME_PROGRESS.itemInventory },
      persistentSlotSoil: [...DEFAULT_GAME_PROGRESS.persistentSlotSoil] as PersistentSlotSoil,
    };
  }
  const merged = {
    ...parsed,
    growingPlants: [...parsed.growingPlants],
    seedInventory: { ...parsed.seedInventory },
    exhibitionPlants: [...parsed.exhibitionPlants],
    harvestedFruits: { ...parsed.harvestedFruits },
    collectibleBackpack: { ...parsed.collectibleBackpack },
    exhibitionCollectibles: [...parsed.exhibitionCollectibles],
    exhibitionFruits: { ...parsed.exhibitionFruits },
    itemInventory: { ...parsed.itemInventory },
    persistentSlotSoil: [...parsed.persistentSlotSoil] as PersistentSlotSoil,
  };
  return applyPostLoadMigration(merged);
}

export function saveGameProgress(p: GameProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota */
  }
}
