import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { playSfxClear, playSfxShake } from "../game-audio";
import type { DefeatPayload, VictoryPayload } from "../game-types";
import {
  COLS,
  ROWS,
  applyClear,
  countFilledInRect,
  filledCount,
  hasAnyValidMove,
  makeSolvableGrid,
  rectSum,
  type Grid,
  type Rect,
} from "../game-grid-gen";
import numberCageUrl from "../pics/numbercage.png";

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

export interface GameBoardProps {
  roundId: number;
  roundSeconds: number;
  isPaused: boolean;
  isFrozen: boolean;
  onScoreDelta: (delta: number) => void;
  onVictory: (payload: VictoryPayload) => void;
  onDefeat: (payload: DefeatPayload) => void;
}

export function GameBoard({
  roundId,
  roundSeconds,
  isPaused,
  isFrozen,
  onScoreDelta,
  onVictory,
  onDefeat,
}: GameBoardProps) {
  const [grid, setGrid] = useState<Grid>(() => makeSolvableGrid());
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const [timeLeft, setTimeLeft] = useState(roundSeconds);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const roundSecondsRef = useRef(roundSeconds);
  roundSecondsRef.current = roundSeconds;
  const [gameEnded, setGameEnded] = useState(false);

  const [anchor, setAnchor] = useState<{ r: number; c: number } | null>(null);
  const [corner, setCorner] = useState<{ r: number; c: number } | null>(null);
  const anchorDragRef = useRef<{ r: number; c: number } | null>(null);
  const cornerDragRef = useRef<{ r: number; c: number } | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  /** 棋盘区 DOM，用于测量可用宽高（避免纯 CSS 在部分 WebKit 上把棋盘缩成极小） */
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardPx, setBoardPx] = useState({ w: 0, h: 0 });

  const [shakeMask, setShakeMask] = useState<boolean[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(false)),
  );

  const defeatSentRef = useRef(false);
  const victorySentRef = useRef(false);
  /** 本局累计得分（与父组件同步递增，用于通关上报） */
  const sessionScoreRef = useRef(0);
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
      sessionScoreRef.current += pts;
      onScoreDeltaRef.current(pts);
      playSfxClear();
      if (filledCount(next) === 0) {
        setGameEnded(true);
        if (!victorySentRef.current) {
          victorySentRef.current = true;
          const limit = roundSecondsRef.current;
          const secondsUsed = limit - timeLeftRef.current;
          onVictoryRef.current({
            secondsUsed,
            roundSeconds: limit,
            finalScore: sessionScoreRef.current,
          });
        }
      }
    } else if (filled > 0) {
      playSfxShake();
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
    const g = makeSolvableGrid();
    setGrid(g);
    gridRef.current = g;
    setTimeLeft(roundSeconds);
    setGameEnded(false);
    defeatSentRef.current = false;
    victorySentRef.current = false;
    sessionScoreRef.current = 0;
    setAnchor(null);
    setCorner(null);
    anchorDragRef.current = null;
    cornerDragRef.current = null;
    setShakeMask(Array.from({ length: ROWS }, () => Array(COLS).fill(false)));
  }, [roundId, roundSeconds]);

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
      const payload: DefeatPayload = {
        cellsRemaining: filledCount(gridRef.current),
        roundSeconds: roundSecondsRef.current,
      };
      onDefeatRef.current(payload);
    }
  }, [timeLeft, gameEnded]);

  const cellsLeft = filledCount(grid);

  const deadlock = useMemo(
    () => !gameEnded && cellsLeft > 0 && !hasAnyValidMove(grid),
    [gameEnded, cellsLeft, grid],
  );

  useLayoutEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;

    let rafId = 0;
    /** 放到下一帧再量，避免 RO→setState→布局 同步循环被浏览器判为异常（本地 Chrome 偶发白屏/卡死） */
    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const availW = el.clientWidth;
        const availH = el.clientHeight;
        if (availW < 2 || availH < 2) return;
        const whRatio = COLS / ROWS;
        const w = Math.round(Math.min(availW, availH * whRatio));
        const h = Math.round(w / whRatio);
        setBoardPx((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      });
    };

    scheduleMeasure();
    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [roundId, deadlock]);

  const isInRect = (r: number, c: number) => {
    if (!rect) return false;
    return r >= rect.rMin && r <= rect.rMax && c >= rect.cMin && c <= rect.cMax;
  };

  const inputLocked = gameEnded || isFrozen || isPaused;

  return (
    <div className="flex h-full min-h-0 w-full flex-col touch-none select-none">
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-1.5 text-xs text-emerald-800 sm:mb-3 sm:gap-2 sm:text-sm">
        <div className="rounded-md bg-white/85 px-1.5 py-0.5 shadow-sm sm:rounded-lg sm:px-2.5 sm:py-1">
          框内和：<span className="font-bold tabular-nums text-emerald-700">{rect ? selectionSum : 0}</span>
        </div>
        <div className="rounded-md bg-white/85 px-1.5 py-0.5 shadow-sm sm:rounded-lg sm:px-2.5 sm:py-1">
          剩余：<span className="font-bold tabular-nums text-emerald-700">{cellsLeft}</span>
        </div>
        <div className="rounded-md bg-amber-100/90 px-1.5 py-0.5 shadow-sm sm:rounded-lg sm:px-2.5 sm:py-1">
          <span className="font-bold tabular-nums text-amber-800">{timeLeft}</span> 秒
        </div>
      </div>

      {deadlock && (
        <div className="mb-2 shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm text-amber-900 sm:text-base">
          当前没有能凑成 10 的框选，局面可能已被「拆碎」。请点上方<strong className="mx-1">重新开始本局</strong>
          换一盘（新盘由矩阵块拼成、保证有解，乱消仍可能走进死胡同）。
        </div>
      )}

      {/*
        固定棋盘宽高比；用 ResizeObserver 按「可用区域像素」算最大内接矩形。
        纯 CSS（auto + max-height:100% 等）在部分手机 WebKit 上会把可用高解析得过小，棋盘缩成一团。
      */}
      <div
        ref={boardAreaRef}
        className="flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center"
      >
        <div
          className="grid min-h-0 min-w-0 gap-2 p-1 sm:gap-1.5 sm:p-2"
          style={{
            boxSizing: "border-box",
            width: boardPx.w > 0 ? `${boardPx.w}px` : "100%",
            height: boardPx.h > 0 ? `${boardPx.h}px` : "auto",
            maxWidth: "100%",
            aspectRatio: `${COLS} / ${ROWS}`,
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          }}
        >
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
                  "flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[5px] text-[clamp(11px,2.6vw,14px)] font-bold tabular-nums transition-transform sm:rounded-md sm:text-[clamp(12px,2.8vw,15px)]",
                  empty
                    ? "cursor-default bg-emerald-100/35 text-transparent shadow-none"
                    : "cursor-pointer bg-emerald-600 bg-contain bg-center bg-no-repeat text-white shadow-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] active:scale-95",
                  !empty && inSel ? "z-[1] scale-[1.02] ring-2 ring-sky-300 ring-offset-0" : "",
                  shake ? "animate-[cell-shake_0.35s_ease]" : "",
                  inputLocked && !empty ? "opacity-70" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={!empty ? { backgroundImage: `url(${numberCageUrl})` } : undefined}
              >
                {!empty ? val : ""}
              </button>
            );
          }),
        )}
        </div>
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
