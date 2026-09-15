/** Presentation lookup. Grid stays data. */

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

const CELL_TYPES = {
  grass: {
    glyphColor: "#2a2118",
    tap: true,
  },
  pond: {
    fill: "#0D1E35",
    edge: "#1E6FA9",
    edgeFrac: 0.45,
    tap: false,
  },
  cave: {
    fill: "#2a2a22",
    edge: "#777777",
    edgeFrac: 0.45,
    glyphColor: "#c8c8c8",
    tap: true,
    markO: "w",
  },
  bunny: {
    fill: "#44571E",
    edge: "#A4C85B",
    edgeFrac: 0.45,
    tap: false,
    stand: "b",
  },
};

function Skin() {}

Skin.kind = function (cell) {
  if (cell.specialId) return cell.specialId;
  if (cell.pond) return "pond";
  if (cell.cave) return "cave";
  if (cell.bunny) return "bunny";
  return "grass";
};

Skin.type = function (name) {
  return CELL_TYPES[name] || CELL_TYPES.grass;
};

Skin.dellFill = function (dellId) {
  return DELL_COLORS[((dellId % DELL_COLORS.length) + DELL_COLORS.length) % DELL_COLORS.length];
};

Skin.samePatch = function (grid, cell, row, col) {
  if (row < 0 || col < 0 || row >= grid.n || col >= grid.n) return false;
  const other = grid.at(row, col);
  const a = Skin.kind(cell);
  const b = Skin.kind(other);
  if (a !== "grass") return a === b;
  return b === "grass" && other.dellId === cell.dellId;
};

Skin.dress = function (grid) {
  if (!grid) return;
  for (let r = 0; r < grid.n; r++) {
    for (let c = 0; c < grid.n; c++) {
      const cell = grid.at(r, c);
      const kind = Skin.kind(cell);
      cell.specialId = kind === "grass" ? null : kind;
      cell.look = Skin.type(kind);
      if (kind === "grass") cell.fill = Skin.dellFill(cell.dellId);
      else cell.fill = cell.look.fill;
      const up = Skin.samePatch(grid, cell, r - 1, c);
      const down = Skin.samePatch(grid, cell, r + 1, c);
      const left = Skin.samePatch(grid, cell, r, c - 1);
      const right = Skin.samePatch(grid, cell, r, c + 1);
      cell.round = [!(up || left), !(up || right), !(down || right), !(down || left)];
    }
  }
};
