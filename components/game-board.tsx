import { useCallback, useEffect, useRef, useState } from "react";
import { ROUND_SECONDS } from "../game-constants";

const COLS = 10;
const ROWS = 16;

type Grid = (number | null)[][];

type Rect = { rMin: number; rMax: number; cMin: number; cMax: number };

function gridDigitSum(g: Grid): number {
  let s = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c] !== null) s += g[r][c]!;
    }
  }
  return s;
}

/** 调整某一格，使全盘数字之和为 10 的倍数（全清的必要条件） */
function fixGridSumDivisibleBy10(g: Grid): Grid {
  const next = g.map((row) => [...row]) as Grid;
  const sum = gridDigitSum(next);
  const need = (10 - (sum % 10)) % 10;
  if (need === 0) return next;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = next[r][c]!;
      for (const nv of [v + need, v + need - 10, v + need + 10]) {
        if (nv >= 1 && nv <= 9) {
          next[r][c] = nv;
          return next;
        }
      }
    }
  }
  return next;
}

function makeGrid(): Grid {
  for (let attempt = 0; attempt < 150; attempt++) {
    const raw = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => 1 + Math.floor(Math.random() * 9)),
    );
    if (gridDigitSum(raw) % 10 === 0) return raw;
  }
  const fallback = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 1 + Math.floor(Math.random() * 9)),
  );
  return fixGridSumDivisibleBy10(fallback);
}

function makeRect(
  a: { r: number; c: number } | null,
  b: { r: number; c: number } | null,
): Rect | null {
  if (!a || !b) return null;
  return {
    rMin: Math.min(a.r, b.r),
    rMax: Math.max(a.r, b.r),
    cMin: Math.min(a.c, b.c),
    cMax: Math.max(a.c, b.c),
  };
}

function rectSum(grid: Grid, rect: Rect): number {
  let s = 0;
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      const v = grid[r][c];
      if (v !== null) s += v;
    }
  }
  return s;
}

function countFilledInRect(grid: Grid, rect: Rect): number {
  let n = 0;
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      if (grid[r][c] !== null) n++;
    }
  }
  return n;
}

function filledCount(grid: Grid): number {
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== null) n++;
    }
  }
  return n;
}

function applyClear(grid: Grid, rect: Rect): { next: Grid; cleared: number } {
  const next = grid.map((row) => [...row]);
  let cleared = 0;
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      if (next[r][c] !== null) {
        next[r][c] = null;
        cleared++;
      }
    }
  }
  return { next, cleared };
}

export interface GameBoardProps {
  roundId: number;
  isPaused: boolean;
  isFrozen: boolean;
  onScoreDelta: (delta: number) => void;
  /** 参数为本局从开局到清盘所经过的秒数（越大表示越慢） */
  onVictory: (secondsUsed: number) => void;
  onDefeat: () => void;
}

