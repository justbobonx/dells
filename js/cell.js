/** One board square. spriteId is a SpriteBank key, or null. */

function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.dellId = 0;
  this.spriteId = null;
}

Cell.prototype.setSprite = function (id) {
  this.spriteId = id || null;
};

Cell.prototype.clearSprite = function () {
  this.spriteId = null;
};
