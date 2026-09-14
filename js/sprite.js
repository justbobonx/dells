/** Named drawable. Bitmap path comes later; letters for now. */

function Sprite(id, glyph, color) {
  this.id = id;
  this.glyph = glyph || "";
  this.color = color || "#f4f1e6";
  this.image = null;
}

Sprite.prototype.draw = function (ctx, x, y, size) {
  if (this.image) {
    ctx.drawImage(this.image, x, y, size, size);
    return;
  }
  if (!this.glyph) return;
  ctx.fillStyle = this.color;
  ctx.font = "bold " + Math.floor(size * 0.55) + "px ui-sans-serif, sans-serif";
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

SpriteBank.defaults = function () {
  const bank = new SpriteBank();
  bank.add(new Sprite("o", "O", "#f4f1e6"));
  bank.add(new Sprite("x", "X", "#2a2118"));
  return bank;
};
