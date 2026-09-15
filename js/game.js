const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elOs = document.getElementById("os-count");
const elCleared = document.getElementById("score-cleared");
const elRights = document.getElementById("score-rights");
const elWrongs = document.getElementById("score-wrongs");
const btnMenu = document.getElementById("btn-menu");
const btnReset = document.getElementById("btn-reset");
const btnHint = document.getElementById("btn-hint");
const btnNewMinus = document.getElementById("btn-new-minus");
const btnNew = document.getElementById("btn-new");
const btnNewPlus = document.getElementById("btn-new-plus");
const btnCheck = document.getElementById("btn-check");
const btnStart = document.getElementById("btn-start");
const elStart = document.getElementById("start-screen");
const elMenu = document.getElementById("menu-screen");
const elWin = document.getElementById("win-screen");
const btnWinNew = document.getElementById("btn-win-new");

const sprites = SpriteBank.defaults(function () {
  draw();
});
const playChrome = new PlayChrome();
const planner = new Planner();
const TAP_MS = 280;

let n = Save.readSize();
let grid = null;
let cellSize = 48;
let originX = 0;
let originY = 0;
let tapTimer = 0;
let tapCell = null;
let playing = false;
let score = Save.readScore();

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function setLevel(size) {
  n = clamp(size, 4, 20);
  Save.writeSize(n);
  return n;
}

function crisp() {
  canvas.style.imageRendering = "pixelated";
}

function setSpriteFilter() {
  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const tile = cellSize - inset * 2;
  const dest = Math.max(1, tile - Math.max(0, Math.floor(tile * 0.06)) * 2);
  ctx.imageSmoothingEnabled = dest < TILE;
}

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  crisp();
  const padTop = 52;
  const padBot = 56;
  const gap = 8;
  const usableW = w;
  const usableH = h - padTop - padBot - gap;
  const size = grid ? grid.n : n;
  cellSize = Math.floor(Math.min(usableW / size, usableH / size));
  if (cellSize < 16) cellSize = 16;
  const boardW = size * cellSize;
  originX = Math.floor((w - boardW) / 2);
  originY = padTop + gap;
  setSpriteFilter();
}

function hideWin() {
  elWin.hidden = true;
}

function hideMenu() {
  elMenu.hidden = true;
}

function showMenu() {
  if (!playing) return;
  elMenu.hidden = false;
}

function dress(g) {
  Skin.dress(g || grid);
}

function isClearedGrid(g) {
  if (!g) return false;
  let locked = 0;
  for (let r = 0; r < g.n; r++) {
    for (let c = 0; c < g.n; c++) {
      const cell = g.at(r, c);
      if (cell.spriteId === "o" && cell.locked) locked++;
    }
  }
  return locked === g.n;
}

function persistBoard() {
  if (!playing || !grid) return;
  if (isClearedGrid(grid)) {
    Save.clearBoard();
    return;
  }
  Save.writeBoard(grid.dump());
}

function persistScore() {
  Save.writeScore(score);
}

function paintScore() {
  elCleared.textContent = String(score.cleared);
  elRights.textContent = String(score.rights);
  elWrongs.textContent = String(score.wrongs);
  if (grid) elOs.textContent = grid.guessOCount() + "/" + grid.n;
  else elOs.textContent = "0/" + n;
}

function showBoard() {
  hideWin();
  hideMenu();
  setLevel(n);
  paintScore();
  layout();
  draw();
}

function newBoard() {
  hideWin();
  hideMenu();
  setLevel(n);
  const plan = planner.roll(n);
  grid = new Grid(plan.n);
  grid.rebuild(plan);
  dress(grid);
  persistBoard();
  showBoard();
}

function resetBoard() {
  if (!playing || !grid) return;
  hideWin();
  hideMenu();
  grid.wolfShown = false;
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) grid.at(r, c).resetMarks();
  }
  persistBoard();
  paintScore();
  draw();
}

