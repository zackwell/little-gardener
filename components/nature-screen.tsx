import { Home, Coins, ShoppingBag, Sprout, Flower2, Lock, Store, Image } from "lucide-react";
import { useState } from "react";

interface NurtureScreenProps {
  coins: number;
  unlockedSlots: number;
  growingPlants: Array<{slotId: number, plantId: string, progress: number} | null>;
  seedInventory: {[key: string]: number};
  exhibitionPlants: string[];
  harvestedFruits: {[key: string]: number};
  onBackToMenu: () => void;
  onBuySeed: (seedId: string, price: number) => void;
  onUnlockSlot: (price: number) => void;
  onPlantSeed: (slotIndex: number, seedId: string) => void;
  onHarvestPlant: (slotIndex: number) => void;
  onMoveToExhibition: (slotIndex: number) => void;
  onSellFruit: (fruitId: string, price: number) => void;
}

// 种子数据
const seeds = [
  { id: "seed1", name: "番茄种子", emoji: "🍅", price: 50, growTime: "2小时", fruitPrice: 30 },
  { id: "seed2", name: "草莓种子", emoji: "🍓", price: 60, growTime: "3小时", fruitPrice: 40 },
  { id: "seed3", name: "西瓜种子", emoji: "🍉", price: 80, growTime: "4小时", fruitPrice: 60 },
  { id: "seed4", name: "葡萄种子", emoji: "🍇", price: 70, growTime: "3.5小时", fruitPrice: 50 },
  { id: "seed5", name: "柠檬种子", emoji: "🍋", price: 65, growTime: "3小时", fruitPrice: 45 },
  { id: "seed6", name: "樱桃种子", emoji: "🍒", price: 75, growTime: "3.5小时", fruitPrice: 55 },
];

// 道具数据
const items = [
  { id: "item1", name: "加速肥料", emoji: "⚡", price: 30, description: "加速生长50%" },
  { id: "item2", name: "高级土壤", emoji: "🪨", price: 40, description: "提升品质" },
  { id: "item3", name: "自动浇水器", emoji: "💧", price: 100, description: "自动浇水" },
];

// 槽位解锁价格
const slotUnlockPrices = [0, 100, 200, 300]; // 第1个免费，第2、3、4个需要金币

export function NurtureScreen({
  coins,
  unlockedSlots,
  growingPlants,
  seedInventory,
  exhibitionPlants,
  harvestedFruits,
  onBackToMenu,
  onBuySeed,
  onUnlockSlot,
  onPlantSeed,
  onHarvestPlant,
  onMoveToExhibition,
  onSellFruit,
}: NurtureScreenProps) {
  const [activeTab, setActiveTab] = useState<"nursery" | "shop" | "exhibition" | "market">("nursery");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const getSeedInfo = (seedId: string) => {
    return seeds.find(s => s.id === seedId);
  };

  const handlePlantClick = (slotIndex: number, seedId: string) => {
    onPlantSeed(slotIndex, seedId);
    setSelectedSlot(null);
  };

  return (
    <div className="w-full max-w-4xl h-[90vh] bg-white/95 rounded-3xl shadow-2xl p-6 flex flex-col">
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

                  return (
                    <div
                      key={slotIndex}
                      className={`rounded-2xl p-6 min-h-[200px] flex flex-col items-center justify-center ${
                        isUnlocked
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300"
                          : "bg-gray-100 border-2 border-gray-300"
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
                          <div className="text-7xl mb-3">{seedInfo?.emoji}</div>
                          <p className="text-green-700 mb-2">{seedInfo?.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{ width: `${plant.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-green-600 mb-3">{plant.progress}% 完成</p>
                          {plant.progress >= 100 ? (
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
                            <p className="text-xs text-green-500">生长中...</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
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

            {/* 选择种子种植 */}
            {selectedSlot !== null && (
              <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-300">
                <h3 className="text-lg text-green-700 mb-4">
                  选择种子种植到槽位 {selectedSlot + 1}
                </h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {seeds.map((seed) => {
                    const count = seedInventory[seed.id] || 0;
                    return (
                      <button
                        key={seed.id}
                        onClick={() => count > 0 && handlePlantClick(selectedSlot, seed.id)}
                        disabled={count === 0}
                        className={`p-4 rounded-xl ${
                          count > 0
                            ? "bg-white hover:bg-green-100 border-2 border-green-300"
                            : "bg-gray-100 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="text-4xl mb-2">{seed.emoji}</div>
                        <div className="text-xs text-green-700">{seed.name}</div>
                        <div className="text-xs text-green-600 mt-1">库存: {count}</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-xl"
                >
                  取消
                </button>
              </div>
            )}

            {/* 可用道具 */}
            <div>
              <h3 className="text-xl text-green-700 mb-4">可用道具</h3>
              <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200"
                  >
                    <div className="text-4xl mb-2 text-center">{item.emoji}</div>
                    <div className="text-sm text-blue-700 text-center">{item.name}</div>
                    <div className="text-xs text-blue-600 text-center mt-1">{item.description}</div>
                  </div>
                ))}
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
                  const canBuy = coins >= seed.price;
                  const owned = seedInventory[seed.id] || 0;
                  
                  return (
                    <div
                      key={seed.id}
                      className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200"
                    >
                      <div className="text-6xl mb-3 text-center">{seed.emoji}</div>
                      <div className="text-base font-medium mb-1 text-orange-800 text-center">{seed.name}</div>
                      <div className="text-xs text-orange-600 mb-2 text-center flex items-center justify-center gap-1">
                        <Sprout className="w-3 h-3" />
                        {seed.growTime}
                      </div>
                      <div className="text-xs text-green-600 mb-3 text-center">
                        已有: {owned} 个
                      </div>
                      <button
                        onClick={() => canBuy && onBuySeed(seed.id, seed.price)}
                        disabled={!canBuy}
                        className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                          canBuy
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        {seed.price}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-2xl text-orange-600 mb-4">道具商店</h3>
              <div className="grid grid-cols-3 gap-4">
                {items.map((item) => {
                  const canBuy = coins >= item.price;
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200"
                    >
                      <div className="text-5xl mb-3 text-center">{item.emoji}</div>
                      <div className="text-base font-medium mb-1 text-blue-800 text-center">{item.name}</div>
                      <div className="text-xs text-blue-600 mb-3 text-center">{item.description}</div>
                      <button
                        disabled={!canBuy}
                        className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                          canBuy
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        {item.price}
                      </button>
                    </div>
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
    </div>
  );
}
