/** N x N cells. One O per row and column. Colors mark dells. */

const MIN_DELL_SIZE = 2;
const DELL_TARGET = 3;
const DELL_PAINT_TRIES = 40;
const PLACE_TRIES = 200;
const UNIQUE_TRIES = 250;
const HOLE_DELL = -2;

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
  this.tries = 0;
  this.backs = 0;
  this.unique = false;
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

Grid.prototype.isHole = function (row, col) {
  return this.cells[row][col].dellId === HOLE_DELL;
};

Grid.prototype.markHole = function (cell) {
  cell.dellId = HOLE_DELL;
  cell.spriteId = null;
};

Grid.prototype.clearSprites = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      this.cells[r][c].clearSprite();
      this.cells[r][c].clearGuess();
    }
  }
};

Grid.prototype.clearPonds = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      if (this.cells[r][c].pond) {
        this.cells[r][c].pond = false;
        this.cells[r][c].dellId = -1;
      }
    }
  }
};

/** 6: none. 7+: half the time a 2x2 or 2x3 (either way). */
Grid.prototype.placePond = function () {
  this.clearPonds();
  if (this.n < 7) return false;
  if (Math.random() >= 0.5) return false;
  const shapes = [
    [2, 2],
    [2, 3],
    [3, 2],
  ];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const h = shape[0];
  const w = shape[1];
  if (h > this.n || w > this.n) return false;
  const r0 = Math.floor(Math.random() * (this.n - h + 1));
  const c0 = Math.floor(Math.random() * (this.n - w + 1));
  for (let r = r0; r < r0 + h; r++) {
    for (let c = c0; c < c0 + w; c++) {
      this.cells[r][c].pond = true;
      this.markHole(this.cells[r][c]);
    }
  }
  return true;
};

Grid.prototype.clearCaves = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      if (cell.cave || cell.wolf) {
        cell.cave = false;
        cell.wolf = false;
        if (!cell.pond) cell.dellId = -1;
      }
    }
  }
};

Grid.prototype.findWolf = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      if (this.cells[r][c].wolf) return this.cells[r][c];
    }
  }
  return null;
};

Grid.prototype.caveGrowOpts = function (body) {
  const seen = {};
  const out = [];
  for (let i = 0; i < body.length; i++) {
    for (let d = 0; d < DELL_DIRS.length; d++) {
      const nr = body[i].r + DELL_DIRS[d][0];
      const nc = body[i].c + DELL_DIRS[d][1];
      if (nr < 0 || nc < 0 || nr >= this.n || nc >= this.n) continue;
      const key = nr + "," + nc;
      if (seen[key]) continue;
      const cell = this.cells[nr][nc];
      if (cell.pond || cell.cave) continue;
      seen[key] = true;
      out.push({ r: nr, c: nc });
    }
  }
  return out;
};

/** 8+: half the time. 2-4 cave tiles from an inner seed. One hidden wolf inside. */
Grid.prototype.placeCave = function () {
  this.clearCaves();
  if (this.n < 8) return false;
  if (Math.random() >= 0.5) return false;
  const seeds = [];
  for (let r = 2; r < this.n - 2; r++) {
    for (let c = 2; c < this.n - 2; c++) {
      if (!this.cells[r][c].pond) seeds.push({ r: r, c: c });
    }
  }
  if (!seeds.length) return false;
  const start = seeds[Math.floor(Math.random() * seeds.length)];
  const want = 2 + Math.floor(Math.random() * 3);
  const body = [start];
  const seedCell = this.cells[start.r][start.c];
  seedCell.cave = true;
  this.markHole(seedCell);
  while (body.length < want) {
    const opts = this.caveGrowOpts(body);
    if (!opts.length) break;
    const pick = opts[Math.floor(Math.random() * opts.length)];
    const cell = this.cells[pick.r][pick.c];
    cell.cave = true;
    this.markHole(cell);
    body.push(pick);
  }
  if (body.length < 2) {
    this.clearCaves();
    return false;
  }
  const wolfAt = body[Math.floor(Math.random() * body.length)];
  this.cells[wolfAt.r][wolfAt.c].wolf = true;
  return true;
};

Grid.prototype.nearWolf = function (row, col) {
  const wolf = this.findWolf();
  if (!wolf) return false;
  return Math.max(Math.abs(row - wolf.row), Math.abs(col - wolf.col)) <= 1;
};

Grid.prototype.setSprite = function (row, col, id) {
  this.cells[row][col].setSprite(id);
};

Grid.prototype.clearGuesses = function () {
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) this.cells[r][c].clearGuess();
  }
};

Grid.prototype.guessOCount = function () {
  let n = 0;
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      if (this.cells[r][c].guessId === "o") n++;
    }
  }
  return n;
};

Grid.prototype.checkGuesses = function () {
  let win = true;
  let found = 0;
  let rights = 0;
  let wrongs = 0;
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      if (cell.pond || cell.cave) {
        cell.wrong = false;
        continue;
      }
      if (cell.guessId === "o") {
        if (cell.spriteId === "o") {
          found++;
          if (!cell.locked) rights++;
          cell.locked = true;
          cell.wrong = false;
        } else {
          cell.wrong = true;
          win = false;
          wrongs++;
        }
      } else {
        cell.wrong = false;
        if (cell.spriteId === "o") win = false;
      }
    }
  }
  return { win: win && found === this.n, rights: rights, wrongs: wrongs };
};

Grid.prototype.dump = function () {
  const cells = [];
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      cells.push({
        dellId: cell.dellId,
        spriteId: cell.spriteId,
        guessId: cell.guessId,
        wrong: !!cell.wrong,
        locked: !!cell.locked,
        pond: !!cell.pond,
        cave: !!cell.cave,
        wolf: !!cell.wolf,
      });
    }
  }
  return { n: this.n, unique: this.unique, cells: cells };
};

