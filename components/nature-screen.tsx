import { Home, Coins, ShoppingBag, Sprout, Flower2, Lock, Store, Image, X, Trash2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { HarvestRewardPayload } from "../game-types";
import type { GrowingPlantSlot, PersistentSlotSoil } from "../game-progress-storage";
import {
  FERTILIZER_MAX_USES_PER_PLANT,
  ITEM_ADVANCED_SOIL,
  ITEM_AUTO_WATERING,
  ITEM_FERTILIZER,
  ITEM_GARDEN_GLOVES,
  ITEM_SIMULATED_SUN,
  ITEM_SUPER_SOIL,
  ITEM_THERMOSTAT,
  ITEM_WATER_REFILL,
  SHOP_ITEMS,
  formatSunBoostStatus,
  formatWateringRemainShort,
  getShopItem,
} from "../item-catalog";
import {
  MAX_EXHIBITION_COLLECTIBLES,
  MAX_EXHIBITION_FRUIT_UNITS,
  fruitSellUnitPrice,
  getCollectibleDef,
  qualityLabel,
  sellPriceForCollectibleDefId,
} from "../collectible-catalog";
import { type GrowthComputeOpts, computePlantProgress, formatPlantRemainClock } from "../plant-growth";
import { setMusicScene } from "../game-audio";
import { SEEDS as seeds, shovelRefundForSeed, type SeedCatalogEntry } from "../seed-catalog";
import { getPlantGrowthVisual, getSeedInventoryIcon } from "../seed-visuals";

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(n)));
}

interface NurtureScreenProps {
  coins: number;
  unlockedSlots: number;
  growingPlants: Array<GrowingPlantSlot | null>;
  seedInventory: { [key: string]: number };
  exhibitionPlants: string[];
  harvestedFruits: { [key: string]: number };
  collectibleBackpack: Record<string, number>;
  exhibitionCollectibles: string[];
  exhibitionFruits: Record<string, number>;
  itemInventory: Record<string, number>;
  sunBoostActive: boolean;
  wateringBoostUntil: number | null;
  wateringNeedsRefill: boolean;
  ownsGardenGloves: boolean;
  ownsSimulatedSun: boolean;
  ownsAutoWatering: boolean;
  persistentSlotSoil: PersistentSlotSoil;
  growthOpts: GrowthComputeOpts;
  harvestRewards: HarvestRewardPayload | null;
  onCloseHarvestRewards: () => void;
  shopNotice: string | null;
  onDismissShopNotice: () => void;
  onBackToMenu: () => void;
  onBuySeed: (seedId: string, unitPrice: number, quantity: number) => void;
  onBuyItem: (itemId: string, quantity: number) => void;
  onUnlockSlot: (price: number) => void;
  onPlantSeed: (slotIndex: number, seedId: string) => void;
  onHarvestPlant: (slotIndex: number) => void;
  onMoveToExhibition: (slotIndex: number) => void;
  onSellFruit: (fruitId: string, quantity: number) => void;
  onSellCollectible: (defId: string, quantity: number) => void;
  onMoveCollectibleToExhibition: (defId: string) => void;
  onRemoveCollectibleFromExhibition: (displayIndex: number) => void;
  onMoveFruitToExhibition: (fruitId: string) => void;
  onRemoveFruitFromExhibition: (fruitId: string) => void;
  /** 铲除生长中的植株，返还半价金币 */
  onShovelPlant: (slotIndex: number) => void;
  onToggleSun: () => void;
  onActivateWatering: () => void;
  onUseWaterRefill: () => void;
  onLayPersistentSoil: (tier: "advanced" | "super", slotIndex: number) => void;
  onApplyFertilizer: (slotIndex: number) => void;
  onApplyThermostat: (slotIndex: number) => void;
}

// 槽位解锁价格：槽位2 / 3 / 4
const slotUnlockPrices = [0, 300, 1000, 3000];

