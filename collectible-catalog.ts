/**
 * 收获藏品：普通徽章、稀有涨价许可、史诗/传奇（按作物配置）
 * 果实售出价加成：持有对应作物的「涨价许可证」时 ×1.15（背包 + 展品均计入）
 */

import type { PersistentSoilTier } from "./item-catalog";
import tomatoBadgeUrl from "./pics/tomato/番茄徽章.png?format=webp&quality=85";
import tomatoLicenseUrl from "./pics/tomato/番茄涨价许可.png?format=webp&quality=85";
import tomatoEpicUrl from "./pics/tomato/番茄史诗藏品麦当当套餐.png?format=webp&quality=82";
import strawberryBadgeUrl from "./pics/strawberry/藏品普通徽章.png?format=webp&quality=85";
import strawberryLicenseUrl from "./pics/strawberry/藏品稀有涨价许可.png?format=webp&quality=85";
import strawberryEpicUrl from "./pics/strawberry/藏品史诗.png?format=webp&quality=82";
import strawberryLegendaryUrl from "./pics/strawberry/藏品传说.png?format=webp&quality=82";

export type CollectibleQuality = "normal" | "rare" | "epic" | "legendary";

export type CollectibleKind = "badge" | "price_license" | "epic_collectible" | "legendary_collectible";

export type CollectibleDef = {
  id: string;
  seedId: string;
  quality: CollectibleQuality;
  kind: CollectibleKind;
  name: string;
  description: string;
  image: string;
};

/** 直接售出藏品的价格（按品质） */
export const COLLECTIBLE_SELL_PRICE: Record<CollectibleQuality, number> = {
  normal: 20,
  rare: 50,
  epic: 500,
  legendary: 1000,
};

/** 持有涨价许可证时，该作物果实售出单价倍率 */
export const FRUIT_PRICE_LICENSE_MULT = 1.15;

/** 展览区最多陈列藏品数量 */
export const MAX_EXHIBITION_COLLECTIBLES = 16;

/** 果实展台最多陈列的果实总个数 */
export const MAX_EXHIBITION_FRUIT_UNITS = 16;

export const COLLECTIBLE_DEFS: Record<string, CollectibleDef> = {
  collect_tomato_badge: {
    id: "collect_tomato_badge",
    seedId: "seed1",
    quality: "normal",
    kind: "badge",
    name: "番茄徽章",
    description: "一枚迷你番茄主题的纪念小徽章。",
    image: tomatoBadgeUrl,
  },
  collect_tomato_license: {
    id: "collect_tomato_license",
    seedId: "seed1",
    quality: "rare",
    kind: "price_license",
    name: "番茄涨价许可证",
    description: "持证卖番茄，市价会更漂亮一点。",
    image: tomatoLicenseUrl,
  },
  collect_tomato_epic_mcd: {
    id: "collect_tomato_epic_mcd",
    seedId: "seed1",
    quality: "epic",
    kind: "epic_collectible",
    name: "麦当当套餐（番茄史诗藏品）",
    description: "番茄主题的限量联名周边，收藏价值满满。",
    image: tomatoEpicUrl,
  },
  collect_strawberry_badge: {
    id: "collect_strawberry_badge",
    seedId: "seed2",
    quality: "normal",
    kind: "badge",
    name: "草莓徽章",
    description: "酸甜可爱的草莓小徽章，适合别在背包上。",
    image: strawberryBadgeUrl,
  },
  collect_strawberry_license: {
    id: "collect_strawberry_license",
    seedId: "seed2",
    quality: "rare",
    kind: "price_license",
    name: "草莓涨价许可证",
    description: "草莓卖得更值钱的一点小特权。",
    image: strawberryLicenseUrl,
  },
  collect_strawberry_epic: {
    id: "collect_strawberry_epic",
    seedId: "seed2",
    quality: "epic",
    kind: "epic_collectible",
    name: "草莓史诗藏品",
    description: "草莓主题的精装纪念品，细节很耐看。",
    image: strawberryEpicUrl,
  },
  collect_strawberry_legendary: {
    id: "collect_strawberry_legendary",
    seedId: "seed2",
    quality: "legendary",
    kind: "legendary_collectible",
    name: "草莓传说藏品",
    description: "传说中只有少数园丁见过的草莓至宝。",
    image: strawberryLegendaryUrl,
  },
};

type QualityBuckets = Partial<Record<CollectibleQuality, string[]>>;

type SeedHarvestCollectiblePool = {
  /** 各品质对应的藏品 id（空数组表示该品质对本作物不可用） */
  byQuality: QualityBuckets;
};

/** 基础掉落权重：普通 50%、稀有 30%、史诗 15%、传奇 5%（无传奇池时会并入史诗） */
const BASE_WEIGHT: Record<CollectibleQuality, number> = {
  normal: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
};

function poolHasLegendary(pool: SeedHarvestCollectiblePool): boolean {
  return (pool.byQuality.legendary?.length ?? 0) > 0;
}

