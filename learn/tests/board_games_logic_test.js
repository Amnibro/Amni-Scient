let fails = 0;
const N = 8, ridx = (r, c) => r * N + c;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
function flipsFor(board, r, c, p) {
  if (board[ridx(r, c)] !== 0) return [];
  const opp = p === 1 ? 2 : 1, out = [];
  for (const [dr, dc] of DIRS) {
    let rr = r + dr, cc = c + dc; const line = [];
    while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[ridx(rr, cc)] === opp) { line.push(ridx(rr, cc)); rr += dr; cc += dc; }
    if (line.length && rr >= 0 && rr < N && cc >= 0 && cc < N && board[ridx(rr, cc)] === p) out.push(...line);
  }
  return out;
}
function rValid(board, p) { const m = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board[ridx(r, c)] === 0 && flipsFor(board, r, c, p).length) m.push([r, c]); return m; }
function rPlace(board, r, c, p) { const f = flipsFor(board, r, c, p); if (!f.length) return 0; board[ridx(r, c)] = p; f.forEach(i => board[i] = p); return f.length; }
const discs = b => b.reduce((a, c) => a + (c !== 0 ? 1 : 0), 0);
let rGames = 0, rMoves = 0, rMax = 0;
for (let g = 0; g < 20000; g++) {
  const board = new Array(64).fill(0);
  board[ridx(3, 3)] = 2; board[ridx(3, 4)] = 1; board[ridx(4, 3)] = 1; board[ridx(4, 4)] = 2;
  let turn = 1, passes = 0, guard = 0, mv = 0;
  while (guard++ < 200) {
    const moves = rValid(board, turn);
    if (!moves.length) { passes++; if (passes >= 2) break; turn = 3 - turn; continue; }
    passes = 0;
    const [r, c] = moves[Math.floor(Math.random() * moves.length)];
    const before = discs(board);
    const flipped = rPlace(board, r, c, turn);
    if (flipped < 1) { fails++; console.log('reversi: legal move flipped 0'); }
    if (discs(board) !== before + 1) { fails++; console.log('reversi: disc count not +1', before, discs(board)); }
    if (discs(board) > 64) { fails++; console.log('reversi: >64 discs'); }
    turn = 3 - turn; mv++; rMoves++;
  }
  if (guard >= 200) { fails++; console.log('reversi: NON-TERMINATION game', g); }
  rMax = Math.max(rMax, mv); rGames++;
}
console.log(`Reversi: games=${rGames} moves=${rMoves} maxMovesInAGame=${rMax} (cap 60) -> disc-count(+1/move) + termination + <=64 invariants`);
const ROWS = 6, COLS = 7;
function lowestRow(grid, c) { for (let r = ROWS - 1; r >= 0; r--) if (grid[r][c] === 0) return r; return -1; }
function checkWinFrom(grid, r, c, p) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    let cnt = 1;
    for (let s = 1; s < 4; s++) { const nr = r + dr * s, nc = c + dc * s; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] !== p) break; cnt++; }
    for (let s = 1; s < 4; s++) { const nr = r - dr * s, nc = c - dc * s; if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] !== p) break; cnt++; }
    if (cnt >= 4) return true;
  }
  return false;
}
function fullWin(grid, p) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] !== p) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let k = 1; for (; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || grid[rr][cc] !== p) break; }
      if (k === 4) return true;
    }
  }
  return false;
}
let cGames = 0, cMoves = 0, cWins = 0, cDraws = 0, mismatches = 0;
for (let g = 0; g < 30000; g++) {
  const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  let turn = 1, guard = 0, ended = false;
  while (guard++ < 50) {
    const cols = []; for (let c = 0; c < COLS; c++) if (lowestRow(grid, c) >= 0) cols.push(c);
    if (!cols.length) { cDraws++; break; }
    const c = cols[Math.floor(Math.random() * cols.length)], r = lowestRow(grid, c);
    grid[r][c] = turn; cMoves++;
    const wf = checkWinFrom(grid, r, c, turn), fw = fullWin(grid, turn);
    if (wf !== fw) { mismatches++; fails++; console.log('connect4: win-detect mismatch', wf, fw); }
    if (wf) { cWins++; ended = true; break; }
    turn = 3 - turn;
  }
  if (guard >= 50) { fails++; console.log('connect4: NON-TERMINATION'); }
  cGames++;
}
console.log(`Connect Four: games=${cGames} moves=${cMoves} wins=${cWins} draws=${cDraws} winDetectMismatches=${mismatches} (checkWinFrom cross-checked vs independent full-board scanner)`);
console.log(fails === 0 ? 'PASS: Reversi + Connect Four logic invariants held across all games' : `FAIL: ${fails} violations`);
process.exit(fails === 0 ? 0 : 1);
