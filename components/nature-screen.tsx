import { Home, Coins, ShoppingBag, Sprout, Flower2, Lock, Store, Image, X, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  formatSunBoostRemainShort,
  formatWateringRemainShort,
  getShopItem,
} from "../item-catalog";
import { type GrowthComputeOpts, computePlantProgress, formatPlantRemainShort } from "../plant-growth";
import { setMusicScene } from "../game-audio";
import { SEEDS as seeds, shovelRefundForSeed } from "../seed-catalog";

interface NurtureScreenProps {
  coins: number;
  unlockedSlots: number;
  growingPlants: Array<GrowingPlantSlot | null>;
  seedInventory: { [key: string]: number };
  exhibitionPlants: string[];
  harvestedFruits: { [key: string]: number };
  itemInventory: Record<string, number>;
  sunBoostUntil: number | null;
  wateringBoostUntil: number | null;
  wateringNeedsRefill: boolean;
  ownsGardenGloves: boolean;
  ownsSimulatedSun: boolean;
  ownsAutoWatering: boolean;
  ownsAdvancedSoil: boolean;
  ownsSuperSoil: boolean;
  persistentSlotSoil: PersistentSlotSoil;
  pendingGloveHarvestBonus: number;
  growthOpts: GrowthComputeOpts;
  onBackToMenu: () => void;
  onBuySeed: (seedId: string, price: number) => void;
  onBuyItem: (itemId: string) => void;
  onUnlockSlot: (price: number) => void;
  onPlantSeed: (slotIndex: number, seedId: string) => void;
  onHarvestPlant: (slotIndex: number) => void;
  onMoveToExhibition: (slotIndex: number) => void;
  onSellFruit: (fruitId: string, price: number) => void;
  /** 铲除生长中的植株，返还半价金币 */
  onShovelPlant: (slotIndex: number) => void;
  onUseGardenGloves: () => void;
  onActivateSun: () => void;
  onActivateWatering: () => void;
  onUseWaterRefill: () => void;
  onLayPersistentSoil: (tier: "advanced" | "super", slotIndex: number) => void;
  onApplyFertilizer: (slotIndex: number) => void;
  onApplyThermostat: (slotIndex: number) => void;
}

// 槽位解锁价格
const slotUnlockPrices = [0, 100, 200, 300]; // 第1个免费，第2、3、4个需要金币

