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
const POND_FILL = "#0D1E35";
const POND_EDGE = "#15537F";
const CAVE_FILL = "#2a2a22";
const CAVE_EDGE = "#777777";

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

function persistBoard() {
  if (!playing || !grid) return;
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
  grid = loaded;
  n = grid.n;
  Save.writeSize(n);
  showBoard();
  return true;
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

function capRadii(w, h, rad) {
  const max = Math.min(w, h) / 2;
  if (typeof rad === "number") return Math.min(Math.max(0, rad), max);
  const out = [];
  for (let i = 0; i < 4; i++) out.push(Math.min(Math.max(0, rad[i] || 0), max));
  return out;
}

function fillRound(x, y, w, h, rad) {
  const r = capRadii(w, h, rad);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, w, h);
}

function strokeRound(x, y, w, h, rad) {
  const r = capRadii(w, h, rad);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    return;
  }
  ctx.strokeRect(x, y, w, h);
}

function samePatch(row, col, cell) {
  if (row < 0 || col < 0 || row >= grid.n || col >= grid.n) return false;
  const other = grid.at(row, col);
  if (cell.pond) return !!other.pond;
  if (cell.cave) return !!other.cave;
  return !other.pond && !other.cave && other.dellId === cell.dellId;
}

function cellRadii(row, col, cell, rad) {
  const up = samePatch(row - 1, col, cell);
  const down = samePatch(row + 1, col, cell);
  const left = samePatch(row, col - 1, cell);
  const right = samePatch(row, col + 1, cell);
  return [
    up || left ? 0 : rad,
    up || right ? 0 : rad,
    down || right ? 0 : rad,
    down || left ? 0 : rad,
  ];
}

function drawSprite(sprite, x, y, s) {
  if (!sprite) return;
  const pad = Math.max(0, Math.floor(s * 0.06));
  sprite.draw(ctx, x + pad, y + pad, Math.max(1, s - pad * 2));
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;

  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const rad = Math.max(4, Math.floor(cellSize * 0.16));
  const checkW = Math.max(2, Math.floor(cellSize * 0.06));
  const waterW = Math.max(1, Math.floor(checkW * 0.45));
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const cell = grid.at(r, c);
      const x = originX + c * cellSize + inset;
      const y = originY + r * cellSize + inset;
      const s = cellSize - inset * 2;
      const corners = cellRadii(r, c, cell, rad);

      if (cell.pond) {
        ctx.fillStyle = POND_FILL;
        fillRound(x, y, s, s, corners);
        ctx.strokeStyle = POND_EDGE;
        ctx.lineWidth = waterW;
        strokeRound(x + 1, y + 1, s - 2, s - 2, corners);
        continue;
      }

      if (cell.cave) {
        ctx.fillStyle = CAVE_FILL;
        fillRound(x, y, s, s, corners);
        ctx.strokeStyle = CAVE_EDGE;
        ctx.lineWidth = waterW;
        strokeRound(x + 1, y + 1, s - 2, s - 2, corners);
        const showWolf = cell.wolf && (grid.wolfShown || cell.guessId === "w");
        const mark = showWolf ? "w" : cell.guessId === "x" ? "xl" : cell.guessId;
        drawSprite(sprites.get(mark), x, y, s);
        if (cell.locked || cell.wrong) {
          ctx.strokeStyle = cell.locked ? "#7dffa3" : "#e23b3b";
          ctx.lineWidth = checkW;
          strokeRound(x + 1, y + 1, s - 2, s - 2, corners);
        }
        continue;
      }

      ctx.fillStyle = grid.dellColor(cell.dellId);
      fillRound(x, y, s, s, corners);

      drawSprite(sprites.get(cell.guessId), x, y, s);

      if (cell.locked || cell.wrong) {
        ctx.strokeStyle = cell.locked ? "#7dffa3" : "#e23b3b";
        ctx.lineWidth = checkW;
        strokeRound(x + 1, y + 1, s - 2, s - 2, corners);
      }
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
  if (cell.pond || cell.locked) return;
  if (!cell.guessId) cell.setGuess("x");
  else cell.setGuess(null);
  paintScore();
  persistBoard();
  draw();
}

function applyDouble(hit) {
  const cell = grid.at(hit.row, hit.col);
  if (cell.pond || cell.locked) return;
  cell.setGuess(cell.cave ? "w" : "o");
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
  if (document.visibilityState === "hidden") persistBoard();
});

window.addEventListener("pagehide", persistBoard);

setLevel(n);
paintScore();
layout();
draw();
