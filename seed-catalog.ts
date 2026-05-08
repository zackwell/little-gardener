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
  fruitPrice: number;
  description: string;
}

export const SEEDS: SeedCatalogEntry[] = [
  {
    id: "seed1",
    name: "番茄种子",
    emoji: "🍅",
    price: 50,
    growTime: "2小时",
    growDurationMs: 2 * 60 * 60 * 1000,
    fruitPrice: 30,
    description: "经典蔬果，生长稳健、收成可观，适合刚打理花园的新手。果实酸甜多汁，料理百搭。",
  },
  {
    id: "seed2",
    name: "草莓种子",
    emoji: "🍓",
    price: 60,
    growTime: "3小时",
    growDurationMs: 3 * 60 * 60 * 1000,
    fruitPrice: 40,
    description: "矮株易照料，成熟时散发淡淡甜香。适合摆在日照充足的槽位，耐心等待红润果实。",
  },
  {
    id: "seed3",
    name: "西瓜种子",
    emoji: "🍉",
    price: 80,
    growTime: "4小时",
    growDurationMs: 4 * 60 * 60 * 1000,
    fruitPrice: 60,
    description: "生长周期较长，但一颗大果足以回本。需要较多日照与水分，收获时成就感满满。",
  },
  {
    id: "seed4",
    name: "葡萄种子",
    emoji: "🍇",
    price: 70,
    growTime: "3.5小时",
    growDurationMs: Math.round(3.5 * 60 * 60 * 1000),
    fruitPrice: 50,
    description: "成串果实适合收集与出售，藤蔓型作物，成熟时紫莹莹颇为养眼。",
  },
  {
    id: "seed5",
    name: "柠檬种子",
    emoji: "🍋",
    price: 65,
    growTime: "3小时",
    growDurationMs: 3 * 60 * 60 * 1000,
    fruitPrice: 45,
    description: "清香醒神，果实适合加工或出售。对环境适应力强，是稳妥的经济作物之一。",
  },
  {
    id: "seed6",
    name: "樱桃种子",
    emoji: "🍒",
    price: 75,
    growTime: "3.5小时",
    growDurationMs: Math.round(3.5 * 60 * 60 * 1000),
    fruitPrice: 55,
    description: "高品质小果，市价可观。生长略挑照料，但红润剔透的收成值得等待。",
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
