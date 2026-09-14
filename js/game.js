const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elSize = document.getElementById("size");
const elBacks = document.getElementById("backs");
const btnNew = document.getElementById("btn-new");
const btnCheck = document.getElementById("btn-check");
const elWin = document.getElementById("win-screen");
const btnWinNew = document.getElementById("btn-win-new");

const sprites = SpriteBank.defaults();
const TAP_MS = 280;

let n = 8;
let grid = null;
let cellSize = 48;
let originX = 0;
let originY = 0;
let tapTimer = 0;
let tapCell = null;

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
  const pad = 24;
  const usableW = w - pad * 2;
  const usableH = h - padTop - pad;
  cellSize = Math.floor(Math.min(usableW / n, usableH / n));
  if (cellSize < 16) cellSize = 16;
  const boardW = n * cellSize;
  const boardH = n * cellSize;
  originX = Math.floor((w - boardW) / 2);
  originY = Math.floor(padTop + (usableH - boardH) / 2);
}

function hideWin() {
  elWin.hidden = true;
}

function newBoard() {
  hideWin();
  n = readN();
  elSize.value = String(n);
  grid = new Grid(n);
  grid.rebuild();
  elBacks.textContent = String(grid.backs);
  elBacks.style.color = grid.unique ? "#7dffb3" : "#ff6b6b";
  layout();
  draw();
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
  ctx.fillStyle = "#0e1410";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;

  const inset = Math.max(1, Math.floor(cellSize * 0.06));
  const rad = Math.max(4, Math.floor(cellSize * 0.16));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
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
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
  const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
  const col = Math.floor((x - originX) / cellSize);
  const row = Math.floor((y - originY) / cellSize);
  if (row < 0 || col < 0 || row >= n || col >= n) return null;
  return { row: row, col: col };
}

function sameCell(a, b) {
  return a && b && a.row === b.row && a.col === b.col;
}

function applySingle(hit) {
  const cell = grid.at(hit.row, hit.col);
  if (!cell.guessId) cell.setGuess("x");
  else cell.setGuess(null);
  draw();
}

function applyDouble(hit) {
  const cell = grid.at(hit.row, hit.col);
  cell.setGuess("o");
  draw();
}

function onBoardPointer(e) {
  if (!grid || !elWin.hidden) return;
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
  if (tapTimer) clearTimeout(tapTimer);
  tapCell = hit;
  tapTimer = setTimeout(function () {
    tapTimer = 0;
    applySingle(hit);
    tapCell = null;
  }, TAP_MS);
}

function checkBoard() {
  if (!grid) return;
  const win = grid.checkGuesses();
  draw();
  if (win) elWin.hidden = false;
}

btnNew.addEventListener("click", newBoard);
btnWinNew.addEventListener("click", newBoard);
btnCheck.addEventListener("click", checkBoard);
elSize.addEventListener("change", newBoard);
canvas.addEventListener("pointerdown", onBoardPointer);

window.addEventListener("resize", function () {
  layout();
  draw();
});

newBoard();
