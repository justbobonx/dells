const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elSize = document.getElementById("size");
const elOs = document.getElementById("os-count");
const elCleared = document.getElementById("score-cleared");
const elRights = document.getElementById("score-rights");
const elWrongs = document.getElementById("score-wrongs");
const btnNew = document.getElementById("btn-new");
const btnCheck = document.getElementById("btn-check");
const btnStart = document.getElementById("btn-start");
const elStart = document.getElementById("start-screen");
const elWin = document.getElementById("win-screen");
const btnWinNew = document.getElementById("btn-win-new");

const sprites = SpriteBank.defaults();
const playChrome = new PlayChrome();
const TAP_MS = 280;

let n = 8;
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

function readN() {
  return clamp(parseInt(elSize.value, 10) || 8, 4, 20);
}

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
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
  if (grid) elOs.textContent = grid.guessOCount() + "/" + grid.n + " Os";
  else elOs.textContent = "0/" + n + " Os";
}

function showBoard() {
  hideWin();
  elSize.value = String(n);
  paintScore();
  layout();
  draw();
}

function newBoard() {
  hideWin();
  n = readN();
  elSize.value = String(n);
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

function fillRound(x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, w, h);
}

function strokeRound(x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    return;
  }
  ctx.strokeRect(x, y, w, h);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;

  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const rad = Math.max(4, Math.floor(cellSize * 0.16));
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const cell = grid.at(r, c);
      const x = originX + c * cellSize + inset;
      const y = originY + r * cellSize + inset;
      const s = cellSize - inset * 2;
      ctx.fillStyle = grid.dellColor(cell.dellId);
      fillRound(x, y, s, s, rad);

      const sprite = sprites.get(cell.guessId);
      if (sprite) {
        const pad = Math.floor(s * 0.12);
        sprite.draw(ctx, x + pad, y + pad, s - pad * 2);
      }

      if (cell.wrong) {
        ctx.strokeStyle = "#e23b3b";
        ctx.lineWidth = Math.max(2, Math.floor(cellSize * 0.06));
        strokeRound(x + 1, y + 1, s - 2, s - 2, rad);
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
  if (!cell.guessId) cell.setGuess("x");
  else cell.setGuess(null);
  paintScore();
  persistBoard();
  draw();
}

function applyDouble(hit) {
  const cell = grid.at(hit.row, hit.col);
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
btnNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnWinNew.addEventListener("click", function () {
  if (!playing) return;
  newBoard();
});
btnCheck.addEventListener("click", checkBoard);
elSize.addEventListener("change", function () {
  if (!playing) return;
  newBoard();
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

paintScore();
layout();
draw();
