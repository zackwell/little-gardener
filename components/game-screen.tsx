import { useState } from "react";
import { Home, Pause, RotateCcw } from "lucide-react";
import type { DefeatPayload, VictoryPayload } from "../game-types";
import { GameBoard } from "./game-board";

export type { DefeatPayload, VictoryPayload };

interface GameScreenProps {
  score: number;
  roundId: number;
  roundSeconds: number;
  isModalOpen: boolean;
  onScoreDelta: (delta: number) => void;
  onRestartRound: () => void;
  onBackToMenu: () => void;
  onVictory: (payload: VictoryPayload) => void;
  onDefeat: (payload: DefeatPayload) => void;
}

export function GameScreen({
  score,
  roundId,
  roundSeconds,
  isModalOpen,
  onScoreDelta,
  onRestartRound,
  onBackToMenu,
  onVictory,
  onDefeat,
}: GameScreenProps) {
  const [paused, setPaused] = useState(false);

  return (
    <div className="panel-90 flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white/85 p-4 shadow-2xl backdrop-blur-md ring-1 ring-white/50 sm:bg-white/80 sm:p-6">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={onBackToMenu}
            className="rounded-xl bg-green-500 p-3 text-white transition-all duration-300 hover:scale-110 hover:bg-green-600"
          >
            <Home className="h-5 w-5" />
          </button>
          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-white sm:px-6">
            <span className="text-sm">模式</span>
            <span className="ml-2 text-lg">清盘挑战</span>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 text-white sm:px-6">
          <span className="text-sm">分数</span>
          <span className="ml-2 text-2xl tabular-nums">{score}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={`rounded-xl p-3 text-white transition-all duration-300 hover:scale-110 ${
              paused ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-500 hover:bg-blue-600"
            }`}
            aria-pressed={paused}
          >
            <Pause className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPaused(false);
              onRestartRound();
            }}
            className="rounded-xl bg-green-500 p-3 text-white transition-all duration-300 hover:scale-110 hover:bg-green-600"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mb-4 min-h-0 flex-1 overflow-hidden rounded-2xl border-4 border-green-300 bg-gradient-to-br from-green-100 to-emerald-100 p-2 sm:p-4">
        <GameBoard
          roundId={roundId}
          roundSeconds={roundSeconds}
          isPaused={paused}
          isFrozen={isModalOpen}
          onScoreDelta={onScoreDelta}
          onVictory={onVictory}
          onDefeat={onDefeat}
        />
        {paused && (
          <div
            className="absolute inset-0 z-20 flex cursor-default flex-col items-center justify-center rounded-xl bg-emerald-950/20 backdrop-blur-md backdrop-saturate-50"
            aria-hidden
          >
            <span className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-emerald-900 shadow-lg ring-1 ring-emerald-200/80">
              已暂停 · 棋盘已遮挡
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between rounded-xl bg-green-50 px-3 py-3 text-sm text-green-700 sm:text-base">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span>每局随机新盘；框内和为 10 即消除，直至盘面清空</span>
        </div>
        {paused && <span className="text-amber-600">已暂停</span>}
      </div>
    </div>
  );
}
