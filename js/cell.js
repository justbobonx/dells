/** One board square. spriteId is the hidden solution. guessId is the player mark. */

function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.dellId = 0;
  this.spriteId = null;
  this.guessId = null;
  this.wrong = false;
  this.locked = false;
  this.pond = false;
  this.cave = false;
  this.wolf = false;
  this.bunny = false;
}

Cell.prototype.setSprite = function (id) {
  this.spriteId = id || null;
};

Cell.prototype.clearSprite = function () {
  this.spriteId = null;
};

Cell.prototype.setGuess = function (id) {
  if (this.locked) return;
  this.guessId = id || null;
  this.wrong = false;
};

Cell.prototype.clearGuess = function () {
  if (this.locked) return;
  this.guessId = null;
  this.wrong = false;
};

Cell.prototype.resetMarks = function () {
  this.guessId = null;
  this.wrong = false;
  this.locked = false;
};
