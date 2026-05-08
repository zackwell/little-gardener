/** 10×16 凑十消除：格数与常见同类关卡接近，矩形候选更「挤」，体感更难 */

export const ROWS = 16;
export const COLS = 10;

/**
 * 叶块目标：极少两格叶（全局一眼对子主要来自大块内部的相邻凑十）。
 */
const LEAF_SHARE_PAIR = 0.06;
const LEAF_SHARE_TRIPLE = 0.26;
const LEAF_SHARE_QUAD = 0.36;
const LEAF_SHARE_QUINT = 0.32;

function sampleTargetLeafArea(): 2 | 3 | 4 | 5 {
  const r = Math.random();
  if (r < LEAF_SHARE_PAIR) return 2;
  if (r < LEAF_SHARE_PAIR + LEAF_SHARE_TRIPLE) return 3;
  if (r < LEAF_SHARE_PAIR + LEAF_SHARE_TRIPLE + LEAF_SHARE_QUAD) return 4;
  return 5;
}

export type Grid = (number | null)[][];

export type Rect = { rMin: number; rMax: number; cMin: number; cMax: number };

export function rectSum(grid: Grid, rect: Rect): number {
  let s = 0;
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      const v = grid[r][c];
      if (v !== null) s += v;
    }
  }
  return s;
}

export function countFilledInRect(grid: Grid, rect: Rect): number {
  let n = 0;
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      if (grid[r][c] !== null) n++;
    }
  }
  return n;
}

export function filledCount(grid: Grid): number {
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== null) n++;
    }
  }
  return n;
}

export function applyClear(grid: Grid, rect: Rect): { next: Grid; cleared: number } {
  const next = grid.map((row) => [...row]) as Grid;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 本叶块内一格与「叶外已填」四邻相接且两数之和为 10 → 跨界一眼对消，构造时要避免。
 */
function hasCrossLeafAdjacentSum10(
  grid: Grid,
  r0: number,
  r1: number,
  c0: number,
  c1: number,
): boolean {
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const v = grid[r][c];
      if (v === null) continue;
      const adj: [number, number][] = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      for (const [nr, nc] of adj) {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (nr >= r0 && nr < r1 && nc >= c0 && nc < c1) continue;
        const nv = grid[nr][nc];
        if (nv !== null && v + nv === 10) return true;
      }
    }
  }
  return false;
}

/** 同一叶块内（面积≥3）若出现正交相邻两格和为 10 → 一眼对消；两格叶除外（设计上必须对消）。 */
function hasInternalAdjacentPairSum10(
  grid: Grid,
  r0: number,
  r1: number,
  c0: number,
  c1: number,
): boolean {
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const v = grid[r][c];
      if (v === null) continue;
      if (c + 1 < c1) {
        const rgt = grid[r][c + 1];
        if (rgt !== null && v + rgt === 10) return true;
      }
      if (r + 1 < r1) {
        const dn = grid[r + 1][c];
        if (dn !== null && v + dn === 10) return true;
      }
    }
  }
  return false;
}

function isLeafPlacementOkForAdjacentPair10(
  grid: Grid,
  r0: number,
  r1: number,
  c0: number,
  c1: number,
): boolean {
  if (hasCrossLeafAdjacentSum10(grid, r0, r1, c0, c1)) return false;
  const area = (r1 - r0) * (c1 - c0);
  const internal = hasInternalAdjacentPairSum10(grid, r0, r1, c0, c1);
  if (area >= 3 && internal) return false;
  /** 两格叶必须相邻凑十；若未形成则 multiset/摆放错误 */
  if (area === 2 && !internal) return false;
  return true;
}

function assignDigitsToRect(grid: Grid, r0: number, r1: number, c0: number, c1: number, vals: number[]): void {
  let i = 0;
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      grid[r][c] = vals[i++];
    }
  }
}

function clearRect(grid: Grid, r0: number, r1: number, c0: number, c1: number): void {
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      grid[r][c] = null;
    }
  }
}

function collectRectPositions(r0: number, r1: number, c0: number, c1: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      out.push([r, c]);
    }
  }
  return out;
}