function FruitMarketCard({
  seed,
  count,
  unit,
  licensed,
  canShowFruit,
  fruitOnDisplayFull,
  onSellFruit,
  onMoveFruitToExhibition,
}: {
  seed: SeedCatalogEntry;
  count: number;
  unit: number;
  licensed: boolean;
  canShowFruit: boolean;
  fruitOnDisplayFull: boolean;
  onSellFruit: (fruitId: string, quantity: number) => void;
  onMoveFruitToExhibition: (fruitId: string) => void;
}) {
  const [qty, setQty] = useState(1);
  useEffect(() => {
    if (count <= 0) {
      setQty(1);
      return;
    }
    setQty((q) => clampInt(q, 1, count));
  }, [count]);

  const sellN = count > 0 ? clampInt(qty, 1, count) : 1;
  const totalEarn = unit * sellN;

  return (
    <div
      className={`rounded-2xl p-5 border-2 ${
        count > 0
          ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
          : "bg-gray-100 border-gray-200 opacity-50"
      }`}
    >
      <div className="text-6xl mb-3 text-center">{seed.emoji}</div>
      <div className="text-base font-medium mb-1 text-blue-800 text-center">{seed.name.replace("种子", "果实")}</div>
      <div className="text-sm text-blue-600 mb-3 text-center">
        库存: {count} 个
      </div>
      {licensed && count > 0 ? (
        <p className="mb-2 text-center text-xs text-amber-700">涨价许可生效 · 单价已上浮</p>
      ) : null}
      {count > 0 ? (
        <div className="mb-3 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="减少卖出数量"
            className="rounded-lg border border-blue-200 bg-white p-1.5 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            disabled={sellN <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-blue-900">{sellN}</span>
          <button
            type="button"
            aria-label="增加卖出数量"
            className="rounded-lg border border-blue-200 bg-white p-1.5 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            disabled={sellN >= count}
            onClick={() => setQty((q) => Math.min(count, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => count > 0 && onSellFruit(seed.id, sellN)}
          disabled={count === 0}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
            count > 0
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Coins className="w-4 h-4" />
          卖出 {sellN} 个 (+{totalEarn})
        </button>
        <button
          type="button"
          onClick={() => canShowFruit && onMoveFruitToExhibition(seed.id)}
          disabled={!canShowFruit}
          className={`w-full rounded-lg py-2 text-center text-sm font-medium ${
            canShowFruit
              ? "bg-purple-500 text-white hover:bg-purple-600"
              : "cursor-not-allowed bg-gray-200 text-gray-500"
          }`}
        >
          {fruitOnDisplayFull ? "展台已满" : "送 1 个去果实展台"}
        </button>
      </div>
    </div>
  );
}

function CollectibleSellRow({
  defId,
  def,
  qtyOwned,
  sell,
  canShow,
  onSellCollectible,
  onMoveCollectibleToExhibition,
  onOpenDetail,
}: {
  defId: string;
  def: NonNullable<ReturnType<typeof getCollectibleDef>>;
  qtyOwned: number;
  sell: number;
  canShow: boolean;
  onSellCollectible: (defId: string, quantity: number) => void;
  onMoveCollectibleToExhibition: (defId: string) => void;
  onOpenDetail: () => void;
}) {
  const [sellQty, setSellQty] = useState(1);
  useEffect(() => {
    if (qtyOwned <= 0) {
      setSellQty(1);
      return;
    }
    setSellQty((q) => clampInt(q, 1, qtyOwned));
  }, [qtyOwned]);

  const n = qtyOwned > 0 ? clampInt(sellQty, 1, qtyOwned) : 1;
  const totalEarn = sell * n;

  return (
    <div className="flex gap-2 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm sm:gap-3">
      <div
        role="button"
        tabIndex={0}
        className="flex min-w-0 flex-1 cursor-pointer gap-3 rounded-xl p-0.5 outline-offset-2 hover:bg-violet-50/60"
        onClick={onOpenDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetail();
          }
        }}
      >
        <img
          src={def.image}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl border border-violet-100 bg-violet-50 object-contain"
          draggable={false}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-violet-900">{def.name}</div>
          <div className="mt-0.5 text-xs text-violet-600">
            {qualityLabel(def.quality)} · ×{qtyOwned}
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] text-gray-600">{def.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col justify-center gap-2">
        {qtyOwned > 0 ? (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label="减少卖出数量"
              className="rounded-lg border border-violet-200 bg-violet-50 p-1 text-violet-800 hover:bg-violet-100 disabled:opacity-40"
              disabled={n <= 1}
              onClick={() => setSellQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.75rem] text-center text-xs font-semibold tabular-nums text-violet-900">{n}</span>
            <button
              type="button"
              aria-label="增加卖出数量"
              className="rounded-lg border border-violet-200 bg-violet-50 p-1 text-violet-800 hover:bg-violet-100 disabled:opacity-40"
              disabled={n >= qtyOwned}
              onClick={() => setSellQty((q) => Math.min(qtyOwned, q + 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!canShow}
          onClick={() => canShow && onMoveCollectibleToExhibition(defId)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
            canShow ? "bg-purple-500 hover:bg-purple-600" : "cursor-not-allowed bg-gray-300"
          }`}
        >
          上架展台
        </button>
        <button
          type="button"
          disabled={qtyOwned === 0}
          onClick={() => qtyOwned > 0 && onSellCollectible(defId, n)}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:bg-gray-300"
        >
          卖出 {n} 个 +{totalEarn}
        </button>
      </div>
    </div>
  );
}

export function NurtureScreen({
  coins,
  unlockedSlots,
  growingPlants,
  seedInventory,
  exhibitionPlants,
  harvestedFruits,
  collectibleBackpack,
  exhibitionCollectibles,
  exhibitionFruits,
  itemInventory,
  sunBoostActive,
  wateringBoostUntil,
  wateringNeedsRefill,
  ownsGardenGloves,
  ownsSimulatedSun,
  ownsAutoWatering,
  persistentSlotSoil,
  growthOpts,
  harvestRewards,
  onCloseHarvestRewards,
  shopNotice,
  onDismissShopNotice,
  onBackToMenu,
  onBuySeed,
  onBuyItem,
  onUnlockSlot,
  onPlantSeed,
  onHarvestPlant,
  onMoveToExhibition,
  onSellFruit,
  onSellCollectible,
  onMoveCollectibleToExhibition,
  onRemoveCollectibleFromExhibition,
  onMoveFruitToExhibition,
  onRemoveFruitFromExhibition,
  onShovelPlant,
  onToggleSun,
  onActivateWatering,
  onUseWaterRefill,
  onLayPersistentSoil,
  onApplyFertilizer,
  onApplyThermostat,
}: NurtureScreenProps) {
  /** 刷新剩余时间与进度条（加速时更顺滑） */
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setClockTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const [activeTab, setActiveTab] = useState<"nursery" | "shop" | "exhibition" | "market">("nursery");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  /** 种子商店：查看详情的种子 id */
  const [shopSeedDetailId, setShopSeedDetailId] = useState<string | null>(null);
  const [shopItemDetailId, setShopItemDetailId] = useState<string | null>(null);
  /** 展览区：查看藏品详情 */
  const [collectibleDetailId, setCollectibleDetailId] = useState<string | null>(null);
  const [slotPickMode, setSlotPickMode] = useState<null | "advanced_soil" | "super_soil" | "fertilizer" | "thermostat">(
    null,
  );
  const [seedBuyQty, setSeedBuyQty] = useState(1);
  const [itemBuyQty, setItemBuyQty] = useState(1);

  const getSeedInfo = (seedId: string) => {
    return seeds.find((s) => s.id === seedId);
  };

  const seedsInInventory = seeds.filter((s) => (seedInventory[s.id] || 0) > 0);

  const shopDetailSeed = shopSeedDetailId ? getSeedInfo(shopSeedDetailId) : undefined;

  useEffect(() => {
    if (activeTab !== "shop") {
      setShopSeedDetailId(null);
      setShopItemDetailId(null);
    }
    if (activeTab !== "exhibition") {
      setCollectibleDetailId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    setMusicScene(activeTab === "shop" ? "nurture_shop" : "nurture_greenhouse");
  }, [activeTab]);

  const shopDetailItem = shopItemDetailId ? getShopItem(shopItemDetailId) : undefined;
  const collectibleDetailDef = collectibleDetailId ? getCollectibleDef(collectibleDetailId) : undefined;

  useEffect(() => {
    setSeedBuyQty(1);
  }, [shopSeedDetailId]);

  useEffect(() => {
    setItemBuyQty(1);
  }, [shopItemDetailId]);

  const handlePlantClick = (slotIndex: number, seedId: string) => {
    onPlantSeed(slotIndex, seedId);
    setSelectedSlot(null);
  };

  const sunStatus = formatSunBoostStatus(sunBoostActive);
  const waterHint = formatWateringRemainShort(wateringBoostUntil);
  const wateringAccelerating =
    wateringBoostUntil != null && Number.isFinite(wateringBoostUntil) && Date.now() < wateringBoostUntil;
  const fruitOnDisplayTotal = Object.values(exhibitionFruits).reduce((a, n) => a + n, 0);

  return (
    <div className="panel-90 relative flex min-h-0 w-full max-w-4xl flex-col rounded-3xl bg-white/95 p-6 shadow-2xl">
      {shopNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex max-w-[min(100%,20rem)] -translate-x-1/2 justify-center px-3">
          <button
            type="button"
            className="pointer-events-auto w-full rounded-2xl bg-emerald-700 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg ring-2 ring-white/25"
            onClick={onDismissShopNotice}
          >
            {shopNotice}
          </button>
        </div>
      ) : null}
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToMenu}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110"
        >
          <Home className="w-5 h-5" />
        </button>
        <h2 className="text-3xl text-green-600 flex items-center gap-2">
          <Flower2 className="w-8 h-8" />
          我的花园
        </h2>
        <div className="bg-yellow-100 px-4 py-2 rounded-full flex items-center space-x-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          <span className="text-xl text-yellow-700">{coins}</span>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setActiveTab("nursery")}
          className={`py-3 rounded-xl transition-all ${
            activeTab === "nursery"
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : "bg-green-100 text-green-600 hover:bg-green-200"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Sprout className="w-5 h-5" />
            <span>培育室</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("shop")}
          className={`py-3 rounded-xl transition-all ${
            activeTab === "shop"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              : "bg-orange-100 text-orange-600 hover:bg-orange-200"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>种子商店</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("exhibition")}
          className={`py-3 rounded-xl transition-all ${
            activeTab === "exhibition"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-purple-100 text-purple-600 hover:bg-purple-200"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Image className="w-5 h-5" />
            <span>展览区</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("market")}
          className={`py-3 rounded-xl transition-all ${
            activeTab === "market"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Store className="w-5 h-5" />
            <span>市场</span>
          </div>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {/* 培育室 */}
        {activeTab === "nursery" && (
          <div className="space-y-6">
            {/* 培育槽位 */}
            <div>
              <h3 className="text-xl text-green-700 mb-4 flex items-center">
                <Sprout className="w-5 h-5 mr-2" />
                培育槽位
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((slotIndex) => {
                  const isUnlocked = slotIndex < unlockedSlots;
                  const plant = growingPlants[slotIndex];
                  const seedInfo = plant ? getSeedInfo(plant.plantId) : null;
                  const progressPct = plant ? computePlantProgress(plant, growthOpts) : 0;
                  const soilTier = persistentSlotSoil[slotIndex];
                  const pickingHere =
                    !!slotPickMode &&
                    isUnlocked &&
                    (slotPickMode === "advanced_soil" || slotPickMode === "super_soil"
                      ? true
                      : slotPickMode === "fertilizer" || slotPickMode === "thermostat"
                        ? plant != null && progressPct < 100
                        : false);

                  return (
                    <div
                      key={slotIndex}
                      role={slotPickMode && isUnlocked ? "button" : undefined}
                      onClick={() => {
                        if (!slotPickMode || !isUnlocked) return;
                        if (slotPickMode === "thermostat") {
                          if (!plant || progressPct >= 100) return;
                          onApplyThermostat(slotIndex);
                          setSlotPickMode(null);
                          return;
                        }
                        if (slotPickMode === "fertilizer") {
                          if (!plant || progressPct >= 100) return;
                          onApplyFertilizer(slotIndex);
                          setSlotPickMode(null);
                          return;
                        }
                        if (slotPickMode === "advanced_soil") {
                          onLayPersistentSoil("advanced", slotIndex);
                          setSlotPickMode(null);
                          return;
                        }
                        if (slotPickMode === "super_soil") {
                          onLayPersistentSoil("super", slotIndex);
                          setSlotPickMode(null);
                        }
                      }}
                      className={`rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center ${
                        isUnlocked
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300"
                          : "bg-gray-100 border-2 border-gray-300"
                      } ${
                        slotPickMode && isUnlocked
                          ? pickingHere
                            ? "cursor-pointer ring-4 ring-amber-400 ring-offset-2"
                            : "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {!isUnlocked ? (
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-3">槽位 {slotIndex + 1} 未解锁</p>
                          <button
                            onClick={() => onUnlockSlot(slotUnlockPrices[slotIndex])}
                            disabled={coins < slotUnlockPrices[slotIndex]}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 mx-auto ${
                              coins >= slotUnlockPrices[slotIndex]
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Coins className="w-4 h-4" />
                            {slotUnlockPrices[slotIndex]} 解锁
                          </button>
                        </div>
                      ) : plant ? (
                        <div className="text-center w-full">
                          <div className="mb-2 flex flex-wrap justify-center gap-1">
                            {plant.growthMult != null && plant.growthMult > 1 && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800">控温加速</span>
                            )}
                            {plant.fertilizerUses != null && plant.fertilizerUses > 0 && (
                              <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs text-lime-900">
                                肥料 {plant.fertilizerUses}/{FERTILIZER_MAX_USES_PER_PLANT}
                              </span>
                            )}
                            {soilTier === "advanced" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">槽·高级土</span>
                            )}
                            {soilTier === "super" && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-900">槽·超级土</span>
                            )}
                            {plant.superSoil && !soilTier && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">超级土壤</span>
                            )}
                          </div>
                          {seedInfo ? (
                            (() => {
                              const vis = getPlantGrowthVisual(plant.plantId, progressPct, seedInfo.emoji);
                              return vis.type === "image" ? (
                                <div className="mb-3 flex h-28 items-center justify-center">
                                  <img
                                    src={vis.src}
                                    alt={vis.alt}
                                    className="max-h-full max-w-[min(100%,9rem)] object-contain drop-shadow-sm"
                                    draggable={false}
                                  />
                                </div>
                              ) : (
                                <div className="mb-3 text-7xl">{vis.emoji}</div>
                              );
                            })()
                          ) : (
                            <div className="mb-3 text-7xl">🌱</div>
                          )}
                          <p className="text-green-700 mb-2">{seedInfo?.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-600 mb-1">{progressPct}% 完成</p>
                          {progressPct < 100 ? (
                            <div className="mb-3">
                              <p className="font-mono text-xs tabular-nums text-emerald-700">
                                {formatPlantRemainClock(plant, growthOpts)}
                              </p>
                              {(sunBoostActive || wateringAccelerating || (plant.growthMult ?? 1) > 1) ? (
                                <p className="mt-0.5 text-[11px] text-sky-700">
                                  {sunBoostActive ? "日照加速中 · " : ""}
                                  {wateringAccelerating ? "浇水加速中 · " : ""}
                                  {(plant.growthMult ?? 1) > 1 ? "控温加速中" : ""}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="mb-3 text-xs text-amber-600">已成熟，可以收获</p>
                          )}
                          {progressPct >= 100 ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => onHarvestPlant(slotIndex)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm"
                              >
                                收获
                              </button>
                              <button
                                onClick={() => onMoveToExhibition(slotIndex)}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm"
                              >
                                展览
                              </button>
                            </div>
                          ) : (
                            <div className="w-full space-y-2">
                              <p className="text-xs text-green-500">生长中...</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const refund = shovelRefundForSeed(plant.plantId);
                                  if (
                                    typeof window !== "undefined" &&
                                    !window.confirm(
                                      `确定铲除？植株将被移除，返还 ${refund} 金币（该种子购买价的一半）。`,
                                    )
                                  ) {
                                    return;
                                  }
                                  onShovelPlant(slotIndex);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                              >
                                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                                铲除 · +{shovelRefundForSeed(plant.plantId)} 金币
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mb-2 flex min-h-[1.25rem] flex-wrap justify-center gap-1">
                            {soilTier === "advanced" && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">槽·高级土</span>
                            )}
                            {soilTier === "super" && (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-900">槽·超级土</span>
                            )}
                          </div>
                          <Sprout className="w-12 h-12 text-green-400 mx-auto mb-3" />
                          <p className="text-green-600 mb-3">空槽位</p>
                          <button
                            onClick={() => setSelectedSlot(slotIndex)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
                          >
                            种植
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 可用道具 */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-2xl text-green-700">可用道具</h3>
                <div className="flex max-w-[min(100%,22rem)] flex-col items-end gap-1 text-right">
                  {sunStatus ? <span className="text-sm font-medium text-amber-800">{sunStatus}</span> : null}
                  {waterHint ? <span className="text-sm font-medium text-cyan-800">{waterHint}</span> : null}
                  {ownsAutoWatering && wateringNeedsRefill && !waterHint ? (
                    <span className="text-sm font-medium text-orange-700">请先蓄水</span>
                  ) : null}
                </div>
              </div>
              {slotPickMode && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <span>
                    {slotPickMode === "thermostat"
                      ? "请点击一株作物使用控温器"
                      : slotPickMode === "fertilizer"
                        ? "请点击一株作物施肥"
                      : slotPickMode === "advanced_soil"
                        ? "请点击槽位铺设高级土壤"
                        : "请点击槽位铺设超级土壤"}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-white px-2 py-1 text-xs font-medium ring-1 ring-amber-200 hover:bg-amber-100"
                    onClick={() => setSlotPickMode(null)}
                  >
                    取消
                  </button>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {SHOP_ITEMS.map((item) => {
                  const count = itemInventory[item.id] || 0;

                  if (item.id === ITEM_GARDEN_GLOVES) {
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-600">{ownsGardenGloves ? "已拥有" : `${item.price} 金币`}</div>
                        {ownsGardenGloves ? (
                          <div className="mt-2 rounded-lg bg-emerald-100 py-1.5 text-xs font-medium text-emerald-900">
                            已配备
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id, 1)}
                            className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            购买
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (item.id === ITEM_SIMULATED_SUN) {
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-600">{ownsSimulatedSun ? "已拥有" : `${item.price} 金币`}</div>
                        {ownsSimulatedSun ? (
                          <button
                            type="button"
                            disabled={!!slotPickMode}
                            onClick={onToggleSun}
                            className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-white disabled:bg-gray-300 ${
                              sunBoostActive ? "bg-orange-600 hover:bg-orange-700" : "bg-amber-500 hover:bg-amber-600"
                            }`}
                          >
                            {sunBoostActive ? "关闭模拟太阳" : "开启模拟太阳"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id, 1)}
                            className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            购买
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (item.id === ITEM_AUTO_WATERING) {
                    const wateringRunning =
                      wateringBoostUntil != null && Date.now() < wateringBoostUntil;
                    const canStart =
                      ownsAutoWatering &&
                      !wateringNeedsRefill &&
                      !slotPickMode &&
                      !wateringRunning;
                    const showRefill = ownsAutoWatering && wateringNeedsRefill && (itemInventory[ITEM_WATER_REFILL] || 0) > 0;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-600">{ownsAutoWatering ? "已拥有" : `${item.price} 金币`}</div>
                        {!ownsAutoWatering ? (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id, 1)}
                            className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            购买
                          </button>
                        ) : showRefill ? (
                          <button
                            type="button"
                            disabled={!!slotPickMode}
                            onClick={onUseWaterRefill}
                            className="mt-2 w-full rounded-lg bg-sky-500 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:bg-gray-300"
                          >
                            蓄水（库存 {itemInventory[ITEM_WATER_REFILL] || 0}）
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canStart}
                            onClick={onActivateWatering}
                            className="mt-2 w-full rounded-lg bg-cyan-500 py-1.5 text-xs font-semibold text-white hover:bg-cyan-600 disabled:bg-gray-300"
                          >
                            {wateringRunning ? "浇水中" : wateringNeedsRefill ? "需先蓄水" : "启动浇水"}
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (item.id === ITEM_FERTILIZER) {
                    const canFert = count > 0 && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-700">库存 {count}</div>
                        <button
                          type="button"
                          disabled={!canFert}
                          onClick={() => setSlotPickMode("fertilizer")}
                          className="mt-2 w-full rounded-lg bg-lime-600 py-1.5 text-xs font-semibold text-white hover:bg-lime-700 disabled:bg-gray-300"
                        >
                          施肥
                        </button>
                        <button
                          type="button"
                          disabled={coins < item.price || !!slotPickMode}
                          onClick={() => onBuyItem(item.id, 1)}
                          className="mt-1.5 w-full rounded-lg border border-yellow-400 bg-yellow-50 py-1 text-[11px] font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          +购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  if (item.id === ITEM_THERMOSTAT) {
                    const canThermo = count > 0 && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-700">库存 {count}</div>
                        <button
                          type="button"
                          disabled={!canThermo}
                          onClick={() => setSlotPickMode("thermostat")}
                          className="mt-2 w-full rounded-lg bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:bg-gray-300"
                        >
                          选株使用
                        </button>
                        <button
                          type="button"
                          disabled={coins < item.price || !!slotPickMode}
                          onClick={() => onBuyItem(item.id, 1)}
                          className="mt-1.5 w-full rounded-lg border border-yellow-400 bg-yellow-50 py-1 text-[11px] font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          +购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  if (item.id === ITEM_ADVANCED_SOIL) {
                    const canPick = count > 0 && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-700">库存 {count}</div>
                        <button
                          type="button"
                          disabled={!canPick}
                          onClick={() => setSlotPickMode("advanced_soil")}
                          className="mt-2 w-full rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:bg-gray-300"
                        >
                          铺土
                        </button>
                        <button
                          type="button"
                          disabled={coins < item.price || !!slotPickMode}
                          onClick={() => onBuyItem(item.id, 1)}
                          className="mt-1.5 w-full rounded-lg border border-yellow-400 bg-yellow-50 py-1 text-[11px] font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          +购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  if (item.id === ITEM_SUPER_SOIL) {
                    const canPick = count > 0 && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-700">库存 {count}</div>
                        <button
                          type="button"
                          disabled={!canPick}
                          onClick={() => setSlotPickMode("super_soil")}
                          className="mt-2 w-full rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:bg-gray-300"
                        >
                          铺土
                        </button>
                        <button
                          type="button"
                          disabled={coins < item.price || !!slotPickMode}
                          onClick={() => onBuyItem(item.id, 1)}
                          className="mt-1.5 w-full rounded-lg border border-yellow-400 bg-yellow-50 py-1 text-[11px] font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          +购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  if (item.id === ITEM_WATER_REFILL) {
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-700">库存 {count}</div>
                        <button
                          type="button"
                          disabled={coins < item.price || !!slotPickMode}
                          onClick={() => onBuyItem(item.id, 1)}
                          className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                        >
                          购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        )}

        {/* 种子商店 */}
        {activeTab === "shop" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl text-orange-600 mb-4 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2" />
                种子商店
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {seeds.map((seed) => {
                  const owned = seedInventory[seed.id] || 0;
                  const invIcon = getSeedInventoryIcon(seed.id, seed.emoji);

                  return (
                    <button
                      key={seed.id}
                      type="button"
                      onClick={() => setShopSeedDetailId(seed.id)}
                      className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200 text-left transition-all hover:border-orange-400 hover:shadow-md"
                    >
                      <div className="mb-3 flex h-20 items-center justify-center">
                        {invIcon.kind === "img" ? (
                          <img
                            src={invIcon.src}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                            draggable={false}
                          />
                        ) : (
                          <span className="text-6xl">{invIcon.emoji}</span>
                        )}
                      </div>
                      <div className="text-base font-medium mb-1 text-orange-800 text-center">{seed.name}</div>
                      <div className="text-xs text-orange-600 mb-2 text-center flex items-center justify-center gap-1">
                        <Sprout className="w-3 h-3 shrink-0" />
                        {seed.growTime}
                      </div>
                      <div className="text-xs text-green-600 text-center">已有: {owned} 个</div>
                      <div className="mt-3 text-center text-xs text-orange-500">点击查看详情</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl text-orange-600 mb-4">道具商店</h3>
              <div className="grid grid-cols-3 gap-2">
                {SHOP_ITEMS.map((item) => {
                  const bagCount = itemInventory[item.id] || 0;
                  const permOwned =
                    (item.id === ITEM_GARDEN_GLOVES && ownsGardenGloves) ||
                    (item.id === ITEM_SIMULATED_SUN && ownsSimulatedSun) ||
                    (item.id === ITEM_AUTO_WATERING && ownsAutoWatering);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setShopItemDetailId(item.id)}
                      className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 text-center transition-all hover:border-sky-400 hover:shadow-md"
                    >
                      <div className="text-4xl">{item.emoji}</div>
                      <div className="mt-1 text-sm font-semibold text-blue-900">{item.name}</div>
                      <div className="mt-2 text-xs text-gray-600">
                        {item.kind === "permanent"
                          ? permOwned
                            ? "已拥有"
                            : `${item.price} 金币`
                          : `库存 ${bagCount} · ${item.price} 金`}
                      </div>
                      <div className="mt-2 text-center text-xs text-sky-600">点击查看详情</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 展览区 */}
        {activeTab === "exhibition" && (
          <div className="space-y-10 pb-4">
            <div>
              <h3 className="mb-4 flex items-center text-2xl text-purple-600">
                <Image className="mr-2 h-6 w-6" />
                植物展品
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {exhibitionPlants.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-purple-600">
                    <div className="mb-3 text-6xl">🖼️</div>
                    <p className="text-base">还没有植物展品</p>
                    <p className="mt-2 text-sm text-purple-500">将成熟的植株移到此处展示</p>
                  </div>
                ) : (
                  exhibitionPlants.map((plantId, index) => {
                    const seedInfo = getSeedInfo(plantId);
                    const invIcon = seedInfo ? getSeedInventoryIcon(plantId, seedInfo.emoji) : null;
                    return (
                      <div
                        key={`p-${index}-${plantId}`}
                        className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-center"
                      >
                        <div className="mb-2 flex h-16 items-center justify-center">
                          {invIcon?.kind === "img" ? (
                            <img src={invIcon.src} alt="" className="max-h-full object-contain" draggable={false} />
                          ) : (
                            <span className="text-5xl">{seedInfo?.emoji ?? "🌱"}</span>
                          )}
                        </div>
                        <div className="text-sm text-purple-800">{seedInfo?.name ?? plantId}</div>
                        <div className="mt-1 text-xs text-purple-500">展览中</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-4 flex items-center text-xl text-rose-700">
                果实展台（{fruitOnDisplayTotal}/{MAX_EXHIBITION_FRUIT_UNITS}）
              </h3>
              <p className="mb-3 text-sm text-rose-700/85">
                从「果实市场」每次送<strong className="mx-0.5">1 个</strong>果实到此陈列；取下后回到市场库存。
              </p>
              <div className="flex flex-wrap gap-3">
                {fruitOnDisplayTotal === 0 ? (
                  <div className="w-full rounded-2xl border border-rose-100 bg-rose-50/60 py-10 text-center text-rose-800">
                    暂无陈列果实
                  </div>
                ) : (
                  Object.entries(exhibitionFruits)
                    .filter(([, n]) => n > 0)
                    .flatMap(([fruitId, qty]) => {
                      const info = getSeedInfo(fruitId);
                      return Array.from({ length: qty }, (_, i) => (
                        <div
                          key={`${fruitId}-${i}`}
                          className="relative flex w-[calc(50%-0.375rem)] min-w-[140px] flex-col items-center rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-3 sm:w-[calc(33.333%-0.5rem)]"
                        >
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 hover:bg-white"
                            aria-label="取下"
                            onClick={() => onRemoveFruitFromExhibition(fruitId)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <span className="text-4xl">{info?.emoji ?? "🍎"}</span>
                          <span className="mt-2 text-center text-xs font-medium text-rose-900">
                            {(info?.name ?? fruitId).replace("种子", "果实")}
                          </span>
                        </div>
                      ));
                    })
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center text-xl text-violet-700">藏品背包</h3>
              <p className="mb-4 text-sm text-violet-600/90">
                收获时会附带一枚关联藏品；放进展台也能当作小小展览。点卡片可看简介。
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(collectibleBackpack).filter(([, n]) => n > 0).length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-violet-100 bg-violet-50/50 py-12 text-center text-violet-700">
                    <p>背包空空如也</p>
                    <p className="mt-2 text-sm text-violet-500">去收获番茄等作物试试吧</p>
                  </div>
                ) : (
                  Object.entries(collectibleBackpack)
                    .filter(([, n]) => n > 0)
                    .flatMap(([defId, qty]) => {
                      const def = getCollectibleDef(defId);
                      if (!def) return [];
                      const sell = sellPriceForCollectibleDefId(defId);
                      const canShow = exhibitionCollectibles.length < MAX_EXHIBITION_COLLECTIBLES;
                      return [
                        <CollectibleSellRow
                          key={defId}
                          defId={defId}
                          def={def}
                          qtyOwned={qty}
                          sell={sell}
                          canShow={canShow}
                          onSellCollectible={onSellCollectible}
                          onMoveCollectibleToExhibition={onMoveCollectibleToExhibition}
                          onOpenDetail={() => setCollectibleDetailId(defId)}
                        />,
                      ];
                    })
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl text-fuchsia-700">
                藏品展台（{exhibitionCollectibles.length}/{MAX_EXHIBITION_COLLECTIBLES}）
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {exhibitionCollectibles.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-fuchsia-700/80">
                    暂无上架藏品 · 从背包点击「上架展台」
                  </div>
                ) : (
                  exhibitionCollectibles.map((defId, idx) => {
                    const def = getCollectibleDef(defId);
                    if (!def) return null;
                    return (
                      <div
                        key={`c-${idx}-${defId}`}
                        role="button"
                        tabIndex={0}
                        className="relative cursor-pointer rounded-2xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-3 text-center outline-offset-2 hover:ring-2 hover:ring-fuchsia-200/80"
                        onClick={() => setCollectibleDetailId(defId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setCollectibleDetailId(defId);
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="absolute right-1 top-1 z-10 rounded-full bg-white/90 p-1 text-gray-500 shadow hover:bg-white hover:text-gray-800"
                          aria-label="取下"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onRemoveCollectibleFromExhibition(idx);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <img
                          src={def.image}
                          alt=""
                          className="mx-auto mb-2 h-16 w-16 object-contain"
                          draggable={false}
                        />
                        <div className="text-xs font-medium text-fuchsia-900">{def.name}</div>
                        <div className="mt-1 text-[10px] text-fuchsia-600">{qualityLabel(def.quality)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 市场 */}
        {activeTab === "market" && (
          <div>
            <h3 className="text-2xl text-blue-600 mb-4 flex items-center">
              <Store className="w-6 h-6 mr-2" />
              果实市场
            </h3>
            <p className="mb-4 text-sm text-blue-700/90">
              收获的果实暂存在此：可选择<strong className="mx-0.5">数量批量售出</strong>，或将<strong className="mx-0.5">1 个</strong>送至「展览区 · 果实展台」陈列。
            </p>
            <div className="grid grid-cols-3 gap-4">
              {seeds.map((seed) => {
                const count = harvestedFruits[seed.id] || 0;
                const unit = fruitSellUnitPrice(seed.id, seed.fruitPrice, collectibleBackpack, exhibitionCollectibles);
                const licensed = unit !== seed.fruitPrice;
                const canShowFruit =
                  count > 0 && fruitOnDisplayTotal < MAX_EXHIBITION_FRUIT_UNITS;

                return (
                  <FruitMarketCard
                    key={seed.id}
                    seed={seed}
                    count={count}
                    unit={unit}
                    licensed={licensed}
                    canShowFruit={canShowFruit}
                    fruitOnDisplayFull={fruitOnDisplayTotal >= MAX_EXHIBITION_FRUIT_UNITS}
                    onSellFruit={onSellFruit}
                    onMoveFruitToExhibition={onMoveFruitToExhibition}
                  />
                );
              })}
            </div>
            
            {Object.values(harvestedFruits).every(count => count === 0) && (
              <div className="text-center py-16 text-blue-600">
                <div className="text-8xl mb-4">🏪</div>
                <p className="text-lg">还没有可出售的果实</p>
                <p className="text-sm text-blue-500 mt-2">收获植物后可以在这里出售获得金币！</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 收获结算 */}
      {harvestRewards ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="harvest-reward-title"
          onClick={onCloseHarvestRewards}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="harvest-reward-title" className="text-xl font-bold text-green-800">
              收获成功
            </h3>
            <p className="mt-2 text-sm text-gray-600">本次获得：</p>
            <ul className="mt-3 max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto text-sm">
              {harvestRewards.fruits.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-green-900"
                >
                  <span>{f.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">×{f.count}</span>
                </li>
              ))}
              {harvestRewards.collectibles.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-violet-900"
                >
                  <span>藏品 · {c.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">×{c.count}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700"
              onClick={onCloseHarvestRewards}
            >
              好的
            </button>
          </div>
        </div>
      ) : null}

      {/* 种植背包：仅展示库存 > 0 的种子 */}
      {selectedSlot !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plant-bag-title"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-green-100 px-5 py-4">
              <h3 id="plant-bag-title" className="text-lg font-semibold text-green-800">
                背包 · 种植到槽位 {selectedSlot + 1}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              {seedsInInventory.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="mb-3 text-5xl">🎒</div>
                  <p className="text-base">背包里还没有种子</p>
                  <p className="mt-2 text-sm text-gray-400">请先到「种子商店」购买后再来种植</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {seedsInInventory.map((seed) => {
                    const count = seedInventory[seed.id] || 0;
                    const invIcon = getSeedInventoryIcon(seed.id, seed.emoji);
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        onClick={() => handlePlantClick(selectedSlot, seed.id)}
                        className="rounded-2xl border-2 border-green-200 bg-green-50/80 p-4 text-center transition-all hover:border-green-400 hover:bg-green-100"
                      >
                        <div className="flex h-14 items-center justify-center">
                          {invIcon.kind === "img" ? (
                            <img src={invIcon.src} alt="" className="max-h-full object-contain" draggable={false} />
                          ) : (
                            <span className="text-4xl">{invIcon.emoji}</span>
                          )}
                        </div>
                        <div className="mt-2 text-sm font-medium text-green-800">{seed.name}</div>
                        <div className="mt-1 text-xs text-green-600">× {count}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 种子商店 · 种子详情 */}
      {shopDetailSeed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seed-detail-title"
          onClick={() => setShopSeedDetailId(null)}
        >
          <div
            className="max-h-panel-90 relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShopSeedDetailId(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:bg-gray-100"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-y-auto px-6 pb-6 pt-10">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 text-7xl shadow-inner ring-2 ring-orange-100">
                {(() => {
                  const ic = getSeedInventoryIcon(shopDetailSeed.id, shopDetailSeed.emoji);
                  return ic.kind === "img" ? (
                    <img src={ic.src} alt="" className="max-h-[90%] max-w-[90%] object-contain" draggable={false} />
                  ) : (
                    ic.emoji
                  );
                })()}
              </div>
              <h3 id="seed-detail-title" className="text-center text-xl font-bold text-orange-900">
                {shopDetailSeed.name}
              </h3>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-orange-700">
                <span className="rounded-full bg-orange-100 px-3 py-1">
                  <Sprout className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  成熟约 {shopDetailSeed.growTime}
                </span>
                <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                  库存 {seedInventory[shopDetailSeed.id] || 0} 个
                </span>
              </div>
              <p className="mt-5 leading-relaxed text-gray-600">{shopDetailSeed.description}</p>
              {shopDetailSeed.flavor ? (
                <p className="mt-3 border-t border-orange-100 pt-3 text-sm leading-relaxed text-gray-500">
                  {shopDetailSeed.flavor}
                </p>
              ) : null}
              {(() => {
                const unit = shopDetailSeed.price;
                const maxQty = Math.min(99, Math.max(0, Math.floor(coins / unit)));
                const q = maxQty < 1 ? 1 : clampInt(seedBuyQty, 1, maxQty);
                const total = unit * q;
                const canBuy = maxQty >= 1 && coins >= total;
                return (
                  <>
                    <div className="mt-6 flex flex-col gap-3 rounded-xl bg-orange-50/90 px-3 py-3 ring-1 ring-orange-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-orange-900">
                        <span>购买数量</span>
                        <span className="tabular-nums">
                          单价 {unit} · 合计 <strong>{total}</strong> 金币
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="rounded-lg border border-orange-200 bg-white p-2 text-orange-800 hover:bg-orange-100 disabled:opacity-40"
                          disabled={q <= 1 || maxQty < 1}
                          onClick={() => setSeedBuyQty((n) => Math.max(1, n - 1))}
                          aria-label="减少数量"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="min-w-[3rem] text-center text-lg font-semibold tabular-nums text-orange-950">{q}</span>
                        <button
                          type="button"
                          className="rounded-lg border border-orange-200 bg-white p-2 text-orange-800 hover:bg-orange-100 disabled:opacity-40"
                          disabled={q >= maxQty || maxQty < 1}
                          onClick={() => setSeedBuyQty((n) => Math.min(maxQty, n + 1))}
                          aria-label="增加数量"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => {
                        if (!canBuy) return;
                        onBuySeed(shopDetailSeed.id, unit, q);
                        setShopSeedDetailId(null);
                      }}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white ${
                        canBuy ? "bg-yellow-500 hover:bg-yellow-600" : "cursor-not-allowed bg-gray-300 text-gray-500"
                      }`}
                    >
                      <Coins className="h-5 w-5" />
                      {canBuy ? `购买 · 共 ${total} 金币` : "金币不足"}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 道具商店 · 详情 */}
      {shopDetailItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-detail-title"
          onClick={() => setShopItemDetailId(null)}
        >
          <div
            className="max-h-panel-90 relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShopItemDetailId(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:bg-gray-100"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-y-auto px-6 pb-6 pt-10">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-100 text-7xl shadow-inner ring-2 ring-sky-100">
                {shopDetailItem.emoji}
              </div>
              <h3 id="item-detail-title" className="text-center text-xl font-bold text-slate-900">
                {shopDetailItem.name}
              </h3>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600">
                <span
                  className={`rounded-full px-3 py-1 ${shopDetailItem.kind === "permanent" ? "bg-violet-100 text-violet-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                  {shopDetailItem.kind === "permanent" ? "永久道具" : "消耗品"}
                </span>
                {shopDetailItem.kind === "permanent" ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    {(shopDetailItem.id === ITEM_GARDEN_GLOVES && ownsGardenGloves) ||
                    (shopDetailItem.id === ITEM_SIMULATED_SUN && ownsSimulatedSun) ||
                    (shopDetailItem.id === ITEM_AUTO_WATERING && ownsAutoWatering)
                      ? "已拥有"
                      : "未拥有"}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    库存 {itemInventory[shopDetailItem.id] || 0} 个
                  </span>
                )}
              </div>
              <p className="mt-5 text-base leading-relaxed text-gray-700">{shopDetailItem.description}</p>
              {(() => {
                const permOwned =
                  (shopDetailItem.id === ITEM_GARDEN_GLOVES && ownsGardenGloves) ||
                  (shopDetailItem.id === ITEM_SIMULATED_SUN && ownsSimulatedSun) ||
                  (shopDetailItem.id === ITEM_AUTO_WATERING && ownsAutoWatering);
                const unit = shopDetailItem.price;

                if (shopDetailItem.kind === "permanent") {
                  const afford = coins >= unit;
                  const buyPermanentDisabled = permOwned;
                  const buyDisabled = buyPermanentDisabled || !afford;
                  return (
                    <button
                      type="button"
                      disabled={buyDisabled}
                      onClick={() => {
                        if (buyDisabled) return;
                        onBuyItem(shopDetailItem.id, 1);
                        setShopItemDetailId(null);
                      }}
                      className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white ${
                        !buyDisabled ? "bg-yellow-500 hover:bg-yellow-600" : "cursor-not-allowed bg-gray-300 text-gray-500"
                      }`}
                    >
                      <Coins className="h-5 w-5" />
                      {buyPermanentDisabled ? "已拥有" : afford ? `购买 · ${unit} 金币` : "金币不足"}
                    </button>
                  );
                }

                const maxQty = Math.min(99, Math.max(0, Math.floor(coins / unit)));
                const q = maxQty < 1 ? 1 : clampInt(itemBuyQty, 1, maxQty);
                const total = unit * q;
                const canBuy = maxQty >= 1 && coins >= total;

                return (
                  <>
                    <div className="mt-6 flex flex-col gap-3 rounded-xl bg-emerald-50/90 px-3 py-3 ring-1 ring-emerald-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-emerald-900">
                        <span>购买数量</span>
                        <span className="tabular-nums">
                          单价 {unit} · 合计 <strong>{total}</strong> 金币
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-200 bg-white p-2 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                          disabled={q <= 1 || maxQty < 1}
                          onClick={() => setItemBuyQty((n) => Math.max(1, n - 1))}
                          aria-label="减少数量"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="min-w-[3rem] text-center text-lg font-semibold tabular-nums text-emerald-950">{q}</span>
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-200 bg-white p-2 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                          disabled={q >= maxQty || maxQty < 1}
                          onClick={() => setItemBuyQty((n) => Math.min(maxQty, n + 1))}
                          aria-label="增加数量"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => {
                        if (!canBuy) return;
                        onBuyItem(shopDetailItem.id, q);
                        setShopItemDetailId(null);
                      }}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white ${
                        canBuy ? "bg-yellow-500 hover:bg-yellow-600" : "cursor-not-allowed bg-gray-300 text-gray-500"
                      }`}
                    >
                      <Coins className="h-5 w-5" />
                      {canBuy ? `购买 · 共 ${total} 金币` : "金币不足"}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 展览区 · 藏品详情 */}
      {collectibleDetailDef && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="collectible-detail-title"
          onClick={() => setCollectibleDetailId(null)}
        >
          <div
            className="max-h-panel-90 relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCollectibleDetailId(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm hover:bg-gray-100"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-y-auto px-6 pb-8 pt-10">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-50 to-violet-100 shadow-inner ring-2 ring-fuchsia-100">
                <img
                  src={collectibleDetailDef.image}
                  alt=""
                  className="max-h-[88%] max-w-[88%] object-contain"
                  draggable={false}
                />
              </div>
              <h3 id="collectible-detail-title" className="text-center text-xl font-bold text-fuchsia-900">
                {collectibleDetailDef.name}
              </h3>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-fuchsia-800">
                  {qualityLabel(collectibleDetailDef.quality)}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  回收约 {sellPriceForCollectibleDefId(collectibleDetailDef.id)} 金币
                </span>
              </div>
              <p className="mt-5 leading-relaxed text-gray-600">{collectibleDetailDef.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
