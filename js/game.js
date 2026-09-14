const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elSize = document.getElementById("size");
const btnNew = document.getElementById("btn-new");

const sprites = SpriteBank.defaults();

let n = 8;
let grid = null;
let cellSize = 48;
let originX = 0;
let originY = 0;
let gap = 2;

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

function newBoard() {
  n = readN();
  elSize.value = String(n);
  grid = new Grid(n);
  grid.rebuild();
  layout();
  draw();
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#0e1410";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!grid) return;

  const inset = Math.max(1, Math.floor(cellSize * 0.04));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = grid.at(r, c);
      const x = originX + c * cellSize;
      const y = originY + r * cellSize;
      ctx.fillStyle = grid.dellColor(cell.dellId);
      ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);

      const sprite = sprites.get(cell.spriteId);
      if (sprite) {
        const pad = Math.floor(cellSize * 0.12);
        sprite.draw(ctx, x + pad, y + pad, cellSize - pad * 2);
      }
    }
  }

  ctx.strokeStyle = "rgba(14, 20, 16, 0.35)";
  ctx.lineWidth = gap;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(originX, originY + i * cellSize);
    ctx.lineTo(originX + n * cellSize, originY + i * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX + i * cellSize, originY);
    ctx.lineTo(originX + i * cellSize, originY + n * cellSize);
    ctx.stroke();
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

function onBoardPointer(e) {
  if (!grid) return;
  const hit = cellAtEvent(e);
  if (!hit) return;
  e.preventDefault();
  const cell = grid.at(hit.row, hit.col);
  if (cell.spriteId === "o") return;
  cell.setSprite(cell.spriteId === "x" ? null : "x");
  draw();
}

btnNew.addEventListener("click", newBoard);

elSize.addEventListener("change", newBoard);

canvas.addEventListener("pointerdown", onBoardPointer);

window.addEventListener("resize", function () {
  layout();
  draw();
});

newBoard();