/** 回溯放置时的局部剪枝（已填邻居） */
function placementPartialBad(
  grid: Grid,
  r0: number,
  r1: number,
  c0: number,
  c1: number,
  positions: [number, number][],
  idx: number,
  r: number,
  c: number,
  val: number,
  area: number,
): boolean {
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    const inside = nr >= r0 && nr < r1 && nc >= c0 && nc < c1;
    if (!inside) {
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const nv = grid[nr][nc];
        if (nv !== null && nv + val === 10) return true;
      }
      continue;
    }
    const nv = grid[nr][nc];
    if (nv === null) continue;
    if (area >= 3 && nv + val === 10) return true;
    if (area === 2 && idx === 1 && nv + val !== 10) return true;
  }
  return false;
}

/**
 * 填入叶块：回溯枚举摆放（面积≤5），尽量避免叶内/跨界相邻凑十；
 * 随机 multiset 多轮直至回溯成功或兜底。
 */
function fillLeafAvoidAdjacentPair10(grid: Grid, r0: number, r1: number, c0: number, c1: number): void {
  const positions = collectRectPositions(r0, r1, c0, c1);
  const area = positions.length;

  for (let comp = 0; comp < 72; comp++) {
    const vals = randomDigitsSumming10(area);
    const used = new Array(vals.length).fill(false);

    const dfs = (idx: number): boolean => {
      if (idx === positions.length) {
        return isLeafPlacementOkForAdjacentPair10(grid, r0, r1, c0, c1);
      }
      const [r, c] = positions[idx]!;
      for (let vi = 0; vi < vals.length; vi++) {
        if (used[vi]) continue;
        const val = vals[vi]!;
        if (placementPartialBad(grid, r0, r1, c0, c1, positions, idx, r, c, val, area)) continue;
        grid[r][c] = val;
        used[vi] = true;
        if (dfs(idx + 1)) return true;
        used[vi] = false;
        grid[r][c] = null;
      }
      return false;
    };

    clearRect(grid, r0, r1, c0, c1);
    if (dfs(0)) return;
  }

  clearRect(grid, r0, r1, c0, c1);
  assignDigitsToRect(grid, r0, r1, c0, c1, randomDigitsSumming10(area));
}

/** 长宽比：越接近 1 越「块状」，越大越像细长条（分割时惩罚细长块） */
function elongation(h: number, w: number): number {
  if (h <= 0 || w <= 0) return 999;
  return Math.max(h, w) / Math.min(h, w);
}

/** 随机生成一套「和为 n、共 parts 份、每份 1–9」的拆分 */
function splitRandomComposition(n: number, parts: number): number[] | null {
  if (parts === 1) {
    if (n >= 1 && n <= 9) return [n];
    return null;
  }
  const minFirst = Math.max(1, n - 9 * (parts - 1));
  const maxFirst = Math.min(9, n - (parts - 1));
  if (minFirst > maxFirst) return null;
  const first = minFirst + Math.floor(Math.random() * (maxFirst - minFirst + 1));
  const sub = splitRandomComposition(n - first, parts - 1);
  if (!sub) return null;
  return [first, ...sub];
}

function digitMixScore(digits: number[]): number {
  let ones = 0;
  let twos = 0;
  let mx = 0;
  const uniq = new Set<number>();
  for (const d of digits) {
    if (d === 1) ones++;
    else if (d === 2) twos++;
    if (d > mx) mx = d;
    uniq.add(d);
  }
  const k = digits.length;
  const onePenalty = k >= 5 ? 11 : k >= 4 ? 9 : 6;
  /** 越少 1/2、数字种类越多、最大值越大 → 分数越低（越好） */
  return ones * onePenalty + twos * 4 - mx * 4 - uniq.size * 3;
}

/** 两格凑十：略提高「非 5+5」权重，方便出现 9、8 等大数 */
const PAIRS_SUM_10: ReadonlyArray<readonly [number, number]> = [
  [1, 9],
  [2, 8],
  [3, 7],
  [4, 6],
  [5, 5],
];
const PAIR_CHOICE_WEIGHTS = [3.2, 3.2, 3.2, 3.2, 1.4];

