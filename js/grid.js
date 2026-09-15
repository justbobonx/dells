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
  this.plan = { n: n, ponds: 0, wolf: false };
  this.tries = 0;
  this.backs = 0;
  this.unique = false;
  this.wolfShown = false;
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

Grid.prototype.pondFits = function (r0, c0, h, w) {
  if (r0 < 0 || c0 < 0 || r0 + h > this.n || c0 + w > this.n) return false;
  for (let r = r0; r < r0 + h; r++) {
    for (let c = c0; c < c0 + w; c++) {
      if (this.cells[r][c].pond || this.cells[r][c].cave) return false;
    }
  }
  return true;
};

Grid.prototype.tryPlaceOnePond = function () {
  const shapes = [
    [2, 2],
    [2, 3],
    [3, 2],
  ];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const h = shape[0];
  const w = shape[1];
  const spots = [];
  for (let r = 0; r <= this.n - h; r++) {
    for (let c = 0; c <= this.n - w; c++) {
      if (this.pondFits(r, c, h, w)) spots.push({ r: r, c: c });
    }
  }
  if (!spots.length) return false;
  const pick = spots[Math.floor(Math.random() * spots.length)];
  for (let r = pick.r; r < pick.r + h; r++) {
    for (let c = pick.c; c < pick.c + w; c++) {
      this.cells[r][c].pond = true;
      this.markHole(this.cells[r][c]);
    }
  }
  return true;
};

Grid.prototype.placePonds = function () {
  this.clearPonds();
  const want = this.plan && this.plan.ponds ? this.plan.ponds : 0;
  for (let i = 0; i < want; i++) {
    if (!this.tryPlaceOnePond()) return false;
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

Grid.prototype.placeCave = function () {
  this.clearCaves();
  if (!this.plan || !this.plan.wolf) return true;
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
  this.wolfShown = false;
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

Grid.prototype.markWolfCheck = function (won) {
  const wolf = this.findWolf();
  this.wolfShown = !!(won && wolf);
  let right = false;
  let wrongs = 0;
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      if (!cell.cave) continue;
      if (cell.guessId === "w") {
        if (cell.wolf) {
          right = true;
          cell.wrong = false;
        } else {
          cell.wrong = true;
          wrongs++;
        }
      } else {
        cell.wrong = false;
      }
      if (!cell.wolf) cell.locked = false;
    }
  }
  if (wolf) wolf.locked = !!(won && right && wrongs === 0);
};

Grid.prototype.checkGuesses = function () {
  let win = true;
  let found = 0;
  let rights = 0;
  let wrongs = 0;
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      if (cell.pond || cell.cave) continue;
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
  const won = win && found === this.n;
  this.markWolfCheck(won);
  return { win: won, rights: rights, wrongs: wrongs };
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
  return {
    n: this.n,
    unique: this.unique,
    wolfShown: !!this.wolfShown,
    plan: this.plan,
    cells: cells,
  };
};

Grid.load = function (data) {
  if (!data || !data.n || !data.cells || data.cells.length !== data.n * data.n) return null;
  const grid = new Grid(data.n);
  grid.unique = !!data.unique;
  grid.wolfShown = !!data.wolfShown;
  grid.plan = data.plan || { n: data.n, ponds: 0, wolf: false };
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
  const reserved2 = {};
  const reserved3 = {};
  let reserved = false;

  function countSize(cap, exact) {
    let count = 0;
    for (let i = 0; i < sizes.length; i++) {
      if (!sizes[i]) continue;
      if (exact && sizes[i] === cap) count++;
      else if (!exact && sizes[i] < cap) count++;
    }
    return count;
  }

  function lockReserved() {
    if (reserved) return;
    reserved = true;
    const twos = [];
    const threes = [];
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] === floor) twos.push(i);
      if (sizes[i] === target) threes.push(i);
    }
    shuffleInPlace(twos);
    shuffleInPlace(threes);
    const keep2 = Math.min(tinyQuota, twos.length);
    for (let i = 0; i < keep2; i++) reserved2[twos[i]] = true;
    const keep3 = Math.max(0, 3 - keep2);
    for (let i = 0; i < threes.length && i < keep3; i++) reserved3[threes[i]] = true;
  }

  function edgesFrom(allow) {
    const out = [];
    for (let i = 0; i < frontier.length; i++) {
      const f = frontier[i];
      if (!allow(f.id, sizes[f.id] || 0)) continue;
      const open = self.freeNeighbors(f.r, f.c);
      for (let k = 0; k < open.length; k++) {
        out.push({ r: open[k].r, c: open[k].c, id: f.id });
      }
    }
    return out;
  }

  function nextOpts() {
    if (countSize(floor, false)) {
      return edgesFrom(function (id, sz) {
        return sz < floor;
      });
    }
    if (countSize(target, false) > tinyQuota) {
      return edgesFrom(function (id, sz) {
        return sz < target;
      });
    }
    lockReserved();
    const rest = edgesFrom(function (id, sz) {
      return !reserved2[id] && !reserved3[id];
    });
    if (rest.length) return rest;
    const grow3 = edgesFrom(function (id) {
      return !!reserved3[id];
    });
    if (grow3.length) return grow3;
    return edgesFrom(function (id) {
      return !!reserved2[id];
    });
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
    const opts = nextOpts();
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

  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i] && sizes[i] < floor) return false;
  }
  return new Solver(this).count(2) === 1;
};

Grid.prototype.dellColor = function (dellId) {
  return DELL_COLORS[((dellId % DELL_COLORS.length) + DELL_COLORS.length) % DELL_COLORS.length];
};

Grid.prototype.rebuild = function (plan) {
  this.plan = plan || this.plan || { n: this.n, ponds: 0, wolf: false };
  this.unique = false;
  this.wolfShown = false;
  this.tries = 0;
  this.backs = 0;
  for (let t = 0; t < UNIQUE_TRIES; t++) {
    this.tries++;
    if (!this.placePonds()) continue;
    if (!this.placeCave()) continue;
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