function giveHint() {
  if (!playing || !grid) return;
}

function restoreBoard() {
  const data = Save.readBoard();
  if (!data) return false;
  const loaded = Grid.load(data);
  if (!loaded) return false;
  if (isClearedGrid(loaded)) {
    Save.clearBoard();
    return false;
  }
  dress(loaded);
  grid = loaded;
  n = grid.n;
  Save.writeSize(n);
  showBoard();
  return true;
}

function showTitle() {
  if (playing) persistBoard();
  playing = false;
  hideWin();
  hideMenu();
  playChrome.leave();
  elStart.hidden = false;
}

function beginPlay() {
  playing = true;
  playChrome.enter().then(function () {
    elStart.hidden = true;
    if (!restoreBoard()) newBoard();
    else {
      layout();
      draw();
    }
  });
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;
  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const s = cellSize - inset * 2;
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const x = originX + c * cellSize + inset;
      const y = originY + r * cellSize + inset;
      grid.at(r, c).draw(ctx, sprites, x, y, s, grid.wolfShown);
    }
  }
}

function cellAtEvent(e) {
  if (!grid) return null;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
  const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
  const col = Math.floor((x - originX) / cellSize);
  const row = Math.floor((y - originY) / cellSize);
  if (row < 0 || col < 0 || row >= grid.n || col >= grid.n) return null;
  return { row: row, col: col };
}

function sameCell(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function applySingle(hit) {
  const cell = grid.at(hit.row, hit.col);
  if (!cell.canTap()) return;
  if (!cell.guessId) cell.setGuess("x");
  else cell.setGuess(null);
  paintScore();
  persistBoard();
  draw();
}

function applyDouble(hit) {
  const cell = grid.at(hit.row, hit.col);
  if (!cell.canTap()) return;
  cell.setGuess("o");
  paintScore();
  persistBoard();
  draw();
}

function menuOpen() {
  return !elMenu.hidden;
}

function onBoardPointer(e) {
  if (!playing || !grid || !elWin.hidden || menuOpen()) return;
  const hit = cellAtEvent(e);
  if (!hit) return;
  e.preventDefault();
  if (tapTimer && sameCell(tapCell, hit)) {
    clearTimeout(tapTimer);
    tapTimer = 0;
    tapCell = null;
    applyDouble(hit);
    return;
  }
  applySingle(hit);
  if (tapTimer) clearTimeout(tapTimer);
  tapCell = hit;
  tapTimer = setTimeout(function () {
    tapTimer = 0;
    tapCell = null;
  }, TAP_MS);
}

function checkBoard() {
  if (!playing || !grid || menuOpen()) return;
  const result = grid.checkGuesses();
  score.rights += result.rights;
  score.wrongs += result.wrongs;
  if (result.win) {
    score.cleared += 1;
    Save.clearBoard();
    elWin.hidden = false;
  } else {
    persistBoard();
  }
  persistScore();
  paintScore();
  draw();
}

btnStart.addEventListener("click", beginPlay);
btnMenu.addEventListener("click", function () {
  if (!playing) return;
  if (menuOpen()) hideMenu();
  else showMenu();
});
btnReset.addEventListener("click", resetBoard);
btnHint.addEventListener("click", function () {
  hideMenu();
  giveHint();
});
btnNewMinus.addEventListener("click", function () {
  if (!playing) return;
  setLevel(n - 1);
  newBoard();
});
btnNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnNewPlus.addEventListener("click", function () {
  if (!playing) return;
  setLevel(n + 1);
  newBoard();
});
btnWinNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnCheck.addEventListener("click", checkBoard);
elMenu.addEventListener("click", function (e) {
  if (e.target === elMenu) hideMenu();
});
canvas.addEventListener("pointerdown", onBoardPointer);

window.addEventListener("resize", function () {
  layout();
  draw();
});

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") showTitle();
});

window.addEventListener("pagehide", showTitle);

setLevel(n);
paintScore();
layout();
draw();
