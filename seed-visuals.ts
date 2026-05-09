/**
 * 培育界面：部分作物使用自定义贴图（幼苗等）
 */

import tomatoSeedUrl from "./pics/tomato/番茄种子.png?format=webp&quality=85";
import tomatoSproutUrl from "./pics/tomato/番茄芽.png?format=webp&quality=85";
import strawberrySeedUrl from "./pics/strawberry/种子.png?format=webp&quality=85";
import strawberryGrowingUrl from "./pics/strawberry/种植.png?format=webp&quality=85";

export type PlantGrowthVisual =
  | { type: "emoji"; emoji: string }
  | { type: "image"; src: string; alt: string };

/** 生长进度：培育室从幼苗贴图开始；成熟用 emoji */
export function getPlantGrowthVisual(seedId: string, progressPct: number, matureEmoji: string): PlantGrowthVisual {
  if (seedId === "seed1") {
    if (progressPct >= 100) return { type: "emoji", emoji: matureEmoji };
    return { type: "image", src: tomatoSproutUrl, alt: "番茄幼苗" };
  }
  if (seedId === "seed2") {
    if (progressPct >= 100) return { type: "emoji", emoji: matureEmoji };
    return { type: "image", src: strawberryGrowingUrl, alt: "草莓生长中" };
  }
  return { type: "emoji", emoji: matureEmoji };
}

/** 商店 / 背包种子图标：有贴图优先贴图 */
export function getSeedInventoryIcon(seedId: string, emoji: string): { kind: "emoji"; emoji: string } | { kind: "img"; src: string } {
  if (seedId === "seed1") return { kind: "img", src: tomatoSeedUrl };
  if (seedId === "seed2") return { kind: "img", src: strawberrySeedUrl };
  return { kind: "emoji", emoji };
}