function pickWeightedPair(): readonly [number, number] {
  let r = Math.random() * PAIR_CHOICE_WEIGHTS.reduce((a, b) => a + b, 0);
  for (let i = 0; i < PAIRS_SUM_10.length; i++) {
    r -= PAIR_CHOICE_WEIGHTS[i]!;
    if (r <= 0) return PAIRS_SUM_10[i]!;
  }
  return PAIRS_SUM_10[PAIRS_SUM_10.length - 1]!;
}

function pickFromWeightedPresets(presets: Array<{ nums: number[]; w: number }>): number[] {
  const total = presets.reduce((s, p) => s + p.w, 0);
  let r = Math.random() * total;
  for (const p of presets) {
    r -= p.w;
    if (r <= 0) return shuffle([...p.nums]);
  }
  return shuffle([...presets[presets.length - 1]!.nums]);
}

/** 三格和为 10：偏「不一眼看出」的拆法；顺序会 shuffle，矩形内可错位 */
const TRIPLE_PRESETS: Array<{ nums: [number, number, number]; w: number }> = [
  { nums: [8, 1, 1], w: 7 },
  { nums: [4, 3, 3], w: 7 },
  { nums: [2, 5, 3], w: 7 },
  { nums: [6, 2, 2], w: 6 },
  { nums: [4, 4, 2], w: 6 },
  { nums: [7, 2, 1], w: 4 },
  { nums: [6, 3, 1], w: 4 },
  { nums: [5, 3, 2], w: 5 },
  { nums: [5, 4, 1], w: 3.5 },
  { nums: [2, 3, 5], w: 4 },
  { nums: [2, 2, 6], w: 2.5 },
  { nums: [1, 2, 7], w: 0.35 },
  { nums: [1, 3, 6], w: 0.35 },
  { nums: [1, 4, 5], w: 0.35 },
];

/** 四格：同样偏「不那么顺口」；含常见「难认」2×2 型 1+3+4+2 */
const QUAD_PRESETS: Array<{ nums: [number, number, number, number]; w: number }> = [
  { nums: [1, 3, 4, 2], w: 8 },
  { nums: [4, 2, 2, 2], w: 6 },
  { nums: [3, 3, 2, 2], w: 6 },
  { nums: [5, 2, 2, 1], w: 6 },
  { nums: [5, 3, 1, 1], w: 5 },
  { nums: [4, 3, 2, 1], w: 6 },
  { nums: [6, 2, 1, 1], w: 5 },
  { nums: [4, 4, 1, 1], w: 5 },
  { nums: [7, 1, 1, 1], w: 4 },
  { nums: [3, 2, 3, 2], w: 5 },
  { nums: [2, 2, 3, 3], w: 5 },
  { nums: [6, 1, 2, 1], w: 4 },
  { nums: [2, 4, 2, 2], w: 4 },
  { nums: [1, 2, 3, 4], w: 1.2 },
  { nums: [1, 1, 2, 6], w: 1 },
];

/** 五格 */
const QUINT_PRESETS: Array<{ nums: [number, number, number, number, number]; w: number }> = [
  { nums: [4, 2, 2, 1, 1], w: 6 },
  { nums: [3, 3, 2, 1, 1], w: 6 },
  { nums: [5, 2, 1, 1, 1], w: 5 },
  { nums: [3, 2, 2, 2, 1], w: 6 },
  { nums: [4, 3, 1, 1, 1], w: 5 },
  { nums: [2, 2, 2, 3, 1], w: 5 },
  { nums: [6, 1, 1, 1, 1], w: 4 },
  { nums: [4, 1, 2, 2, 1], w: 5 },
  { nums: [3, 2, 3, 1, 1], w: 5 },
  { nums: [2, 3, 2, 2, 1], w: 5 },
  { nums: [5, 1, 1, 1, 2], w: 4 },
];

