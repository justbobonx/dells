/** Named drawable. Bitmaps are 64x64; glyphs fill in until an image loads. */

const TILE = 32;

function Sprite(id, glyph, color, scale) {
  this.id = id;
  this.glyph = glyph || "";
  this.color = color || "#f4f1e6";
  this.scale = scale || 0.82;
  this.image = null;
  this.tile = TILE;
}

Sprite.prototype.load = function (src, done) {
  const img = new Image();
  const self = this;
  img.onload = function () {
    self.image = img;
    if (done) done(self);
  };
  img.src = src;
  return this;
};

Sprite.prototype.draw = function (ctx, x, y, size) {
  if (this.image) {
    ctx.drawImage(this.image, 0, 0, this.tile, this.tile, x, y, size, size);
    return;
  }
  if (!this.glyph) return;
  ctx.fillStyle = this.color;
  ctx.font = "bold " + Math.floor(size * this.scale) + "px ui-sans-serif, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(this.glyph, x + size / 2, y + size / 2 + 1);
};

function SpriteBank() {
  this.map = {};
}

SpriteBank.prototype.add = function (sprite) {
  this.map[sprite.id] = sprite;
  return sprite;
};

SpriteBank.prototype.get = function (id) {
  return id ? this.map[id] || null : null;
};

SpriteBank.defaults = function (onReady) {
  const bank = new SpriteBank();
  const fox = bank.add(new Sprite("o", "V", "#f4f1e6", 0.82));
  bank.add(new Sprite("w", "W", "#f4f1e6", 0.82));
  bank.add(new Sprite("x", "X", "#2a2118", 0.42));
  fox.load("images/fox.png", onReady);
  return bank;
};
