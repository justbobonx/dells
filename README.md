# foxes

A Star Battle–style puzzle in a field. Place foxes so each row, each column, and each colored region (a dell) has exactly one. Foxes will not sit on each other’s hip — no two foxes share an edge or a corner.

Larger boards grow extra field features. Those cells have their own rules; the board shows you what they are.

## Play

Single HTML page. Tap a grass cell for an X, tap again to clear, double-tap for a fox.

The bottom-right button is HINT while fewer than N foxes are marked, and CHECK once N are down. Both first score the marked foxes (green lock / red miss). HINT then locks missed empty cells as paw prints: first the easy paint from a found fox (row, column, dell, or ring), then strip / two-line / small-dell halo logic, then a small group from the answer key that will not finish a dell. CHECK with N marks only scores and can win.

MENU has RESET, NEW, size − / +, and the same HINT path. Score (cleared / right / wrong) and the current board persist in the browser. Leaving the page returns to the title so the next Start can go fullscreen again.

## Run

Open `index.html` locally or from GitHub Pages. After pulling, hard-refresh so script `?v=` cache-busts load.
