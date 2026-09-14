/** Count legal O placements. Stops at `limit` (use 2 for uniqueness). */

function Solver(grid) {
  this.grid = grid;
  this.n = grid.n;
  this.dells = [];
  this.wolfDell = -1;
  for (let r = 0; r < this.n; r++) {
    const row = [];
    for (let c = 0; c < this.n; c++) {
      const cell = grid.at(r, c);
      row.push(cell.dellId);
      if (cell.wolf) this.wolfDell = cell.dellId;
    }
    this.dells.push(row);
  }
}

Solver.prototype.count = function (limit) {
  const cap = limit || 2;
  const n = this.n;
  const dells = this.dells;
  const wolfDell = this.wolfDell;
  const placed = [];
  for (let i = 0; i < n; i++) placed.push(-1);
  let found = 0;

  function wolfConflict(row, col) {
    if (wolfDell < 0) return false;
    const hereWolf = dells[row][col] === wolfDell;
    for (let r = 0; r < row; r++) {
      const c = placed[r];
      if (c < 0) continue;
      if (Math.max(row - r, Math.abs(col - c)) > 2) continue;
      if (hereWolf || dells[r][c] === wolfDell) return true;
    }
    return false;
  }

  function walk(row, prevCol, usedCols, usedDells) {
    if (found >= cap) return;
    if (row === n) {
      found++;
      return;
    }
    for (let col = 0; col < n; col++) {
      if (usedCols & (1 << col)) continue;
      if (prevCol >= 0 && Math.abs(col - prevCol) < 2) continue;
      const dell = dells[row][col];
      if (dell < 0 || usedDells & (1 << dell)) continue;
      if (wolfConflict(row, col)) continue;
      placed[row] = col;
      walk(row + 1, col, usedCols | (1 << col), usedDells | (1 << dell));
      placed[row] = -1;
      if (found >= cap) return;
    }
  }

  walk(0, -1, 0, 0);
  return found;
};
