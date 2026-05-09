/** 种子商店 / 种植共用数据（购买价用于铲除返还计算） */

export interface SeedCatalogEntry {
  id: string;
  name: string;
  emoji: string;
  price: number;
  /** 展示用 */
  growTime: string;
  /** 实际生长毫秒（种植逻辑用） */
  growDurationMs: number;
  /** 成熟果实单颗基础售出价（涨价许可证在此基础上 +15%） */
  fruitPrice: number;
  /** 单次收获果实数量随机区间（闭区间）；默认 1 */
  harvestMin?: number;
  harvestMax?: number;
  /** 商店详情：简短定位，不写细规则 */
  description: string;
  /** 可选：一句氛围/小科普 */
  flavor?: string;
}

export const SEEDS: SeedCatalogEntry[] = [
  {
    id: "seed1",
    name: "番茄种子",
    emoji: "🍅",
    price: 30,
    growTime: "2小时",
    growDurationMs: 2 * 60 * 60 * 1000,
    fruitPrice: 39,
    harvestMin: 2,
    harvestMax: 4,
    description: "百搭蔬果，新手友好。",
    flavor: "红彤彤挂满枝头的时候，最有园艺成就感。",
  },
  {
    id: "seed2",
    name: "草莓种子",
    emoji: "🍓",
    price: 60,
    growTime: "3小时",
    growDurationMs: 3 * 60 * 60 * 1000,
    fruitPrice: 20,
    harvestMin: 15,
    harvestMax: 20,
    description: "人气浆果，收成常常很可观。",
    flavor: "成熟时香甜扑鼻，摆在温室里格外养眼。",
  },
  {
    id: "seed3",
    name: "西瓜种子",
    emoji: "🍉",
    price: 80,
    growTime: "4小时",
    growDurationMs: 4 * 60 * 60 * 1000,
    fruitPrice: 60,
    description: "大果压秤，适合有耐心的大回合。",
    flavor: "切开那一声脆响，夏天就来了。",
  },
  {
    id: "seed4",
    name: "葡萄种子",
    emoji: "🍇",
    price: 70,
    growTime: "3.5小时",
    growDurationMs: Math.round(3.5 * 60 * 60 * 1000),
    fruitPrice: 50,
    description: "成串采收，颜值很高。",
    flavor: "紫莹莹一串挂在架上，像迷你葡萄园。",
  },
  {
    id: "seed5",
    name: "柠檬种子",
    emoji: "🍋",
    price: 65,
    growTime: "3小时",
    growDurationMs: 3 * 60 * 60 * 1000,
    fruitPrice: 45,
    description: "清香提神，百搭作物。",
    flavor: "金黄果皮带着酸味香气，很治愈。",
  },
  {
    id: "seed6",
    name: "樱桃种子",
    emoji: "🍒",
    price: 75,
    growTime: "3.5小时",
    growDurationMs: Math.round(3.5 * 60 * 60 * 1000),
    fruitPrice: 55,
    description: "小果精致，适合收藏型园丁。",
    flavor: "红润剔透，像宝石贴在枝头。",
  },
];

/** 铲除生长中的植株时返还金币（种子购买价的一半，向下取整） */
export function shovelRefundForSeed(seedId: string): number {
  const price = SEEDS.find((s) => s.id === seedId)?.price ?? 0;
  return Math.floor(price / 2);
}

export function getGrowDurationMs(seedId: string): number {
  const ms = SEEDS.find((s) => s.id === seedId)?.growDurationMs;
  return typeof ms === "number" && ms > 0 ? ms : 2 * 60 * 60 * 1000;
}

export function getSeedEntry(seedId: string): SeedCatalogEntry | undefined {
  return SEEDS.find((s) => s.id === seedId);
}

/** 本次收获随机果实数量（未含手套翻倍与土壤倍率） */
export function rollBaseHarvestFruitCount(seedId: string): number {
  const s = getSeedEntry(seedId);
  const min = s?.harvestMin ?? 1;
  const max = s?.harvestMax ?? min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
