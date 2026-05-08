/** 培育道具：永久解锁 + 消耗品 */

/** ——— 永久解锁（一次购买，可持续使用）——— */
export const ITEM_GARDEN_GLOVES = "item_garden_gloves";
export const ITEM_SIMULATED_SUN = "item_simulated_sun";
export const ITEM_AUTO_WATERING = "item_auto_watering";
export const ITEM_ADVANCED_SOIL = "item_advanced_soil";
export const ITEM_SUPER_SOIL = "item_super_soil";

/** ——— 消耗品 ——— */
/** 肥料：指定槽位当前作物加速生长 */
export const ITEM_FERTILIZER = "item_fertilizer";
/** 控温器：指定一株作物加速生长（全场同时仅一株生效） */
export const ITEM_THERMOSTAT = "item_thermostat";
/** 蓄水：自动浇水效果结束后，购买后恢复可再次启动 */
export const ITEM_WATER_REFILL = "item_water_refill";

/** 模拟太阳：激活期间全局生长加速 */
export const SUN_GROWTH_MULT = 1.35;
export const SUN_BOOST_DURATION_MS = 45 * 60 * 1000;

/** 自动浇水器：激活期间全局生长加速（可与日照叠乘） */
export const WATERING_GROWTH_MULT = 1.18;
export const WATERING_BOOST_DURATION_MS = 10 * 60 * 1000;

/** 肥料：单株每次叠乘；同一植株最多使用次数 */
export const FERTILIZER_GROWTH_MULT = 1.3;
export const FERTILIZER_MAX_USES_PER_PLANT = 3;

/** 收获倍率：槽位土壤（高级 < 超级） */
export const ADVANCED_SOIL_HARVEST_MULT = 1.5;
export const SUPER_SOIL_HARVEST_MULT = 2;

/** 控温器：单槽生长加速（与日照、浇水、肥料叠乘） */
export const THERMOSTAT_GROWTH_MULT = 1.55;

export type PersistentSoilTier = "advanced" | "super";

export type ShopItemKind = "permanent" | "consumable";

export type ShopItemDef = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  kind: ShopItemKind;
};

/** 商店列表顺序：每行 3 个 */
export const SHOP_ITEMS: ShopItemDef[] = [
  {
    id: ITEM_GARDEN_GLOVES,
    name: "园艺手套",
    emoji: "🧤",
    price: 300,
    description: "一次购买永久可用：叠加「下次收获」额外果实（可多次叠加）",
    kind: "permanent",
  },
  {
    id: ITEM_SIMULATED_SUN,
    name: "模拟太阳",
    emoji: "☀️",
    price: 800,
    description: "一次购买永久可用：随时激活，一段时间内全局加速生长",
    kind: "permanent",
  },
  {
    id: ITEM_AUTO_WATERING,
    name: "自动浇水器",
    emoji: "💧",
    price: 110,
    description: "一次购买永久可用：启动后 10 分钟全局加速；结束后需蓄水才可再开",
    kind: "permanent",
  },
  {
    id: ITEM_FERTILIZER,
    name: "肥料",
    emoji: "🧪",
    price: 35,
    description:
      "消耗品：对当前生长中的作物施肥，每次约加快 30% 生长（倍率叠乘）。同一株作物最多可施肥 3 次。",
    kind: "consumable",
  },
  {
    id: ITEM_THERMOSTAT,
    name: "控温器",
    emoji: "🌡️",
    price: 95,
    description:
      "消耗品：指定一株「生长中」的作物，显著提高其生长速度。同一时间全场只有一株作物可享受控温加成；对新植株使用时会转移到新植株上。",
    kind: "consumable",
  },
  {
    id: ITEM_ADVANCED_SOIL,
    name: "高级土壤",
    emoji: "🪴",
    price: 500,
    description: "一次购买永久可用：铺在槽位后该槽长期生效，收获品质提升（弱于超级土壤）",
    kind: "permanent",
  },
  {
    id: ITEM_SUPER_SOIL,
    name: "超级土壤",
    emoji: "🌱",
    price: 700,
    description: "一次购买永久可用：铺在槽位后该槽长期生效，收获品质大幅提升",
    kind: "permanent",
  },
  {
    id: ITEM_WATER_REFILL,
    name: "蓄水",
    emoji: "🫙",
    price: 10,
    description: "消耗品：为浇水器补水，结束后可再次启动浇水",
    kind: "consumable",
  },
];

export function getShopItem(id: string): ShopItemDef | undefined {
  return SHOP_ITEMS.find((x) => x.id === id);
}

export function getActiveSunGrowthMult(sunBoostUntil: number | null, now = Date.now()): number {
  if (sunBoostUntil == null || !Number.isFinite(sunBoostUntil) || now >= sunBoostUntil) return 1;
  return SUN_GROWTH_MULT;
}

export function getActiveWateringGrowthMult(wateringBoostUntil: number | null, now = Date.now()): number {
  if (wateringBoostUntil == null || !Number.isFinite(wateringBoostUntil) || now >= wateringBoostUntil) return 1;
  return WATERING_GROWTH_MULT;
}

export function getCombinedGlobalGrowthMult(
  sunBoostUntil: number | null,
  wateringBoostUntil: number | null,
  now = Date.now(),
): number {
  return getActiveSunGrowthMult(sunBoostUntil, now) * getActiveWateringGrowthMult(wateringBoostUntil, now);
}

export function formatSunBoostRemainShort(sunBoostUntil: number | null, now = Date.now()): string {
  if (sunBoostUntil == null || !Number.isFinite(sunBoostUntil)) return "";
  const ms = sunBoostUntil - now;
  if (ms <= 0) return "";
  const sec = Math.ceil(ms / 1000);
  const m = Math.ceil(sec / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm > 0 ? `日照剩余 ${h} 小时 ${mm} 分` : `日照剩余 ${h} 小时`;
  }
  if (m <= 1) return "日照剩余不到 1 分钟";
  return `日照剩余约 ${m} 分钟`;
}

export function formatWateringRemainShort(wateringBoostUntil: number | null, now = Date.now()): string {
  if (wateringBoostUntil == null || !Number.isFinite(wateringBoostUntil)) return "";
  const ms = wateringBoostUntil - now;
  if (ms <= 0) return "";
  const sec = Math.ceil(ms / 1000);
  const m = Math.ceil(sec / 60);
  if (m <= 60) {
    if (m <= 1) return "浇水效果剩余不到 1 分钟";
    return `浇水效果剩余约 ${m} 分钟`;
  }
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `浇水剩余 ${h} 小时 ${mm} 分` : `浇水剩余 ${h} 小时`;
}
