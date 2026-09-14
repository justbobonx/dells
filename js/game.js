const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elLevel = document.getElementById("level");
const elOs = document.getElementById("os-count");
const elCleared = document.getElementById("score-cleared");
const elRights = document.getElementById("score-rights");
const elWrongs = document.getElementById("score-wrongs");
const btnMinus = document.getElementById("btn-minus");
const btnNew = document.getElementById("btn-new");
const btnPlus = document.getElementById("btn-plus");
const btnCheck = document.getElementById("btn-check");
const btnStart = document.getElementById("btn-start");
const elStart = document.getElementById("start-screen");
const elWin = document.getElementById("win-screen");
const btnWinNew = document.getElementById("btn-win-new");

const sprites = SpriteBank.defaults(function () {
  draw();
});
const playChrome = new PlayChrome();
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
  if (elLevel) elLevel.textContent = String(n);
  return n;
}

function crisp() {
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  crisp();
  const padTop = 56;
  const padBot = 56;
  const pad = 24;
  const usableW = w - pad * 2;
  const usableH = h - padTop - padBot;
  const size = grid ? grid.n : n;
  cellSize = Math.floor(Math.min(usableW / size, usableH / size));
  if (cellSize < 16) cellSize = 16;
  const boardW = size * cellSize;
  const boardH = size * cellSize;
  originX = Math.floor((w - boardW) / 2);
  originY = Math.floor(padTop + (usableH - boardH) / 2);
}

function hideWin() {
  elWin.hidden = true;
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
  if (grid) elOs.textContent = grid.guessOCount() + "/" + grid.n + " Vs";
  else elOs.textContent = "0/" + n + " Vs";
}

function showBoard() {
  hideWin();
  setLevel(n);
  paintScore();
  layout();
  draw();
}

function newBoard() {
  hideWin();
  setLevel(n);
  grid = new Grid(n);
  grid.rebuild();
  persistBoard();
  showBoard();
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

function sameDell(row, col, dellId) {
  if (row < 0 || col < 0 || row >= grid.n || col >= grid.n) return false;
  const other = grid.at(row, col);
  return !other.pond && other.dellId === dellId;
}

function cellRadii(row, col, dellId, rad) {
  const up = sameDell(row - 1, col, dellId);
  const down = sameDell(row + 1, col, dellId);
  const left = sameDell(row, col - 1, dellId);
  const right = sameDell(row, col + 1, dellId);
  return [
    up || left ? 0 : rad,
    up || right ? 0 : rad,
    down || right ? 0 : rad,
    down || left ? 0 : rad,
  ];
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;

  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const rad = Math.max(4, Math.floor(cellSize * 0.16));
  const wolf = grid.findWolf();
  const wolfDell = wolf ? wolf.dellId : -1;
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const cell = grid.at(r, c);
      if (cell.pond) continue;
      const x = originX + c * cellSize + inset;
      const y = originY + r * cellSize + inset;
      const s = cellSize - inset * 2;
      const corners = cellRadii(r, c, cell.dellId, rad);
      ctx.fillStyle = grid.dellColor(cell.dellId);
      fillRound(x, y, s, s, corners);

      const mark = cell.guessId === "o" && cell.dellId === wolfDell ? "w" : cell.guessId;
      const sprite = sprites.get(mark);
      if (sprite) sprite.draw(ctx, x, y, s);

      if (cell.locked || cell.wrong) {
        ctx.strokeStyle = cell.locked ? "#7dffa3" : "#e23b3b";
        ctx.lineWidth = Math.max(2, Math.floor(cellSize * 0.06));
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
  cell.setGuess("o");
  paintScore();
  persistBoard();
  draw();
}

function onBoardPointer(e) {
  if (!playing || !grid || !elWin.hidden) return;
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
  if (!playing || !grid) return;
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
btnMinus.addEventListener("click", function () {
  if (!playing) return;
  setLevel(n - 1);
  newBoard();
});
btnNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnPlus.addEventListener("click", function () {
  if (!playing) return;
  setLevel(n + 1);
  newBoard();
});
btnWinNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnCheck.addEventListener("click", checkBoard);
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
