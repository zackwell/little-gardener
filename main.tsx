import { useEffect, useMemo, useRef, useState } from "react";
import { MainMenu } from "./components/main-menu";
import { GameScreen } from "./components/game-screen";
import { VictoryModal } from "./components/victory-modal";
import { DefeatModal } from "./components/defeat-modal";
import { RecordsScreen } from "./components/records-screen";
import { NurtureScreen } from "./components/nature-screen";
import { SettingsScreen } from "./components/settings-screen";
import { defeatConsolationGold, goldForSecondsUsed } from "./game-constants";
import {
  type GrowingPlantSlot,
  type PersistentSlotSoil,
  loadGameProgress,
  saveGameProgress,
} from "./game-progress-storage";
import {
  ADVANCED_SOIL_HARVEST_MULT,
  FERTILIZER_MAX_USES_PER_PLANT,
  ITEM_ADVANCED_SOIL,
  ITEM_AUTO_WATERING,
  ITEM_FERTILIZER,
  ITEM_GARDEN_GLOVES,
  ITEM_SIMULATED_SUN,
  ITEM_SUPER_SOIL,
  ITEM_THERMOSTAT,
  ITEM_WATER_REFILL,
  THERMOSTAT_GROWTH_MULT,
  SUPER_SOIL_HARVEST_MULT,
  SUN_BOOST_DURATION_MS,
  WATERING_BOOST_DURATION_MS,
  getCombinedGlobalGrowthMult,
  getShopItem,
} from "./item-catalog";
import { computePlantProgress } from "./plant-growth";
import { addVictoryRecord } from "./records-storage";
import { playSfxDefeat, playSfxVictory, setMusicScene } from "./game-audio";
import gameplayBgUrl from "./pics/gameplay.png";
import { useGameSettings } from "./settings-context";
import type { DefeatPayload, VictoryPayload } from "./game-types";
import { getGrowDurationMs, shovelRefundForSeed } from "./seed-catalog";

