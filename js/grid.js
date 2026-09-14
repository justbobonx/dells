/** N x N cells. One O per row and column. Colors mark dells. */

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

/** Dummy dells so color separation is visible. Grow from the O cells. */
Grid.prototype.paintDells = function () {
  const n = this.n;
  const seeds = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (this.cells[r][c].spriteId === "o") seeds.push({ r: r, c: c });
    }
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) this.cells[r][c].dellId = -1;
  }
  const frontier = [];
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    this.cells[s.r][s.c].dellId = i;
    frontier.push({ r: s.r, c: s.c, id: i });
  }
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  while (frontier.length) {
    const i = Math.floor(Math.random() * frontier.length);
    const cur = frontier.splice(i, 1)[0];
    for (let d = 0; d < dirs.length; d++) {
      const nr = cur.r + dirs[d][0];
      const nc = cur.c + dirs[d][1];
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
      if (this.cells[nr][nc].dellId !== -1) continue;
      this.cells[nr][nc].dellId = cur.id;
      frontier.push({ r: nr, c: nc, id: cur.id });
    }
  }
};

Grid.prototype.dellColor = function (dellId) {
  return DELL_COLORS[((dellId % DELL_COLORS.length) + DELL_COLORS.length) % DELL_COLORS.length];
};

Grid.prototype.rebuild = function () {
  this.placeOs();
  this.paintDells();
};