/** 将 10 拆成 k 份；2～5 格用语义预设（不易一眼看出）再 shuffle，矩形内顺序错落 */
export function randomDigitsSumming10(k: number): number[] {
  if (k < 2 || k > 10) throw new Error(`randomDigitsSumming10: bad k=${k}`);

  if (k === 2) {
    const pair = pickWeightedPair();
    return shuffle([pair[0], pair[1]]);
  }

  if (k === 3) return pickFromWeightedPresets(TRIPLE_PRESETS);
  if (k === 4) return pickFromWeightedPresets(QUAD_PRESETS);
  if (k === 5) return pickFromWeightedPresets(QUINT_PRESETS);

  const attempts = k >= 6 ? 180 : 96;
  let best: number[] | null = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = splitRandomComposition(10, k);
    if (!res) continue;
    const sc = digitMixScore(res);
    if (sc < bestScore) {
      bestScore = sc;
      best = res;
    }
  }

  if (!best) {
    const fallback = splitRandomComposition(10, k);
    if (!fallback) throw new Error(`randomDigitsSumming10: split failed k=${k}`);
    best = fallback;
  }
  return shuffle(best);
}

type SplitCand = { kind: "h" | "v"; at: number };

function collectSplits(r0: number, r1: number, c0: number, c1: number): SplitCand[] {
  const h = r1 - r0;
  const w = c1 - c0;
  const cands: SplitCand[] = [];
  for (let rr = r0 + 1; rr < r1; rr++) {
    const aTop = (rr - r0) * w;
    const aBot = (r1 - rr) * w;
    if (aTop >= 2 && aBot >= 2) cands.push({ kind: "h", at: rr });
  }
  for (let cc = c0 + 1; cc < c1; cc++) {
    const aLeft = (cc - c0) * h;
    const aRight = (c1 - cc) * h;
    if (aLeft >= 2 && aRight >= 2) cands.push({ kind: "v", at: cc });
  }
  return cands;
}

function childAreas(c: SplitCand, r0: number, r1: number, c0: number, c1: number): [number, number] {
  const h = r1 - r0;
  const w = c1 - c0;
  if (c.kind === "h") {
    return [(c.at - r0) * w, (r1 - c.at) * w];
  }
  return [(c.at - c0) * h, (c1 - c.at) * h];
}

/** 大块（>5 格）必须切开：偏块状、避免一侧过大 */
function chooseSplitLarge(
  r0: number,
  r1: number,
  c0: number,
  c1: number,
  cands: SplitCand[],
): SplitCand {
  function score(c: SplitCand): number {
    const [a1, a2] = childAreas(c, r0, r1, c0, c1);
    let s: number;
    if (c.kind === "h") {
      const e1 = elongation(c.at - r0, c1 - c0);
      const e2 = elongation(r1 - c.at, c1 - c0);
      s = Math.max(e1, e2) * 12 + (e1 + e2) * 0.45;
    } else {
      const e1 = elongation(r1 - r0, c.at - c0);
      const e2 = elongation(r1 - r0, c1 - c.at);
      s = Math.max(e1, e2) * 12 + (e1 + e2) * 0.45;
    }
    if (a1 >= 9 || a2 >= 9) s += 10;
    if (a1 > 6 || a2 > 6) s += 4;
    return s;
  }

  const sorted = [...cands].sort((a, b) => score(a) - score(b));
  const topK = Math.min(6, sorted.length);
  return sorted[Math.floor(Math.random() * topK)]!;
}

/**
 * 当前区域面积与本次抽样「理想叶面积」不一致时，选一刀使子块更接近目标（例如拆出 2+3、2+2）。
 */