export default function Component() {
  const { settings, roundSeconds, toggleMusic } = useGameSettings();

  const initialProgress = useMemo(() => loadGameProgress(), []);

  const [gameState, setGameState] = useState<"menu" | "playing" | "records" | "nurture" | "settings">("menu");
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(initialProgress.coins);
  const [roundId, setRoundId] = useState(0);

  const [victorySecondsUsed, setVictorySecondsUsed] = useState(0);
  const [victoryGold, setVictoryGold] = useState(0);
  const [defeatGold, setDefeatGold] = useState(0);

  const defeatOpenedRef = useRef(false);

  const [unlockedSlots, setUnlockedSlots] = useState(initialProgress.unlockedSlots);
  const [growingPlants, setGrowingPlants] = useState<Array<GrowingPlantSlot | null>>(() =>
    initialProgress.growingPlants.map((x) => (x ? { ...x } : null)),
  );
  /** 培育页内驱动生长进度条刷新（真实时间用 Date 计算，此处仅触发重渲染） */
  const [, setGrowthTick] = useState(0);
  const [seedInventory, setSeedInventory] = useState<{ [key: string]: number }>(() => ({
    ...initialProgress.seedInventory,
  }));
  const [exhibitionPlants, setExhibitionPlants] = useState<string[]>(() => [...initialProgress.exhibitionPlants]);
  const [harvestedFruits, setHarvestedFruits] = useState<{ [key: string]: number }>(() => ({
    ...initialProgress.harvestedFruits,
  }));
  const [itemInventory, setItemInventory] = useState<Record<string, number>>(() => ({
    ...initialProgress.itemInventory,
  }));
  const [sunBoostUntil, setSunBoostUntil] = useState<number | null>(() => initialProgress.sunBoostUntil);
  const [wateringBoostUntil, setWateringBoostUntil] = useState<number | null>(
    () => initialProgress.wateringBoostUntil,
  );
  const [wateringNeedsRefill, setWateringNeedsRefill] = useState(() => initialProgress.wateringNeedsRefill);
  const [ownsGardenGloves, setOwnsGardenGloves] = useState(() => initialProgress.ownsGardenGloves);
  const [ownsSimulatedSun, setOwnsSimulatedSun] = useState(() => initialProgress.ownsSimulatedSun);
  const [ownsAutoWatering, setOwnsAutoWatering] = useState(() => initialProgress.ownsAutoWatering);
  const [ownsAdvancedSoil, setOwnsAdvancedSoil] = useState(() => initialProgress.ownsAdvancedSoil);
  const [ownsSuperSoil, setOwnsSuperSoil] = useState(() => initialProgress.ownsSuperSoil);
  const [persistentSlotSoil, setPersistentSlotSoil] = useState<PersistentSlotSoil>(
    () => [...initialProgress.persistentSlotSoil] as PersistentSlotSoil,
  );
  const [pendingGloveHarvestBonus, setPendingGloveHarvestBonus] = useState(() => initialProgress.pendingGloveHarvestBonus);

  const globalGrowthMult = getCombinedGlobalGrowthMult(sunBoostUntil, wateringBoostUntil);
  const growthOpts = useMemo(() => ({ globalGrowthMult }), [globalGrowthMult]);

  /** 日照 / 浇水倒计时期间每秒刷新 */
  const [buffTick, setBuffTick] = useState(0);
  useEffect(() => {
    const sunOn = sunBoostUntil != null && Date.now() < sunBoostUntil;
    const waterOn = wateringBoostUntil != null && Date.now() < wateringBoostUntil;
    if (!sunOn && !waterOn) return;
    const id = window.setInterval(() => setBuffTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [sunBoostUntil, wateringBoostUntil]);

  useEffect(() => {
    if (ownsAutoWatering && wateringBoostUntil != null && Date.now() >= wateringBoostUntil) {
      setWateringNeedsRefill(true);
      setWateringBoostUntil(null);
    }
  }, [buffTick, wateringBoostUntil, ownsAutoWatering]);

  useEffect(() => {
    saveGameProgress({
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
    });
  }, [
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
  ]);

  const bumpRound = () => setRoundId((r) => r + 1);

  useEffect(() => {
    if (gameState === "playing") setMusicScene("playing");
    else if (gameState === "nurture") setMusicScene("nurture_greenhouse");
    else setMusicScene("menu");
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "nurture") return;
    const id = window.setInterval(() => setGrowthTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [gameState]);

  const handleStartGame = () => {
    setGameState("playing");
    setScore(0);
    setShowVictory(false);
    setShowDefeat(false);
    defeatOpenedRef.current = false;
    setDefeatGold(0);
    bumpRound();
  };

  const handleBackToMenu = () => {
    setGameState("menu");
    setShowVictory(false);
    setShowDefeat(false);
    defeatOpenedRef.current = false;
    setDefeatGold(0);
  };

  const handleShowRecords = () => {
    setGameState("records");
  };

  const handleShowNurture = () => {
    setGameState("nurture");
  };

  const handleShowSettings = () => {
    setGameState("settings");
  };

  const handleVictory = (payload: VictoryPayload) => {
    const gold = goldForSecondsUsed(payload.secondsUsed, payload.roundSeconds);
    setVictorySecondsUsed(payload.secondsUsed);
    setVictoryGold(gold);
    setShowVictory(true);
    setCoins((c) => c + gold);
    playSfxVictory();
    addVictoryRecord({
      secondsUsed: payload.secondsUsed,
      roundSeconds: payload.roundSeconds,
      score: payload.finalScore,
    });
  };

  const handleDefeat = (payload: DefeatPayload) => {
    if (defeatOpenedRef.current) return;
    defeatOpenedRef.current = true;
    const gold = defeatConsolationGold(payload.cellsRemaining, payload.roundSeconds);
    setDefeatGold(gold);
    setShowDefeat(true);
    setCoins((c) => c + gold);
    playSfxDefeat();
  };

  const handleRetry = () => {
    setShowDefeat(false);
    defeatOpenedRef.current = false;
    setDefeatGold(0);
    setScore(0);
    bumpRound();
  };

  const handlePlayAgainFromVictory = () => {
    setShowVictory(false);
    setScore(0);
    defeatOpenedRef.current = false;
    bumpRound();
  };

  const handleRestartRound = () => {
    setScore(0);
    bumpRound();
  };

  const handleBuySeed = (seedId: string, price: number) => {
    if (coins >= price) {
      setCoins(coins - price);
      setSeedInventory({
        ...seedInventory,
        [seedId]: (seedInventory[seedId] || 0) + 1,
      });
    }
  };

  const handleBuyItem = (itemId: string) => {
    const def = getShopItem(itemId);
    if (!def || coins < def.price) return;
    if (def.kind === "permanent") {
      if (itemId === ITEM_GARDEN_GLOVES && ownsGardenGloves) return;
      if (itemId === ITEM_SIMULATED_SUN && ownsSimulatedSun) return;
      if (itemId === ITEM_AUTO_WATERING && ownsAutoWatering) return;
      if (itemId === ITEM_ADVANCED_SOIL && ownsAdvancedSoil) return;
      if (itemId === ITEM_SUPER_SOIL && ownsSuperSoil) return;
      setCoins((c) => c - def.price);
      if (itemId === ITEM_GARDEN_GLOVES) setOwnsGardenGloves(true);
      if (itemId === ITEM_SIMULATED_SUN) setOwnsSimulatedSun(true);
      if (itemId === ITEM_AUTO_WATERING) setOwnsAutoWatering(true);
      if (itemId === ITEM_ADVANCED_SOIL) setOwnsAdvancedSoil(true);
      if (itemId === ITEM_SUPER_SOIL) setOwnsSuperSoil(true);
      return;
    }
    setCoins((c) => c - def.price);
    setItemInventory((inv) => ({
      ...inv,
      [itemId]: (inv[itemId] || 0) + 1,
    }));
  };

  const handleUseGardenGloves = () => {
    if (!ownsGardenGloves) return;
    setPendingGloveHarvestBonus((b) => Math.min(99, b + 1));
  };

  const handleActivateSun = () => {
    if (!ownsSimulatedSun) return;
    setSunBoostUntil((prev) => {
      const now = Date.now();
      const base = prev != null && prev > now ? prev : now;
      return base + SUN_BOOST_DURATION_MS;
    });
  };

  const handleActivateWatering = () => {
    if (!ownsAutoWatering || wateringNeedsRefill) return;
    const now = Date.now();
    if (wateringBoostUntil != null && now < wateringBoostUntil) return;
    setWateringBoostUntil(now + WATERING_BOOST_DURATION_MS);
    setWateringNeedsRefill(false);
  };

  const handleUseWaterRefill = () => {
    if ((itemInventory[ITEM_WATER_REFILL] || 0) < 1) return;
    setItemInventory((inv) => {
      const n = (inv[ITEM_WATER_REFILL] || 0) - 1;
      const next = { ...inv };
      if (n <= 0) delete next[ITEM_WATER_REFILL];
      else next[ITEM_WATER_REFILL] = n;
      return next;
    });
    setWateringNeedsRefill(false);
  };

  const handleLayPersistentSoil = (tier: "advanced" | "super", slotIndex: number) => {
    if (tier === "advanced" && !ownsAdvancedSoil) return;
    if (tier === "super" && !ownsSuperSoil) return;
    setPersistentSlotSoil((prev) => {
      const next = [...prev] as PersistentSlotSoil;
      next[slotIndex] = tier;
      return next;
    });
  };

  const handleApplyFertilizer = (slotIndex: number) => {
    if ((itemInventory[ITEM_FERTILIZER] || 0) < 1) return;
    const plant = growingPlants[slotIndex];
    if (!plant) return;
    if (computePlantProgress(plant, growthOpts) >= 100) return;
    const prevUses = plant.fertilizerUses ?? 0;
    if (prevUses >= FERTILIZER_MAX_USES_PER_PLANT) return;

    setItemInventory((inv) => {
      const n = (inv[ITEM_FERTILIZER] || 0) - 1;
      const next = { ...inv };
      if (n <= 0) delete next[ITEM_FERTILIZER];
      else next[ITEM_FERTILIZER] = n;
      return next;
    });

    setGrowingPlants((plants) => {
      const copy = [...plants];
      const p = copy[slotIndex];
      if (p) {
        const { fertilizerMult: _old, ...rest } = p;
        copy[slotIndex] = { ...rest, fertilizerUses: prevUses + 1 };
      }
      return copy;
    });
  };

  const handleApplyThermostat = (slotIndex: number) => {
    if ((itemInventory[ITEM_THERMOSTAT] || 0) < 1) return;
    const plant = growingPlants[slotIndex];
    if (!plant) return;
    if (computePlantProgress(plant, growthOpts) >= 100) return;

    setItemInventory((inv) => {
      const n = (inv[ITEM_THERMOSTAT] || 0) - 1;
      const next = { ...inv };
      if (n <= 0) delete next[ITEM_THERMOSTAT];
      else next[ITEM_THERMOSTAT] = n;
      return next;
    });

    setGrowingPlants((plants) =>
      plants.map((p, i) => {
        if (p == null) return null;
        if (i === slotIndex) return { ...p, growthMult: THERMOSTAT_GROWTH_MULT };
        if (p.growthMult != null && p.growthMult > 1) {
          const { growthMult: _g, ...rest } = p;
          return rest as GrowingPlantSlot;
        }
        return p;
      }),
    );
  };

  const handleUnlockSlot = (price: number) => {
    if (coins >= price && unlockedSlots < 4) {
      setCoins(coins - price);
      setUnlockedSlots(unlockedSlots + 1);
    }
  };

  const handlePlantSeed = (slotIndex: number, seedId: string) => {
    if (seedInventory[seedId] > 0) {
      const newGrowingPlants = [...growingPlants];
      newGrowingPlants[slotIndex] = {
        slotId: slotIndex,
        plantId: seedId,
        plantedAt: Date.now(),
        growDurationMs: getGrowDurationMs(seedId),
      };
      setGrowingPlants(newGrowingPlants);

      setSeedInventory({
        ...seedInventory,
        [seedId]: seedInventory[seedId] - 1,
      });
    }
  };

  const handleShovelPlant = (slotIndex: number) => {
    const plant = growingPlants[slotIndex];
    if (!plant || computePlantProgress(plant, growthOpts) >= 100) return;
    const refund = shovelRefundForSeed(plant.plantId);
    setCoins((c) => c + refund);
    setGrowingPlants((plants) => {
      const next = [...plants];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleHarvestPlant = (slotIndex: number) => {
    const plant = growingPlants[slotIndex];
    if (!plant || computePlantProgress(plant, growthOpts) < 100) return;

    let fruitCount = 1 + pendingGloveHarvestBonus;
    const soilTier =
      persistentSlotSoil[slotIndex] ?? (plant.superSoil ? ("super" as const) : null);
    if (soilTier === "super") fruitCount = Math.round(fruitCount * SUPER_SOIL_HARVEST_MULT);
    else if (soilTier === "advanced") fruitCount = Math.round(fruitCount * ADVANCED_SOIL_HARVEST_MULT);
    fruitCount = Math.max(1, fruitCount);
    setPendingGloveHarvestBonus(0);

    setHarvestedFruits((fruits) => ({
      ...fruits,
      [plant.plantId]: (fruits[plant.plantId] || 0) + fruitCount,
    }));

    setGrowingPlants((plants) => {
      const next = [...plants];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleMoveToExhibition = (slotIndex: number) => {
    const plant = growingPlants[slotIndex];
    if (plant && computePlantProgress(plant, growthOpts) >= 100) {
      setExhibitionPlants((ex) => [...ex, plant.plantId]);

      setGrowingPlants((plants) => {
        const next = [...plants];
        next[slotIndex] = null;
        return next;
      });
    }
  };

  const handleSellFruit = (fruitId: string, price: number) => {
    if (harvestedFruits[fruitId] > 0) {
      setCoins(coins + price);
      setHarvestedFruits({
        ...harvestedFruits,
        [fruitId]: harvestedFruits[fruitId] - 1,
      });
    }
  };

  const modalOpen = showVictory || showDefeat;

  const playingBg = gameState === "playing";

  return (
    <div
      className={`flex h-screen w-full items-center justify-center overflow-hidden ${
        playingBg ? "bg-cover bg-center bg-no-repeat" : "bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300"
      }`}
      style={playingBg ? { backgroundImage: `url(${gameplayBgUrl})` } : undefined}
    >
      {gameState === "menu" && (
        <MainMenu
          onStartGame={handleStartGame}
          onShowRecords={handleShowRecords}
          onShowNurture={handleShowNurture}
          onShowSettings={handleShowSettings}
          coins={coins}
          musicEnabled={settings.musicEnabled}
          onToggleMusic={() => {
            toggleMusic();
          }}
        />
      )}

      {gameState === "playing" && (
        <GameScreen
          score={score}
          roundId={roundId}
          roundSeconds={roundSeconds}
          isModalOpen={modalOpen}
          onScoreDelta={(delta) => setScore((s) => s + delta)}
          onRestartRound={handleRestartRound}
          onBackToMenu={handleBackToMenu}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
        />
      )}

      {gameState === "records" && <RecordsScreen onBackToMenu={handleBackToMenu} />}

      {gameState === "settings" && <SettingsScreen onBackToMenu={handleBackToMenu} />}

      {gameState === "nurture" && (
        <NurtureScreen
          coins={coins}
          unlockedSlots={unlockedSlots}
          growingPlants={growingPlants}
          seedInventory={seedInventory}
          exhibitionPlants={exhibitionPlants}
          harvestedFruits={harvestedFruits}
          itemInventory={itemInventory}
          sunBoostUntil={sunBoostUntil}
          wateringBoostUntil={wateringBoostUntil}
          wateringNeedsRefill={wateringNeedsRefill}
          ownsGardenGloves={ownsGardenGloves}
          ownsSimulatedSun={ownsSimulatedSun}
          ownsAutoWatering={ownsAutoWatering}
          ownsAdvancedSoil={ownsAdvancedSoil}
          ownsSuperSoil={ownsSuperSoil}
          persistentSlotSoil={persistentSlotSoil}
          pendingGloveHarvestBonus={pendingGloveHarvestBonus}
          growthOpts={growthOpts}
          onBackToMenu={handleBackToMenu}
          onBuySeed={handleBuySeed}
          onBuyItem={handleBuyItem}
          onUnlockSlot={handleUnlockSlot}
          onPlantSeed={handlePlantSeed}
          onHarvestPlant={handleHarvestPlant}
          onMoveToExhibition={handleMoveToExhibition}
          onSellFruit={handleSellFruit}
          onShovelPlant={handleShovelPlant}
          onUseGardenGloves={handleUseGardenGloves}
          onActivateSun={handleActivateSun}
          onActivateWatering={handleActivateWatering}
          onUseWaterRefill={handleUseWaterRefill}
          onLayPersistentSoil={handleLayPersistentSoil}
          onApplyFertilizer={handleApplyFertilizer}
          onApplyThermostat={handleApplyThermostat}
        />
      )}

      {showVictory && (
        <VictoryModal
          score={score}
          reward={victoryGold}
          secondsUsed={victorySecondsUsed}
          onPlayAgain={handlePlayAgainFromVictory}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {showDefeat && (
        <DefeatModal
          score={score}
          consolationGold={defeatGold}
          onRetry={handleRetry}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
