/** One board square. spriteId is hidden truth. guessId is the player mark. */

function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.dellId = 0;
  this.spriteId = null;
  this.guessId = null;
  this.wrong = false;
  this.locked = false;
  this.wolf = false;
  this.specialId = null;
  this.pond = false;
  this.cave = false;
  this.bunny = false;
  this.look = null;
  this.fill = null;
  this.round = [true, true, true, true];
}

Cell.prototype.setSpecial = function (id) {
  this.specialId = id || null;
  this.pond = id === "pond";
  this.cave = id === "cave";
  this.bunny = id === "bunny";
};

Cell.prototype.isHole = function () {
  return this.pond || this.cave || this.bunny || this.dellId === HOLE_DELL;
};

Cell.prototype.canTap = function () {
  const look = this.look || {};
  if (look.tap === false) return false;
  return !this.locked;
};

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

Cell.prototype.capRadii = function (ctx, w, h, rad) {
  const max = Math.min(w, h) / 2;
  if (typeof rad === "number") return Math.min(Math.max(0, rad), max);
  const out = [];
  for (let i = 0; i < 4; i++) out.push(Math.min(Math.max(0, rad[i] || 0), max));
  return out;
};

Cell.prototype.fillRound = function (ctx, x, y, w, h, rad) {
  const r = this.capRadii(ctx, w, h, rad);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, w, h);
};

Cell.prototype.strokeRound = function (ctx, x, y, w, h, rad) {
  const r = this.capRadii(ctx, w, h, rad);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    return;
  }
  ctx.strokeRect(x, y, w, h);
};

Cell.prototype.drawMark = function (ctx, sprites, x, y, s) {
  const look = this.look || {};
  const pad = Math.max(0, Math.floor(s * 0.06));
  const box = Math.max(1, s - pad * 2);
  const px = x + pad;
  const py = y + pad;
  if (look.stand) {
    const stand = sprites.get(look.stand);
    if (stand) stand.draw(ctx, px, py, box);
  }
  const showWolf = this.cave && this.wolf && this.guessId === "o";
  if (this.guessId === "o") {
    const id = look.markO || "o";
    const sprite = sprites.get(id);
    if (sprite) sprite.draw(ctx, px, py, box);
    return;
  }
  if (showWolf) {
    const sprite = sprites.get("w");
    if (sprite) sprite.draw(ctx, px, py, box);
    return;
  }
  if (this.guessId === "x") {
    const g = sprites.get("x");
    if (!g) return;
    ctx.fillStyle = look.glyphColor || g.color || "#2a2118";
    ctx.font = "bold " + Math.floor(box * (g.scale || 0.42)) + "px ui-sans-serif, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.glyph || "X", px + box / 2, py + box / 2 + 1);
  }
};

Cell.prototype.draw = function (ctx, sprites, x, y, s, shown) {
  const look = this.look || {};
  const rad = Math.max(4, Math.floor(s * 0.17));
  const corners = [
    this.round[0] ? rad : 0,
    this.round[1] ? rad : 0,
    this.round[2] ? rad : 0,
    this.round[3] ? rad : 0,
  ];
  ctx.fillStyle = this.fill || look.fill || "#6b8f4e";
  this.fillRound(ctx, x, y, s, s, corners);
  if (look.edge) {
    const checkW = Math.max(2, Math.floor(s * 0.07));
    ctx.strokeStyle = look.edge;
    ctx.lineWidth = Math.max(1, Math.floor(checkW * (look.edgeFrac || 0.45)));
    this.strokeRound(ctx, x + 1, y + 1, s - 2, s - 2, corners);
  }
  if (shown && this.cave && this.wolf && this.guessId !== "o") {
    const pad = Math.max(0, Math.floor(s * 0.06));
    const wolf = sprites.get("w");
    if (wolf) wolf.draw(ctx, x + pad, y + pad, Math.max(1, s - pad * 2));
  }
  this.drawMark(ctx, sprites, x, y, s);
  if (this.locked || this.wrong) {
    ctx.strokeStyle = this.locked ? "#7dffa3" : "#e23b3b";
    ctx.lineWidth = Math.max(2, Math.floor(s * 0.07));
    this.strokeRound(ctx, x + 1, y + 1, s - 2, s - 2, corners);
  }
};