function chooseSplitMatchTarget(
  r0: number,
  r1: number,
  c0: number,
  c1: number,
  target: number,
  cands: SplitCand[],
): SplitCand {
  function scoreCand(c: SplitCand): number {
    const [a1, a2] = childAreas(c, r0, r1, c0, c1);
    let sc = Math.abs(a1 - target) + Math.abs(a2 - target);
    if (a1 === target || a2 === target) sc -= 28;
    if (a1 >= 2 && a1 <= 5 && a2 >= 2 && a2 <= 5) sc -= 6;
    if (c.kind === "h") {
      const e1 = elongation(c.at - r0, c1 - c0);
      const e2 = elongation(r1 - c.at, c1 - c0);
      sc += (Math.max(e1, e2) * 12 + (e1 + e2) * 0.45) * 0.22;
    } else {
      const e1 = elongation(r1 - r0, c.at - c0);
      const e2 = elongation(r1 - r0, c1 - c.at);
      sc += (Math.max(e1, e2) * 12 + (e1 + e2) * 0.45) * 0.22;
    }
    return sc;
  }
  const sorted = [...cands].sort((a, b) => scoreCand(a) - scoreCand(b));
  const topK = Math.min(5, sorted.length);
  return sorted[Math.floor(Math.random() * topK)]!;
}

/**
 * 叶块面积 ∈ {2,3,4,5}；按抽样比例决定「本块是否就此填满」还是「再切一刀」。
 * >5 格必须先切，避免一坨格子里拆出十个 1。
 */
function tileRegion(grid: Grid, r0: number, r1: number, c0: number, c1: number): void {
  const h = r1 - r0;
  const w = c1 - c0;
  const area = h * w;

  const splittable = collectSplits(r0, r1, c0, c1);

  if (area > 5) {
    if (splittable.length === 0) {
      throw new Error(`tileRegion: cannot split large region ${area}`);
    }
    const split = chooseSplitLarge(r0, r1, c0, c1, splittable);
    if (split.kind === "h") {
      tileRegion(grid, r0, split.at, c0, c1);
      tileRegion(grid, split.at, r1, c0, c1);
    } else {
      tileRegion(grid, r0, r1, c0, split.at);
      tileRegion(grid, r0, r1, split.at, c1);
    }
    return;
  }

  if (splittable.length === 0) {
    fillLeafAvoidAdjacentPair10(grid, r0, r1, c0, c1);
    return;
  }

  const target = sampleTargetLeafArea();

  if (area === target) {
    fillLeafAvoidAdjacentPair10(grid, r0, r1, c0, c1);
    return;
  }

  const split = chooseSplitMatchTarget(r0, r1, c0, c1, target, splittable);
  if (split.kind === "h") {
    tileRegion(grid, r0, split.at, c0, c1);
    tileRegion(grid, split.at, r1, c0, c1);
  } else {
    tileRegion(grid, r0, r1, c0, split.at);
    tileRegion(grid, r0, r1, split.at, c1);
  }
}

/** 全盘「相邻两格凑十」的边条数上限（正交边各算一次）；超出则重铣一盘 */
const MAX_ADJACENT_PAIR10_EDGES = 8;

function countAdjacentPair10Edges(grid: Grid): number {
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v === null) continue;
      if (c + 1 < COLS) {
        const rgt = grid[r][c + 1];
        if (rgt !== null && v + rgt === 10) n++;
      }
      if (r + 1 < ROWS) {
        const dn = grid[r + 1][c];
        if (dn !== null && v + dn === 10) n++;
      }
    }
  }
  return n;
}

/**
 * 整张盘面由若干轴对齐矩形拼成（递归分割），每块内数字和为 10。
 * 分割时刻意压低细长条，更像矩阵块消除；数字拆分偏向多样组合。
 */
export function makeGuillotineGrid(): Grid {
  for (let attempt = 0; attempt < 28; attempt++) {
    const grid: Grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null as number | null),
    );
    tileRegion(grid, 0, ROWS, 0, COLS);
    if (countAdjacentPair10Edges(grid) <= MAX_ADJACENT_PAIR10_EDGES) return grid;
  }
  const grid: Grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null as number | null),
  );
  tileRegion(grid, 0, ROWS, 0, COLS);
  return grid;
}

/**
 * 先铣刀生成可解底图，再以一定概率压入「须先消中间、再消两侧」的走廊/小块，
 * 使盘面中间挖空后外侧仍能凑 10，并增加先后手顺序感。
 */