export function NurtureScreen({
  coins,
  unlockedSlots,
  growingPlants,
  seedInventory,
  exhibitionPlants,
  harvestedFruits,
  itemInventory,
  sunBoostUntil,
  wateringBoostUntil,
  wateringNeedsRefill,
  ownsGardenGloves,
  ownsSimulatedSun,
  ownsAutoWatering,
  ownsAdvancedSoil,
  ownsSuperSoil,
  persistentSlotSoil,
  pendingGloveHarvestBonus,
  growthOpts,
  onBackToMenu,
  onBuySeed,
  onBuyItem,
  onUnlockSlot,
  onPlantSeed,
  onHarvestPlant,
  onMoveToExhibition,
  onSellFruit,
  onShovelPlant,
  onUseGardenGloves,
  onActivateSun,
  onActivateWatering,
  onUseWaterRefill,
  onLayPersistentSoil,
  onApplyFertilizer,
  onApplyThermostat,
}: NurtureScreenProps) {
  const [activeTab, setActiveTab] = useState<"nursery" | "shop" | "exhibition" | "market">("nursery");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  /** 种子商店：查看详情的种子 id */
  const [shopSeedDetailId, setShopSeedDetailId] = useState<string | null>(null);
  const [shopItemDetailId, setShopItemDetailId] = useState<string | null>(null);
  const [slotPickMode, setSlotPickMode] = useState<null | "advanced_soil" | "super_soil" | "fertilizer" | "thermostat">(
    null,
  );

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
  }, [activeTab]);

  useEffect(() => {
    setMusicScene(activeTab === "shop" ? "nurture_shop" : "nurture_greenhouse");
  }, [activeTab]);

  const shopDetailItem = shopItemDetailId ? getShopItem(shopItemDetailId) : undefined;

  const handlePlantClick = (slotIndex: number, seedId: string) => {
    onPlantSeed(slotIndex, seedId);
    setSelectedSlot(null);
  };

  const sunHint = formatSunBoostRemainShort(sunBoostUntil);
  const waterHint = formatWateringRemainShort(wateringBoostUntil);

  return (
    <div className="panel-90 flex min-h-0 w-full max-w-4xl flex-col rounded-3xl bg-white/95 p-6 shadow-2xl">
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
                          <div className="text-7xl mb-3">{seedInfo?.emoji}</div>
                          <p className="text-green-700 mb-2">{seedInfo?.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-600 mb-1">{progressPct}% 完成</p>
                          {progressPct < 100 ? (
                            <p className="mb-3 text-xs text-emerald-600">{formatPlantRemainShort(plant, growthOpts)}</p>
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
                  {sunHint ? <span className="text-sm font-medium text-amber-800">{sunHint}</span> : null}
                  {waterHint ? <span className="text-sm font-medium text-cyan-800">{waterHint}</span> : null}
                  {ownsAutoWatering && wateringNeedsRefill && !waterHint ? (
                    <span className="text-sm font-medium text-orange-700">浇水器：需蓄水后可再次启动</span>
                  ) : null}
                  {pendingGloveHarvestBonus > 0 ? (
                    <span className="text-sm font-medium text-emerald-700">
                      手套加成：下次收获额外 +{pendingGloveHarvestBonus} 个果实
                    </span>
                  ) : null}
                </div>
              </div>
              {slotPickMode && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <span>
                    {slotPickMode === "thermostat"
                      ? "请点击一株生长中的作物使用控温器（同时仅一株生效）"
                      : slotPickMode === "fertilizer"
                        ? "请点击一株生长中的作物施肥（同一株最多 3 次）"
                      : slotPickMode === "advanced_soil"
                        ? "请点击槽位铺设高级土壤（空槽也可）"
                        : "请点击槽位铺设超级土壤（空槽也可）"}
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
                          <button
                            type="button"
                            disabled={!!slotPickMode}
                            onClick={onUseGardenGloves}
                            className="mt-2 w-full rounded-lg bg-green-500 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:bg-gray-300"
                          >
                            叠加收成
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id)}
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
                            onClick={onActivateSun}
                            className="mt-2 w-full rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:bg-gray-300"
                          >
                            激活日照
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id)}
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
                            onClick={() => onBuyItem(item.id)}
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
                          onClick={() => onBuyItem(item.id)}
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
                          onClick={() => onBuyItem(item.id)}
                          className="mt-1.5 w-full rounded-lg border border-yellow-400 bg-yellow-50 py-1 text-[11px] font-medium text-yellow-900 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          +购买 {item.price}金
                        </button>
                      </div>
                    );
                  }

                  if (item.id === ITEM_ADVANCED_SOIL) {
                    const canPick = ownsAdvancedSoil && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-600">{ownsAdvancedSoil ? "已拥有" : `${item.price} 金币`}</div>
                        {ownsAdvancedSoil ? (
                          <button
                            type="button"
                            disabled={!canPick}
                            onClick={() => setSlotPickMode("advanced_soil")}
                            className="mt-2 w-full rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:bg-gray-300"
                          >
                            铺土
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id)}
                            className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            购买
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (item.id === ITEM_SUPER_SOIL) {
                    const canPick = ownsSuperSoil && !slotPickMode;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 text-center"
                      >
                        <div className="text-2xl">{item.emoji}</div>
                        <div className="mt-1 text-sm font-semibold leading-tight text-blue-900">{item.name}</div>
                        <div className="mt-2 text-[11px] text-gray-600">{ownsSuperSoil ? "已拥有" : `${item.price} 金币`}</div>
                        {ownsSuperSoil ? (
                          <button
                            type="button"
                            disabled={!canPick}
                            onClick={() => setSlotPickMode("super_soil")}
                            className="mt-2 w-full rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:bg-gray-300"
                          >
                            铺土
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={coins < item.price || !!slotPickMode}
                            onClick={() => onBuyItem(item.id)}
                            className="mt-2 w-full rounded-lg bg-yellow-500 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 disabled:bg-gray-300"
                          >
                            购买
                          </button>
                        )}
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
                          onClick={() => onBuyItem(item.id)}
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

                  return (
                    <button
                      key={seed.id}
                      type="button"
                      onClick={() => setShopSeedDetailId(seed.id)}
                      className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200 text-left transition-all hover:border-orange-400 hover:shadow-md"
                    >
                      <div className="text-6xl mb-3 text-center">{seed.emoji}</div>
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
                    (item.id === ITEM_AUTO_WATERING && ownsAutoWatering) ||
                    (item.id === ITEM_ADVANCED_SOIL && ownsAdvancedSoil) ||
                    (item.id === ITEM_SUPER_SOIL && ownsSuperSoil);

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
          <div>
            <h3 className="text-2xl text-purple-600 mb-4 flex items-center">
              <Image className="w-6 h-6 mr-2" />
              我的展览区
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {exhibitionPlants.length === 0 ? (
                <div className="col-span-4 text-center py-16 text-purple-600">
                  <div className="text-8xl mb-4">🖼️</div>
                  <p className="text-lg">展览区还是空的</p>
                  <p className="text-sm text-purple-500 mt-2">将培育完成的植物移到这里展示吧！</p>
                </div>
              ) : (
                exhibitionPlants.map((plantId, index) => {
                  const seedInfo = getSeedInfo(plantId);
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 text-center"
                    >
                      <div className="text-7xl mb-3">{seedInfo?.emoji}</div>
                      <div className="text-sm text-purple-700">{seedInfo?.name}</div>
                      <div className="text-xs text-purple-500 mt-2">⭐ 展览中</div>
                    </div>
                  );
                })
              )}
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
            <div className="grid grid-cols-3 gap-4">
              {seeds.map((seed) => {
                const count = harvestedFruits[seed.id] || 0;
                
                return (
                  <div
                    key={seed.id}
                    className={`rounded-2xl p-5 border-2 ${
                      count > 0
                        ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                        : "bg-gray-100 border-gray-200 opacity-50"
                    }`}
                  >
                    <div className="text-6xl mb-3 text-center">{seed.emoji}</div>
                    <div className="text-base font-medium mb-1 text-blue-800 text-center">{seed.name.replace('种子', '果实')}</div>
                    <div className="text-sm text-blue-600 mb-3 text-center">
                      库存: {count} 个
                    </div>
                    <button
                      onClick={() => count > 0 && onSellFruit(seed.id, seed.fruitPrice)}
                      disabled={count === 0}
                      className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                        count > 0
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      卖出 (+{seed.fruitPrice})
                    </button>
                  </div>
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
                    return (
                      <button
                        key={seed.id}
                        type="button"
                        onClick={() => handlePlantClick(selectedSlot, seed.id)}
                        className="rounded-2xl border-2 border-green-200 bg-green-50/80 p-4 text-center transition-all hover:border-green-400 hover:bg-green-100"
                      >
                        <div className="text-4xl">{seed.emoji}</div>
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
                {shopDetailSeed.emoji}
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
              <button
                type="button"
                disabled={coins < shopDetailSeed.price}
                onClick={() => {
                  if (coins >= shopDetailSeed.price) {
                    onBuySeed(shopDetailSeed.id, shopDetailSeed.price);
                  }
                }}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white ${
                  coins >= shopDetailSeed.price ? "bg-yellow-500 hover:bg-yellow-600" : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                <Coins className="h-5 w-5" />
                {coins >= shopDetailSeed.price ? `购买 · ${shopDetailSeed.price} 金币` : "金币不足"}
              </button>
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
                    (shopDetailItem.id === ITEM_AUTO_WATERING && ownsAutoWatering) ||
                    (shopDetailItem.id === ITEM_ADVANCED_SOIL && ownsAdvancedSoil) ||
                    (shopDetailItem.id === ITEM_SUPER_SOIL && ownsSuperSoil)
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
                  (shopDetailItem.id === ITEM_AUTO_WATERING && ownsAutoWatering) ||
                  (shopDetailItem.id === ITEM_ADVANCED_SOIL && ownsAdvancedSoil) ||
                  (shopDetailItem.id === ITEM_SUPER_SOIL && ownsSuperSoil);
                const afford = coins >= shopDetailItem.price;
                const buyPermanentDisabled = shopDetailItem.kind === "permanent" && permOwned;
                const buyDisabled = buyPermanentDisabled || !afford;
                return (
                  <button
                    type="button"
                    disabled={buyDisabled}
                    onClick={() => {
                      if (buyDisabled) return;
                      onBuyItem(shopDetailItem.id);
                    }}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white ${
                      !buyDisabled ? "bg-yellow-500 hover:bg-yellow-600" : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    <Coins className="h-5 w-5" />
                    {buyPermanentDisabled
                      ? "已拥有"
                      : afford
                        ? `购买 · ${shopDetailItem.price} 金币`
                        : "金币不足"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
