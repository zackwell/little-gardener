import { useRef, useState } from "react";
import { MainMenu } from "./components/main-menu";
import { GameScreen } from "./components/game-screen";
import { VictoryModal } from "./components/victory-modal";
import { DefeatModal } from "./components/defeat-modal";
import { RecordsScreen } from "./components/records-screen";
import { NurtureScreen } from "./components/nature-screen";
import { DEFEAT_CONSOLATION_GOLD, goldForSecondsUsed } from "./game-constants";

export default function Component() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "records" | "nurture">("menu");
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(500);
  const [roundId, setRoundId] = useState(0);

  const [victorySecondsUsed, setVictorySecondsUsed] = useState(0);
  const [victoryGold, setVictoryGold] = useState(0);

  const defeatOpenedRef = useRef(false);

  const [unlockedSlots, setUnlockedSlots] = useState(1);
  const [growingPlants, setGrowingPlants] = useState<Array<{ slotId: number; plantId: string; progress: number } | null>>([
    null,
    null,
    null,
    null,
  ]);
  const [seedInventory, setSeedInventory] = useState<{ [key: string]: number }>({});
  const [exhibitionPlants, setExhibitionPlants] = useState<string[]>([]);
  const [harvestedFruits, setHarvestedFruits] = useState<{ [key: string]: number }>({});

  const bumpRound = () => setRoundId((r) => r + 1);

  const handleStartGame = () => {
    setGameState("playing");
    setScore(0);
    setShowVictory(false);
    setShowDefeat(false);
    defeatOpenedRef.current = false;
    bumpRound();
  };

  const handleBackToMenu = () => {
    setGameState("menu");
    setShowVictory(false);
    setShowDefeat(false);
    defeatOpenedRef.current = false;
  };

  const handleShowRecords = () => {
    setGameState("records");
  };

  const handleShowNurture = () => {
    setGameState("nurture");
  };

  const handleVictory = (secondsUsed: number) => {
    const gold = goldForSecondsUsed(secondsUsed);
    setVictorySecondsUsed(secondsUsed);
    setVictoryGold(gold);
    setShowVictory(true);
    setCoins((c) => c + gold);
  };

  const handleDefeat = () => {
    if (defeatOpenedRef.current) return;
    defeatOpenedRef.current = true;
    setShowDefeat(true);
    setCoins((c) => c + DEFEAT_CONSOLATION_GOLD);
  };

  const handleRetry = () => {
    setShowDefeat(false);
    defeatOpenedRef.current = false;
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

  const handleUnlockSlot = (price: number) => {
    if (coins >= price && unlockedSlots < 4) {
      setCoins(coins - price);
      setUnlockedSlots(unlockedSlots + 1);
    }
  };

  const handlePlantSeed = (slotIndex: number, seedId: string) => {
    if (seedInventory[seedId] > 0) {
      const newGrowingPlants = [...growingPlants];
      newGrowingPlants[slotIndex] = { slotId: slotIndex, plantId: seedId, progress: 0 };
      setGrowingPlants(newGrowingPlants);

      setSeedInventory({
        ...seedInventory,
        [seedId]: seedInventory[seedId] - 1,
      });
    }
  };

  const handleHarvestPlant = (slotIndex: number) => {
    const plant = growingPlants[slotIndex];
    if (plant && plant.progress >= 100) {
      setHarvestedFruits((fruits) => ({
        ...fruits,
        [plant.plantId]: (fruits[plant.plantId] || 0) + 1,
      }));

      setGrowingPlants((plants) => {
        const next = [...plants];
        next[slotIndex] = null;
        return next;
      });
    }
  };

  const handleMoveToExhibition = (slotIndex: number) => {
    const plant = growingPlants[slotIndex];
    if (plant && plant.progress >= 100) {
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

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-green-300 via-emerald-200 to-teal-300">
      {gameState === "menu" && (
        <MainMenu onStartGame={handleStartGame} onShowRecords={handleShowRecords} onShowNurture={handleShowNurture} coins={coins} />
      )}

      {gameState === "playing" && (
        <GameScreen
          score={score}
          roundId={roundId}
          isModalOpen={modalOpen}
          onScoreDelta={(delta) => setScore((s) => s + delta)}
          onRestartRound={handleRestartRound}
          onBackToMenu={handleBackToMenu}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
        />
      )}

      {gameState === "records" && <RecordsScreen onBackToMenu={handleBackToMenu} />}

      {gameState === "nurture" && (
        <NurtureScreen
          coins={coins}
          unlockedSlots={unlockedSlots}
          growingPlants={growingPlants}
          seedInventory={seedInventory}
          exhibitionPlants={exhibitionPlants}
          harvestedFruits={harvestedFruits}
          onBackToMenu={handleBackToMenu}
          onBuySeed={handleBuySeed}
          onUnlockSlot={handleUnlockSlot}
          onPlantSeed={handlePlantSeed}
          onHarvestPlant={handleHarvestPlant}
          onMoveToExhibition={handleMoveToExhibition}
          onSellFruit={handleSellFruit}
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
          consolationGold={DEFEAT_CONSOLATION_GOLD}
          onRetry={handleRetry}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
