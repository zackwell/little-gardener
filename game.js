
(() => {
  const COLS = 10;
  const ROWS = 16;
  const ROUND_SECONDS = 120;

  const boardEl = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const sumEl = document.getElementById("sum");
  const timeEl = document.getElementById("time");
  const restartBtn = document.getElementById("restart");
  const overlayEl = document.getElementById("overlay");
  const overlayTitleEl = document.getElementById("overlay-title");
  const finalScoreEl = document.getElementById("final-score");
  const overlayRestartBtn = document.getElementById("overlay-restart");

  /** @type {{ value: number | null, el: HTMLDivElement }[][]} */
  let grid = [];
  let score = 0;
  let timeLeft = ROUND_SECONDS;
  let timerId = 0;
  let gameEnded = false;

  /** @type {{ r: number, c: number } | null} */
  let anchor = null;
  /** @type {{ r: number, c: number } | null} */
  let corner = null;
  let dragging = false;
  let pointerId = null;

  function randDigit() {
    return 1 + Math.floor(Math.random() * 9);
  }

  /**
   * @param {{ r: number, c: number } | null} a
   * @param {{ r: number, c: number } | null} b
   */
  function makeRect(a, b) {
    if (!a || !b) return null;
    return {
      rMin: Math.min(a.r, b.r),
      rMax: Math.max(a.r, b.r),
      cMin: Math.min(a.c, b.c),
      cMax: Math.max(a.c, b.c),
    };
  }

  /**
   * @param {{ rMin: number, rMax: number, cMin: number, cMax: number }} rect
   */
  function rectSum(rect) {
    let s = 0;
    for (let r = rect.rMin; r <= rect.rMax; r++) {
      for (let c = rect.cMin; c <= rect.cMax; c++) {
        const v = grid[r][c].value;
        if (v !== null) s += v;
      }
    }
    return s;
  }

  /**
   * @param {{ rMin: number, rMax: number, cMin: number, cMax: number }} rect
   */
  function countFilledInRect(rect) {
    let n = 0;
    for (let r = rect.rMin; r <= rect.rMax; r++) {
      for (let c = rect.cMin; c <= rect.cMax; c++) {
        if (grid[r][c].value !== null) n++;
      }
    }
    return n;
  }

  function filledCount() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].value !== null) n++;
      }
    }
    return n;
  }

  function gridDigitSum() {
    let s = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c].value !== null) s += grid[r][c].value;
      }
    }
    return s;
  }

  /** 使全盘数字和为 10 的倍数，避免「全清在数学上不可能」的常见情况 */
  function fixGridSumDivisibleBy10() {
    const need = (10 - (gridDigitSum() % 10)) % 10;
    if (need === 0) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c].value;
        for (const nv of [v + need, v + need - 10, v + need + 10]) {
          if (nv >= 1 && nv <= 9) {
            grid[r][c].value = nv;
            grid[r][c].el.textContent = String(nv);
            return;
          }
        }
      }
    }
  }

  function clearRectVisual() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c].el.classList.remove("in-rect");
      }
    }
    sumEl.textContent = "0";
  }

  function updateRectVisual() {
    clearRectVisual();
    const rect = makeRect(anchor, corner);
    if (!rect) return;
    for (let r = rect.rMin; r <= rect.rMax; r++) {
      for (let c = rect.cMin; c <= rect.cMax; c++) {
        grid[r][c].el.classList.add("in-rect");
      }
    }
    sumEl.textContent = String(rectSum(rect));
  }

  /**
   * @param {{ rMin: number, rMax: number, cMin: number, cMax: number }} rect
   */
  function clearCellsInRect(rect) {
    const cleared = countFilledInRect(rect);
    const pts = cleared * 10 + (cleared >= 4 ? 20 : 0);
    score += pts;
    scoreEl.textContent = String(score);

    for (let r = rect.rMin; r <= rect.rMax; r++) {
      for (let c = rect.cMin; c <= rect.cMax; c++) {
        const cell = grid[r][c];
        if (cell.value === null) continue;
        cell.value = null;
        cell.el.textContent = "";
        cell.el.classList.remove("in-rect");
        cell.el.classList.add("cell--empty");
        cell.el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0.35, transform: "scale(0.92)" }, { opacity: 1, transform: "scale(1)" }], {
          duration: 280,
          easing: "ease-out",
        });
      }
    }

    if (filledCount() === 0) {
      finishGame(true);
    }
  }

  function finishGame(won) {
    if (gameEnded) return;
    gameEnded = true;
    stopTimer();
    removeDocPointerListeners();
    dragging = false;
    pointerId = null;
    anchor = null;
    corner = null;
    clearRectVisual();
    overlayTitleEl.textContent = won ? "全部清空！" : "时间到";
    finalScoreEl.textContent = String(score);
    overlayEl.classList.remove("hidden");
  }

  function endDrag(commit) {
    dragging = false;
    pointerId = null;

    const rect = makeRect(anchor, corner);
    anchor = null;
    corner = null;

    if (commit && rect) {
      const s = rectSum(rect);
      if (s === 10 && countFilledInRect(rect) > 0) {
        clearCellsInRect(rect);
      } else if (countFilledInRect(rect) > 0) {
        for (let r = rect.rMin; r <= rect.rMax; r++) {
          for (let c = rect.cMin; c <= rect.cMax; c++) {
            if (grid[r][c].value !== null) {
              grid[r][c].el.classList.add("shake");
              setTimeout(() => grid[r][c].el.classList.remove("shake"), 400);
            }
          }
        }
      }
    }
    clearRectVisual();
  }

  function removeDocPointerListeners() {
    window.removeEventListener("pointermove", onDocPointerMove);
    window.removeEventListener("pointerup", onDocPointerUp);
    window.removeEventListener("pointercancel", onDocPointerCancel);
  }

  function onDocPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId || gameEnded || timeLeft <= 0) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!(el instanceof HTMLElement)) return;
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    corner = { r, c };
    updateRectVisual();
  }

  function onDocPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    removeDocPointerListeners();
    endDrag(true);
  }

  function onDocPointerCancel(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    removeDocPointerListeners();
    endDrag(false);
  }

  function handlePointerDown(e) {
    if (gameEnded || timeLeft <= 0) return;
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    if (Number.isNaN(r) || Number.isNaN(c)) return;

    dragging = true;
    pointerId = e.pointerId;
    anchor = { r, c };
    corner = { r, c };
    updateRectVisual();

    window.addEventListener("pointermove", onDocPointerMove);
    window.addEventListener("pointerup", onDocPointerUp);
    window.addEventListener("pointercancel", onDocPointerCancel);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
    }
  }

  function tick() {
    timeLeft -= 1;
    timeEl.textContent = String(Math.max(0, timeLeft));
    if (timeLeft <= 0) {
      finishGame(false);
    }
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const v = randDigit();
        const el = document.createElement("div");
        el.className = "cell";
        el.textContent = String(v);
        el.dataset.r = String(r);
        el.dataset.c = String(c);
        el.addEventListener("pointerdown", handlePointerDown);
        boardEl.appendChild(el);
        row.push({ value: v, el });
      }
      grid.push(row);
    }
    fixGridSumDivisibleBy10();
  }

  function resetGame() {
    removeDocPointerListeners();
    stopTimer();
    gameEnded = false;
    score = 0;
    scoreEl.textContent = "0";
    timeLeft = ROUND_SECONDS;
    timeEl.textContent = String(timeLeft);
    sumEl.textContent = "0";
    overlayEl.classList.add("hidden");
    overlayTitleEl.textContent = "时间到";
    anchor = null;
    corner = null;
    dragging = false;
    buildBoard();
    timerId = window.setInterval(tick, 1000);
  }

  restartBtn.addEventListener("click", resetGame);
  overlayRestartBtn.addEventListener("click", resetGame);

  resetGame();
})();
