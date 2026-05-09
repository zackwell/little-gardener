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

/** 模拟太阳：激活期间全局生长加速（现为开关模式，无时限） */
export const SUN_GROWTH_MULT = 1.35;

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
    description: "收成前戴好手套，下一茬摘得更尽兴。",
    kind: "permanent",
  },
  {
    id: ITEM_SIMULATED_SUN,
    name: "模拟太阳",
    emoji: "☀️",
    price: 800,
    description: "补足光照，需要时可以关上。",
    kind: "permanent",
  },
  {
    id: ITEM_AUTO_WATERING,
    name: "自动浇水器",
    emoji: "💧",
    price: 110,
    description: "自动喷淋一阵，用过记得补水。",
    kind: "permanent",
  },
  {
    id: ITEM_FERTILIZER,
    name: "肥料",
    emoji: "🧪",
    price: 35,
    description: "给正在长的植株追肥，别贪杯。",
    kind: "consumable",
  },
  {
    id: ITEM_THERMOSTAT,
    name: "控温器",
    emoji: "🌡️",
    price: 95,
    description: "盯住一株，让它长得更稳当。",
    kind: "consumable",
  },
  {
    id: ITEM_ADVANCED_SOIL,
    name: "高级土壤",
    emoji: "🪴",
    price: 500,
    description: "铺在槽里，土质更讲究一档。",
    kind: "permanent",
  },
  {
    id: ITEM_SUPER_SOIL,
    name: "超级土壤",
    emoji: "🌱",
    price: 700,
    description: "顶配土质，偶尔还有额外惊喜。",
    kind: "permanent",
  },
  {
    id: ITEM_WATER_REFILL,
    name: "蓄水",
    emoji: "🫙",
    price: 10,
    description: "把浇水壶灌满，又能开一轮。",
    kind: "consumable",
  },
];

export function getShopItem(id: string): ShopItemDef | undefined {
  return SHOP_ITEMS.find((x) => x.id === id);
}

export function getActiveSunGrowthMult(sunBoostActive: boolean): number {
  return sunBoostActive ? SUN_GROWTH_MULT : 1;
}

export function getActiveWateringGrowthMult(wateringBoostUntil: number | null, now = Date.now()): number {
  if (wateringBoostUntil == null || !Number.isFinite(wateringBoostUntil) || now >= wateringBoostUntil) return 1;
  return WATERING_GROWTH_MULT;
}

export function getCombinedGlobalGrowthMult(
  sunBoostActive: boolean,
  wateringBoostUntil: number | null,
  now = Date.now(),
): number {
  return getActiveSunGrowthMult(sunBoostActive) * getActiveWateringGrowthMult(wateringBoostUntil, now);
}

/** 模拟太阳：开启时返回提示文案 */
export function formatSunBoostStatus(sunBoostActive: boolean): string {
  return sunBoostActive ? "模拟太阳：开启中（全局生长加速）" : "";
}

export function formatWateringRemainShort(wateringBoostUntil: number | null, now = Date.now()): string {
  if (wateringBoostUntil == null || !Number.isFinite(wateringBoostUntil)) return "";
  const ms = wateringBoostUntil - now;
  if (ms <= 0) return "";
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `浇水加速剩余 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `浇水加速剩余 ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