function adjustWeightsForSoil(
  w: Record<CollectibleQuality, number>,
  soilTier: PersistentSoilTier | null,
  hasLegendary: boolean,
): Record<CollectibleQuality, number> {
  const out = { ...w };
  if (soilTier === "advanced") {
    out.epic += 8;
    if (hasLegendary) out.legendary += 3;
    else out.epic += 3;
  } else if (soilTier === "super") {
    out.epic += 15;
    if (hasLegendary) out.legendary += 7;
    else out.epic += 7;
  }
  return out;
}

function normalizeWithoutLegendaryIfEmpty(
  w: Record<CollectibleQuality, number>,
  pool: SeedHarvestCollectiblePool,
): Record<CollectibleQuality, number> {
  const out = { ...w };
  if (!poolHasLegendary(pool)) {
    out.epic += out.legendary;
    out.legendary = 0;
  }
  return out;
}

function pickQuality(weights: Record<CollectibleQuality, number>): CollectibleQuality {
  const entries = (["normal", "rare", "epic", "legendary"] as const).filter((q) => weights[q] > 0);
  const sum = entries.reduce((s, q) => s + weights[q], 0);
  let r = Math.random() * sum;
  for (const q of entries) {
    r -= weights[q];
    if (r <= 0) return q;
  }
  return entries[entries.length - 1] ?? "normal";
}

function pickDefFromPool(pool: SeedHarvestCollectiblePool, quality: CollectibleQuality): string | null {
  const ids = pool.byQuality[quality];
  if (!ids?.length) return null;
  return ids[Math.floor(Math.random() * ids.length)]!;
}

function pickWithFallback(pool: SeedHarvestCollectiblePool, quality: CollectibleQuality): string | null {
  const order: CollectibleQuality[] = [quality, "epic", "rare", "normal", "legendary"];
  const seen = new Set<CollectibleQuality>();
  for (const q of order) {
    if (seen.has(q)) continue;
    seen.add(q);
    const id = pickDefFromPool(pool, q);
    if (id) return id;
  }
  return null;
}

const HARVEST_COLLECTIBLE_POOLS: Partial<Record<string, SeedHarvestCollectiblePool>> = {
  seed1: {
    byQuality: {
      normal: ["collect_tomato_badge"],
      rare: ["collect_tomato_license"],
      epic: ["collect_tomato_epic_mcd"],
      legendary: [],
    },
  },
  seed2: {
    byQuality: {
      normal: ["collect_strawberry_badge"],
      rare: ["collect_strawberry_license"],
      epic: ["collect_strawberry_epic"],
      legendary: ["collect_strawberry_legendary"],
    },
  },
};

/** 本次收获随机一枚藏品 id；无配置的种子返回 null */
export function rollHarvestCollectibleDefId(
  seedId: string,
  soilTier: PersistentSoilTier | null,
): string | null {
  const pool = HARVEST_COLLECTIBLE_POOLS[seedId];
  if (!pool) return null;

  let w = { ...BASE_WEIGHT };
  w = normalizeWithoutLegendaryIfEmpty(w, pool);
  w = adjustWeightsForSoil(w, soilTier, poolHasLegendary(pool));
  w = normalizeWithoutLegendaryIfEmpty(w, pool);

  const quality = pickQuality(w);
  return pickWithFallback(pool, quality);
}

export function getCollectibleDef(id: string): CollectibleDef | undefined {
  return COLLECTIBLE_DEFS[id];
}

export function sellPriceForCollectibleDefId(defId: string): number {
  const def = COLLECTIBLE_DEFS[defId];
  if (!def) return 0;
  return COLLECTIBLE_SELL_PRICE[def.quality] ?? 0;
}

export function countOwnedCollectible(
  defId: string,
  backpack: Record<string, number>,
  exhibition: string[],
): number {
  return (backpack[defId] || 0) + exhibition.filter((x) => x === defId).length;
}

/** 是否持有指定作物的涨价许可证（背包或展品） */
export function hasPriceLicenseForSeed(
  seedId: string,
  backpack: Record<string, number>,
  exhibition: string[],
): boolean {
  for (const def of Object.values(COLLECTIBLE_DEFS)) {
    if (def.kind !== "price_license" || def.seedId !== seedId) continue;
    if (countOwnedCollectible(def.id, backpack, exhibition) > 0) return true;
  }
  return false;
}

/** 计算果实单颗售出价（已含涨价许可加成） */
export function fruitSellUnitPrice(
  seedId: string,
  baseFruitPrice: number,
  backpack: Record<string, number>,
  exhibition: string[],
): number {
  if (hasPriceLicenseForSeed(seedId, backpack, exhibition)) {
    return Math.round(baseFruitPrice * FRUIT_PRICE_LICENSE_MULT);
  }
  return baseFruitPrice;
}

export function qualityLabel(q: CollectibleQuality): string {
  switch (q) {
    case "normal":
      return "普通";
    case "rare":
      return "稀有";
    case "epic":
      return "史诗";
    case "legendary":
      return "传奇";
    default:
      return q;
  }
}