Grid.load = function (data) {
  if (!data || !data.n || !data.cells || data.cells.length !== data.n * data.n) return null;
  const grid = new Grid(data.n);
  grid.unique = !!data.unique;
  let i = 0;
  for (let r = 0; r < data.n; r++) {
    for (let c = 0; c < data.n; c++) {
      const src = data.cells[i++];
      const cell = grid.cells[r][c];
      cell.dellId = src.dellId;
      cell.spriteId = src.spriteId || null;
      cell.guessId = src.guessId || null;
      cell.wrong = !!src.wrong;
      cell.locked = !!src.locked;
      cell.pond = !!src.pond;
      cell.cave = !!src.cave || (!!src.wolf && !src.pond);
      cell.wolf = !!src.wolf;
      if (cell.pond || cell.cave) {
        cell.dellId = HOLE_DELL;
        cell.spriteId = null;
      }
    }
  }
  return grid;
};

Grid.prototype.hasNearbyO = function (row, col) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || c < 0 || r >= this.n || c >= this.n) continue;
      if (this.cells[r][c].spriteId === "o") return true;
    }
  }
  return false;
};

Grid.prototype.placeOs = function () {
  for (let t = 0; t < PLACE_TRIES; t++) {
    if (this.tryPlaceOs()) return true;
  }
  return false;
};

Grid.prototype.tryPlaceOs = function () {
  this.clearSprites();
  const rows = [];
  const cols = [];
  for (let i = 0; i < this.n; i++) {
    rows.push(i);
    cols.push(i);
  }
  while (rows.length) {
    const opts = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < cols.length; j++) {
        if (this.isHole(rows[i], cols[j])) continue;
        if (this.nearWolf(rows[i], cols[j])) continue;
        if (!this.hasNearbyO(rows[i], cols[j])) {
          opts.push({ i: i, j: j });
        }
      }
    }
    if (!opts.length) return false;
    const pick = opts[Math.floor(Math.random() * opts.length)];
    const row = rows.splice(pick.i, 1)[0];
    const col = cols.splice(pick.j, 1)[0];
    this.cells[row][col].setSprite("o");
  }
  return true;
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

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

Grid.prototype.paintDells = function () {
  for (let t = 0; t < DELL_PAINT_TRIES; t++) {
    if (this.tryPaintDells()) return true;
  }
  return false;
};

Grid.prototype.tryPaintDells = function () {
  const n = this.n;
  const floor = Math.min(MIN_DELL_SIZE, n);
  const target = Math.min(DELL_TARGET, n);
  const tinyQuota = Math.random() < 0.5 ? 2 : 1;
  const seeds = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = this.cells[r][c];
      if (cell.spriteId === "o" && cell.dellId !== HOLE_DELL) seeds.push({ r: r, c: c });
    }
  }
  if (!seeds.length) return false;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = this.cells[r][c];
      cell.dellId = cell.pond || cell.cave ? HOLE_DELL : -1;
    }
  }

  const sizes = [];
  const frontier = [];
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i];
    if (this.cells[s.r][s.c].dellId === HOLE_DELL) continue;
    this.cells[s.r][s.c].dellId = i;
    sizes[i] = 1;
    frontier.push({ r: s.r, c: s.c, id: i });
  }

  const self = this;

  function shortCount() {
    let count = 0;
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] && sizes[i] < target) count++;
    }
    return count;
  }

  function edges(hungry) {
    const shorts = shortCount();
    const out = [];
    for (let i = 0; i < frontier.length; i++) {
      const f = frontier[i];
      const sz = sizes[f.id] || 0;
      if (hungry) {
        if (sz >= target) continue;
        if (sz >= floor && shorts <= tinyQuota) continue;
      }
      const open = self.freeNeighbors(f.r, f.c);
      for (let k = 0; k < open.length; k++) {
        out.push({ r: open[k].r, c: open[k].c, id: f.id });
      }
    }
    return out;
  }

  function unclaimed() {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (self.cells[r][c].dellId === -1) return true;
      }
    }
    return false;
  }

  while (unclaimed()) {
    let opts = edges(true);
    if (!opts.length) opts = edges(false);
    if (!opts.length) return false;
    shuffleInPlace(opts);
    let placed = false;
    for (let i = 0; i < opts.length; i++) {
      const e = opts[i];
      if (this.cells[e.r][e.c].dellId !== -1) continue;
      this.cells[e.r][e.c].dellId = e.id;
      if (new Solver(this).count(2) === 1) {
        sizes[e.id]++;
        frontier.push({ r: e.r, c: e.c, id: e.id });
        placed = true;
        break;
      }
      this.cells[e.r][e.c].dellId = -1;
      this.backs++;
    }
    if (!placed) return false;
  }

  let tinies = 0;
  for (let i = 0; i < sizes.length; i++) {
    if (!sizes[i]) continue;
    if (sizes[i] < floor) return false;
    if (sizes[i] < target) tinies++;
  }
  if (tinies > tinyQuota) return false;
  return new Solver(this).count(2) === 1;
};

Grid.prototype.dellColor = function (dellId) {
  return DELL_COLORS[((dellId % DELL_COLORS.length) + DELL_COLORS.length) % DELL_COLORS.length];
};

Grid.prototype.rebuild = function () {
  this.unique = false;
  this.tries = 0;
  this.backs = 0;
  for (let t = 0; t < UNIQUE_TRIES; t++) {
    this.tries++;
    this.placePond();
    this.placeCave();
    this.placeOs();
    this.paintDells();
    if (new Solver(this).count(2) === 1) {
      this.unique = true;
      this.clearGuesses();
      return true;
    }
  }
  return false;
};
