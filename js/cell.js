/** One board square. spriteId is the hidden solution. guessId is the player mark. */

function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.dellId = 0;
  this.spriteId = null;
  this.guessId = null;
  this.wrong = false;
}

Cell.prototype.setSprite = function (id) {
  this.spriteId = id || null;
};

Cell.prototype.clearSprite = function () {
  this.spriteId = null;
};

Cell.prototype.setGuess = function (id) {
  this.guessId = id || null;
  this.wrong = false;
};

Cell.prototype.clearGuess = function () {
  this.guessId = null;
  this.wrong = false;
};