export function makeSolvableGrid(): Grid {
  /** 走廊不再使用 4+6 相邻凑十；注入概率压低，减少额外一眼对子 */
  const injectChance = 0.12;
  for (let attempt = 0; attempt < 16; attempt++) {
    const base = makeGuillotineGrid();
    if (Math.random() >= injectChance) return base;

    const g = cloneGrid(base);
    injectOneBlockingPattern(g);
    fixTotalSumMod10(g);

    /** 便宜抽检：少数随机局模拟；失败则重铣一盘再注入 */
    if (randomPlaythroughLikelySolvable(g, 2, 36)) return g;
  }
  return makeGuillotineGrid();
}

export function findValidRects(grid: Grid): Rect[] {
  const out: Rect[] = [];
  for (let r1 = 0; r1 < ROWS; r1++) {
    for (let c1 = 0; c1 < COLS; c1++) {
      for (let r2 = r1; r2 < ROWS; r2++) {
        for (let c2 = c1; c2 < COLS; c2++) {
          const rect: Rect = { rMin: r1, rMax: r2, cMin: c1, cMax: c2 };
          if (rectSum(grid, rect) === 10 && countFilledInRect(grid, rect) > 0) {
            out.push(rect);
          }
        }
      }
    }
  }
  return out;
}

export function hasAnyValidMove(grid: Grid): boolean {
  return findValidRects(grid).length > 0;
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => [...row]) as Grid;
}

function gridDigitSum(g: Grid): number {
  let s = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c] !== null) s += g[r][c]!;
    }
  }
  return s;
}

/** 全盘和需为 10 的倍数才可能最终清空 */
function fixTotalSumMod10(g: Grid): void {
  const sum = gridDigitSum(g);
  const need = (10 - (sum % 10)) % 10;
  if (need === 0) return;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g[r][c] === null) continue;
      const v = g[r][c]!;
      for (const nv of [v + need, v + need - 10, v + need + 10]) {
        if (nv >= 1 && nv <= 9) {
          g[r][c] = nv;
          return;
        }
      }
    }
  }
}

/**
 * 横向/竖向走廊四连：相邻任意两格之和均≠10（避免再塞一对一眼消）。
 * 整体和仍为 20，须配合空格规则分步消，详见玩法。
 */
const CORRIDOR_H: readonly [number, number, number, number] = [1, 4, 2, 3];

/** 2×2：分列消；整框和≠10 */
const BLOCK22_A = [
  [4, 3],
  [6, 7],
] as const;

/** 2×2：四格和为 10，必须一次框 2×2（参考类关卡常见刁钻块） */
const BLOCK22_B = [
  [1, 3],
  [4, 2],
] as const;

function injectOneBlockingPattern(g: Grid): void {
  const roll = Math.random();
  if (roll < 0.34) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 3));
    const c = Math.floor(Math.random() * (COLS - 3));
    for (let k = 0; k < 4; k++) g[r][c + k] = CORRIDOR_H[k]!;
    return;
  }
  if (roll < 0.68) {
    const r = Math.floor(Math.random() * (ROWS - 3));
    const c = 1 + Math.floor(Math.random() * (COLS - 2));
    for (let k = 0; k < 4; k++) g[r + k][c] = CORRIDOR_H[k]!;
    return;
  }
  const r = Math.floor(Math.random() * (ROWS - 1));
  const cc = Math.floor(Math.random() * (COLS - 1));
  const blk = roll < 0.84 ? BLOCK22_A : BLOCK22_B;
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      g[r + dr][cc + dc] = blk[dr]![dc]!;
    }
  }
}

/** 随机贪心模拟若干次，用于注入后筛掉明显无解盘（非完备，只做便宜检测） */
function randomPlaythroughLikelySolvable(g: Grid, trials: number, maxSteps: number): boolean {
  for (let t = 0; t < trials; t++) {
    let x = cloneGrid(g);
    for (let s = 0; s < maxSteps; s++) {
      if (filledCount(x) === 0) return true;
      const rects = findValidRects(x);
      if (rects.length === 0) break;
      const pick = rects[Math.floor(Math.random() * rects.length)]!;
      x = applyClear(x, pick).next;
    }
  }
  return false;
}
