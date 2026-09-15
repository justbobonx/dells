# foxes

A Star Battle–style puzzle in a field. Place foxes so each row, each column, and each colored region (a dell) has exactly one. Foxes will not sit on each other’s hip — no two foxes share an edge or a corner.

Larger boards grow extra field features. Those cells have their own rules; the board shows you what they are.

## Play

Single HTML page. Tap a grass cell for an X, tap again to clear, double-tap for a fox. CHECK locks correct foxes in green and outlines misses in red. Win when every fox is right.

MENU has RESET, NEW, size − / +, and a HINT stub. Score (cleared / right / wrong) and the current board persist in the browser. Leaving the page returns to the title so the next Start can go fullscreen again.

## Run

Open `index.html` locally or from GitHub Pages. After pulling, hard-refresh so script `?v=` cache-busts load.
