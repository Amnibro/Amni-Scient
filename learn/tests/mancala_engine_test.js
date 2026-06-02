const TOTAL = 48;
function sow(board, pit) {
  const player = pit <= 5, oppStore = player ? 13 : 6;
  let stones = board[pit]; board[pit] = 0; let i = pit;
  while (stones > 0) { i = (i + 1) % 14; if (i === oppStore) continue; board[i]++; stones--; }
  return i;
}
function applyMove(board, pit) {
  const player = pit <= 5, last = sow(board, pit), myStore = player ? 6 : 13, lo = player ? 0 : 7, hi = player ? 5 : 12;
  let extra = false, captured = false;
  if (last === myStore) extra = true;
  else if (last >= lo && last <= hi && board[last] === 1) {
    const opp = 12 - last;
    if (board[opp] > 0) { board[myStore] += board[opp] + 1; board[opp] = 0; board[last] = 0; captured = true; }
  }
  return { extra, captured };
}
function checkEnd(board) {
  const pSum = board.slice(0, 6).reduce((a, b) => a + b, 0), aSum = board.slice(7, 13).reduce((a, b) => a + b, 0);
  if (pSum === 0 || aSum === 0) {
    board[6] += pSum; for (let k = 0; k < 6; k++) board[k] = 0;
    board[13] += aSum; for (let k = 7; k < 13; k++) board[k] = 0;
    return true;
  }
  return false;
}
const sum = b => b.reduce((a, c) => a + c, 0);
const legal = (b, player) => { const lo = player ? 0 : 7, out = []; for (let p = lo; p <= lo + 5; p++) if (b[p] > 0) out.push(p); return out; };
let games = 0, moves = 0, fails = 0, pWins = 0, aWins = 0, ties = 0, maxMoves = 0, extras = 0, caps = 0;
const GAMES = 20000;
for (let g = 0; g < GAMES; g++) {
  const board = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
  let player = (g % 2) === 0, guard = 0, mv = 0;
  if (sum(board) !== TOTAL) { fails++; console.log('init sum fail'); break; }
  while (guard++ < 5000) {
    const opts = legal(board, player);
    if (!opts.length) { console.log('no legal move but not ended', board.join(',')); fails++; break; }
    const pit = opts[Math.floor(Math.random() * opts.length)];
    const r = applyMove(board, pit); mv++; moves++;
    if (r.extra) extras++; if (r.captured) caps++;
    if (sum(board) !== TOTAL) { fails++; console.log('CONSERVATION FAIL game', g, 'sum', sum(board), board.join(',')); break; }
    if (checkEnd(board)) {
      if (sum(board) !== TOTAL) { fails++; console.log('post-end sum fail', sum(board)); }
      if (board[6] + board[13] !== TOTAL) { fails++; console.log('store total fail', board[6], board[13]); }
      board[6] > board[13] ? pWins++ : board[13] > board[6] ? aWins++ : ties++;
      break;
    }
    if (!r.extra) player = !player;
  }
  if (guard >= 5000) { fails++; console.log('NON-TERMINATION game', g); }
  maxMoves = Math.max(maxMoves, mv); games++;
}
console.log(`games=${games} moves=${moves} maxMovesInAGame=${maxMoves} extras=${extras} captures=${caps}`);
console.log(`results: you=${pWins} ai=${aWins} ties=${ties}`);
console.log(fails === 0 ? 'PASS: seed conservation (always 48) + termination + valid end held across all games' : `FAIL: ${fails} invariant violations`);
process.exit(fails === 0 ? 0 : 1);
