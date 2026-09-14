const SAVE_BOARD = "dells_board";
const SAVE_SCORE = "dells_score";
const SAVE_SIZE = "dells_size";
const DEFAULT_SIZE = 6;

function Save() {}

Save.readScore = function () {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_SCORE) || "null");
    if (!data || typeof data !== "object") return { cleared: 0, rights: 0, wrongs: 0 };
    return {
      cleared: data.cleared | 0,
      rights: data.rights | 0,
      wrongs: data.wrongs | 0,
    };
  } catch (err) {
    return { cleared: 0, rights: 0, wrongs: 0 };
  }
};

Save.writeScore = function (score) {
  try {
    localStorage.setItem(SAVE_SCORE, JSON.stringify(score));
  } catch (err) {}
};

Save.readBoard = function () {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_BOARD) || "null");
    return data && data.n && data.cells ? data : null;
  } catch (err) {
    return null;
  }
};

Save.writeBoard = function (data) {
  try {
    localStorage.setItem(SAVE_BOARD, JSON.stringify(data));
  } catch (err) {}
};

Save.readSize = function () {
  try {
    const n = parseInt(localStorage.getItem(SAVE_SIZE), 10);
    if (n >= 4 && n <= 20) return n;
  } catch (err) {}
  return DEFAULT_SIZE;
};

Save.writeSize = function (n) {
  try {
    localStorage.setItem(SAVE_SIZE, String(n));
  } catch (err) {}
};

Save.clearBoard = function () {
  try {
    localStorage.removeItem(SAVE_BOARD);
  } catch (err) {}
};
