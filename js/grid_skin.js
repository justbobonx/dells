/** Data-side hooks so marks stay null/o/x and specials have an id. */

Grid.prototype.guessOCount = function () {
  let n = 0;
  for (let r = 0; r < this.n; r++) {
    for (let c = 0; c < this.n; c++) {
      const cell = this.cells[r][c];
      if (cell.guessId === "o" && !cell.cave && !cell.pond && !cell.bunny) n++;
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
      const marked = cell.guessId === "o" || cell.guessId === "w";
      if (marked) {
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

const gridLoad = Grid.load;
Grid.load = function (data) {
  const grid = gridLoad(data);
  if (!grid) return null;
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const cell = grid.at(r, c);
      if (cell.guessId === "w") cell.guessId = "o";
      const kind = cell.pond ? "pond" : cell.cave ? "cave" : cell.bunny ? "bunny" : null;
      cell.setSpecial(kind);
    }
  }
  return grid;
};
