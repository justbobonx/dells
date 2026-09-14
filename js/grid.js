/** N x N cells. One O per row and column. Colors mark dells. */

const MIN_DELL_SIZE = 3;
const DELL_PAINT_TRIES = 40;

const DELL_DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

const DELL_COLORS = [
  "#6b8f4e",
  "#8a6b3f",
  "#4e7a6b",
  "#a08a4a",
  "#6a5a7a",
  "#7a4e4e",
  "#4e6a8a",
  "#7a7a4e",
  "#5a7a5a",
  "#8a5a6a",
  "#4e5a4e",
  "#6b5a3f",
  "#3f6b6b",
  "#8a7a6b",
  "#5a4e6b",
  "#6b6b5a",
  "#4a6b4e",
  "#7a5a4e",
  "#4e5a6b",
  "#5a6b4e",
];

function Grid(n) {
  this.n = n;
  this.cells = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(new Cell(r, c));
    this.cells.push(row);
  }
}

Grid.prototype.at = function (row, col) {
  return this.cells[row][col];
};

Grid.prototype.clearSprites = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) this.cells[r][c].clearSprite();
  }
};

Grid.prototype.setSprite = function (row, col, id) {
  this.cells[row][col].setSprite(id);
};

/**
 * Place one O per row and column.
 * Walk leftover rows and leftover columns; each step picks one of each.
 */
Grid.prototype.placeOs = function () {
  this.clearSprites();
  const rows = [];
  const cols = [];
  for (let i = 0; i < this.n; i++) {
    rows.push(i);
    cols.push(i);
  }
  while (rows.length) {
    const ri = Math.floor(Math.random() * rows.length);
    const ci = Math.floor(Math.random() * cols.length);
    const row = rows.splice(ri, 1)[0];
    const col = cols.splice(ci, 1)[0];
    this.cells[row][col].setSprite("o");
  }
};

Grid.prototype.freeNeighbors = function (row, col) {
  const out = [];
  for (let d = 0; d < DELL_DIRS.length; d++) {
    const nr = row + DELL_DIRS[d][0];
    const nc = col + DELL_DIRS[d][1];
    if (nr < 0 || nc < 0 || nr >= this.n || nc >= this.n) continue;
    if (this.cells[nr][nc].dellId !== -1) continue;
    out.push({ r: nr, c: nc });
  }
  return out;
};

/** Dummy dells. One free neighbor per turn. Hungry dells eat first. */
Grid.prototype.paintDells = function () {
  const minSize = Math.min(MIN_DELL_SIZE, this.n);
  for (let t = 0; t < DELL_PAINT_TRIES; t++) {
    if (this.tryPaintDells(minSize)) return;
  }
  this.tryPaintDells(1);
};

Grid.prototype.tryPaintDells = function (minSize) {
  const n = this.n;
  const seeds = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (this.cells[r][c].spriteId === "o") seeds.push({ r: r, c: c });
    }
  }
  if (!seeds.length) return false;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) this.cells[r][c].dellId = -1;
  }

  const sizes = [];
  const frontier = [];
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    this.cells[s.r][s.c].dellId = i;
    sizes[i] = 1;
    frontier.push({ r: s.r, c: s.c, id: i });
  }

  function growable(list, grid, hungry) {
    const hits = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (hungry && sizes[f.id] >= minSize) continue;
      if (!grid.freeNeighbors(f.r, f.c).length) continue;
      hits.push(i);
    }
    return hits;
  }

  while (true) {
    let hits = growable(frontier, this, true);
    if (!hits.length) hits = growable(frontier, this, false);
    if (!hits.length) break;
    const cur = frontier[hits[Math.floor(Math.random() * hits.length)]];
    const open = this.freeNeighbors(cur.r, cur.c);
    const take = open[Math.floor(Math.random() * open.length)];
    this.cells[take.r][take.c].dellId = cur.id;
    sizes[cur.id]++;
    frontier.push({ r: take.r, c: take.c, id: cur.id });
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (this.cells[r][c].dellId === -1) return false;
    }
  }
  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i] < minSize) return false;
  }
  return true;
};

Grid.prototype.dellColor = function (dellId) {
  return DELL_COLORS[((dellId % DELL_COLORS.length) + DELL_COLORS.length) % DELL_COLORS.length];
};

Grid.prototype.rebuild = function () {
  this.placeOs();
  this.paintDells();
};
