/** Count legal O placements. Stops at `limit` (use 2 for uniqueness). */

function Solver(grid) {
  this.grid = grid;
  this.n = grid.n;
  this.dells = [];
  this.blocked = [];
  for (let r = 0; r < this.n; r++) {
    const row = [];
    const block = [];
    for (let c = 0; c < this.n; c++) {
      const cell = grid.at(r, c);
      row.push(cell.dellId);
      block.push(!!cell.pond || !!cell.bunny || !!cell.wolf || grid.nearWolf(r, c));
    }
    this.dells.push(row);
    this.blocked.push(block);
  }
}

Solver.prototype.count = function (limit) {
  const cap = limit || 2;
  const n = this.n;
  const dells = this.dells;
  const blocked = this.blocked;
  let found = 0;

  function walk(row, prevCol, usedCols, usedDells) {
    if (found >= cap) return;
    if (row === n) {
      found++;
      return;
    }
    for (let col = 0; col < n; col++) {
      if (blocked[row][col]) continue;
      if (usedCols & (1 << col)) continue;
      if (prevCol >= 0 && Math.abs(col - prevCol) < 2) continue;
      const dell = dells[row][col];
      if (dell < 0 || usedDells & (1 << dell)) continue;
      walk(row + 1, col, usedCols | (1 << col), usedDells | (1 << dell));
      if (found >= cap) return;
    }
  }

  walk(0, -1, 0, 0);
  return found;
};
