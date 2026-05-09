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
    <div className="panel-90 flex min-h-0 w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white/85 p-3 shadow-2xl backdrop-blur-md ring-1 ring-white/50 sm:bg-white/80 sm:p-6">
      <div className="mb-2 flex min-h-0 shrink-0 items-center justify-between gap-1.5 sm:mb-3 sm:gap-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="shrink-0 rounded-lg bg-green-500 p-2 text-white transition-all duration-300 hover:bg-green-600 active:scale-95 sm:rounded-xl sm:p-2.5"
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0 truncate rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-1 text-white sm:rounded-xl sm:px-4 sm:py-1.5">
            <span className="text-[11px] opacity-95 sm:text-sm">模式</span>
            <span className="ml-1.5 text-xs font-semibold sm:ml-2 sm:text-base">清盘挑战</span>
          </div>
        </div>

        <div className="shrink-0 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-white sm:rounded-xl sm:px-4 sm:py-1.5">
          <span className="text-[11px] opacity-95 sm:text-sm">分数</span>
          <span className="ml-1.5 text-lg font-bold tabular-nums sm:ml-2 sm:text-2xl">{score}</span>
        </div>

        <div className="flex shrink-0 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={`rounded-lg p-2 text-white transition-all duration-300 active:scale-95 sm:rounded-xl sm:p-2.5 ${
              paused ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-500 hover:bg-blue-600"
            }`}
            aria-pressed={paused}
          >
            <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPaused(false);
              onRestartRound();
            }}
            className="rounded-lg bg-green-500 p-2 text-white transition-all duration-300 hover:bg-green-600 active:scale-95 sm:rounded-xl sm:p-2.5"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      <div className="relative mb-3 min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-emerald-400/55 bg-gradient-to-br from-green-50 via-emerald-50/90 to-teal-50/70 p-2 sm:mb-4 sm:rounded-2xl sm:p-3">
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
            className="absolute inset-0 z-20 flex cursor-default flex-col items-center justify-center rounded-[10px] bg-emerald-950/20 backdrop-blur-md backdrop-saturate-50 sm:rounded-xl"
            aria-hidden
          >
            <span className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-emerald-900 shadow-lg ring-1 ring-emerald-200/80">
              已暂停 · 棋盘已遮挡
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between rounded-lg bg-green-50 px-2 py-2 text-xs text-green-700 sm:rounded-xl sm:px-3 sm:py-3 sm:text-base">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span>每局随机新盘；框内和为 10 即消除，直至盘面清空</span>
        </div>
        {paused && <span className="text-amber-600">已暂停</span>}
      </div>
    </div>
  );
}