export function GameBoard({
  roundId,
  isPaused,
  isFrozen,
  onScoreDelta,
  onVictory,
  onDefeat,
}: GameBoardProps) {
  const [grid, setGrid] = useState<Grid>(() => makeGrid());
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const [gameEnded, setGameEnded] = useState(false);

  const [anchor, setAnchor] = useState<{ r: number; c: number } | null>(null);
  const [corner, setCorner] = useState<{ r: number; c: number } | null>(null);
  const anchorDragRef = useRef<{ r: number; c: number } | null>(null);
  const cornerDragRef = useRef<{ r: number; c: number } | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const [shakeMask, setShakeMask] = useState<boolean[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(false)),
  );

  const defeatSentRef = useRef(false);
  const victorySentRef = useRef(false);
  const gameEndedRef = useRef(gameEnded);
  const isFrozenRef = useRef(isFrozen);
  const isPausedRef = useRef(isPaused);
  gameEndedRef.current = gameEnded;
  isFrozenRef.current = isFrozen;
  isPausedRef.current = isPaused;

  const rect = makeRect(anchor, corner);
  const selectionSum = rect ? rectSum(grid, rect) : 0;

  const onScoreDeltaRef = useRef(onScoreDelta);
  const onVictoryRef = useRef(onVictory);
  const onDefeatRef = useRef(onDefeat);
  onScoreDeltaRef.current = onScoreDelta;
  onVictoryRef.current = onVictory;
  onDefeatRef.current = onDefeat;

  const endDrag = useCallback((commit: boolean) => {
    draggingRef.current = false;
    pointerIdRef.current = null;
    const r = makeRect(anchorDragRef.current, cornerDragRef.current);
    anchorDragRef.current = null;
    cornerDragRef.current = null;
    setAnchor(null);
    setCorner(null);

    if (!commit || !r) return;
    if (gameEndedRef.current || isFrozenRef.current || isPausedRef.current) return;

    const activeGrid = gridRef.current;

    const s = rectSum(activeGrid, r);
    const filled = countFilledInRect(activeGrid, r);

    if (s === 10 && filled > 0) {
      const { next, cleared } = applyClear(activeGrid, r);
      const pts = cleared * 10 + (cleared >= 4 ? 20 : 0);
      setGrid(next);
      gridRef.current = next;
      onScoreDeltaRef.current(pts);
      if (filledCount(next) === 0) {
        setGameEnded(true);
        if (!victorySentRef.current) {
          victorySentRef.current = true;
          const secondsUsed = ROUND_SECONDS - timeLeftRef.current;
          onVictoryRef.current(secondsUsed);
        }
      }
    } else if (filled > 0) {
      setShakeMask(() => {
        const mask = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        for (let row = r.rMin; row <= r.rMax; row++) {
          for (let col = r.cMin; col <= r.cMax; col++) {
            if (activeGrid[row][col] !== null) mask[row][col] = true;
          }
        }
        return mask;
      });
      window.setTimeout(() => {
        setShakeMask(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
      }, 400);
    }
  }, []);

  const handlePointerDown = (r: number, c: number) => (e: React.PointerEvent) => {
    if (gameEnded || isFrozen || isPaused) return;
    e.preventDefault();
    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    anchorDragRef.current = { r, c };
    cornerDragRef.current = { r, c };
    setAnchor({ r, c });
    setCorner({ r, c });

    const move = (ev: PointerEvent) => {
      if (
        !draggingRef.current ||
        ev.pointerId !== pointerIdRef.current ||
        gameEndedRef.current ||
        isFrozenRef.current ||
        isPausedRef.current
      )
        return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!(el instanceof HTMLElement)) return;
      const row = Number(el.dataset.r);
      const col = Number(el.dataset.c);
      if (Number.isNaN(row) || Number.isNaN(col)) return;
      cornerDragRef.current = { r: row, c: col };
      setCorner({ r: row, c: col });
    };
    const up = (ev: PointerEvent) => {
      if (!draggingRef.current || ev.pointerId !== pointerIdRef.current) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      endDrag(true);
    };
    const cancel = (ev: PointerEvent) => {
      if (!draggingRef.current || ev.pointerId !== pointerIdRef.current) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      endDrag(false);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

  useEffect(() => {
    const g = makeGrid();
    setGrid(g);
    gridRef.current = g;
    setTimeLeft(ROUND_SECONDS);
    setGameEnded(false);
    defeatSentRef.current = false;
    victorySentRef.current = false;
    setAnchor(null);
    setCorner(null);
    anchorDragRef.current = null;
    cornerDragRef.current = null;
    setShakeMask(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
  }, [roundId]);

  useEffect(() => {
    if (isPaused || isFrozen || gameEnded) return;
    const t = window.setInterval(() => {
      setTimeLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isPaused, isFrozen, gameEnded]);

  useEffect(() => {
    if (timeLeft === 0 && !gameEnded) {
      setGameEnded(true);
    }
  }, [timeLeft, gameEnded]);

  useEffect(() => {
    if (timeLeft === 0 && gameEnded && !defeatSentRef.current) {
      defeatSentRef.current = true;
      onDefeatRef.current();
    }
  }, [timeLeft, gameEnded]);

  const cellsLeft = filledCount(grid);

  const isInRect = (r: number, c: number) => {
    if (!rect) return false;
    return r >= rect.rMin && r <= rect.rMax && c >= rect.cMin && c <= rect.cMax;
  };

  const inputLocked = gameEnded || isFrozen || isPaused;

  return (
    <div className="flex h-full min-h-0 w-full flex-col touch-none select-none">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 sm:text-sm">
        <div className="rounded-lg bg-white/80 px-2 py-1 shadow-sm sm:px-3 sm:py-1.5">
          框内和：<span className="font-bold tabular-nums text-emerald-700">{rect ? selectionSum : 0}</span>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1 shadow-sm sm:px-3 sm:py-1.5">
          剩余：<span className="font-bold tabular-nums text-emerald-700">{cellsLeft}</span>
        </div>
        <div className="rounded-lg bg-amber-100/90 px-2 py-1 shadow-sm sm:px-3 sm:py-1.5">
          <span className="font-bold tabular-nums text-amber-800">{timeLeft}</span> 秒
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 gap-0.5 [grid-template-columns:repeat(10,minmax(0,1fr))] [grid-template-rows:repeat(16,minmax(0,1fr))] rounded-xl border-2 border-emerald-300/80 bg-emerald-50/50 p-1 sm:gap-1 sm:p-1.5">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const inSel = isInRect(r, c);
            const empty = val === null;
            const shake = shakeMask[r][c];
            return (
              <button
                key={`cell-${r}-${c}`}
                type="button"
                data-r={r}
                data-c={c}
                disabled={inputLocked}
                onPointerDown={handlePointerDown(r, c)}
                className={[
                  "flex min-h-0 min-w-0 items-center justify-center rounded-[5px] text-[clamp(9px,2.4vw,12px)] font-bold tabular-nums transition-transform sm:rounded-md sm:text-[clamp(10px,2.6vw,13px)]",
                  empty
                    ? "cursor-default bg-emerald-100/35 text-transparent shadow-none"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm active:scale-95",
                  !empty && inSel ? "z-[1] scale-[1.02] ring-2 ring-sky-400 ring-offset-1" : "",
                  shake ? "animate-[cell-shake_0.35s_ease]" : "",
                  inputLocked && !empty ? "opacity-70" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {!empty ? val : ""}
              </button>
            );
          }),
        )}
      </div>

      <style>{`
        @keyframes cell-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
