let fails = 0;
const N = 8, SHIPS = [4, 3, 3, 2], idx = (r, c) => r * N + c;
const SHIP_CELLS = SHIPS.reduce((a, b) => a + b, 0);
function placeFleet() {
  const grid = new Array(N * N).fill(0), ships = [];
  for (const len of SHIPS) {
    let placed = false, guard = 0;
    while (!placed && guard++ < 300) {
      const horiz = Math.random() < 0.5;
      const r = Math.floor(Math.random() * (horiz ? N : N - len + 1));
      const c = Math.floor(Math.random() * (horiz ? N - len + 1 : N));
      const cells = []; let ok = true;
      for (let k = 0; k < len; k++) { const rr = horiz ? r : r + k, cc = horiz ? c + k : c; if (grid[idx(rr, cc)]) { ok = false; break; } cells.push(idx(rr, cc)); }
      if (ok) { cells.forEach(i => grid[i] = 1); ships.push({ cells, hits: new Set() }); placed = true; }
    }
  }
  return { grid, ships };
}
const allSunk = ships => ships.every(s => s.hits.size >= s.cells.length);
const shipAt = (ships, i) => ships.find(s => s.cells.includes(i));
// Test 1: placement always places all 4 ships, no overlap, in-bounds
let placeGames = 0, maxGuardFleet = 0;
for (let g = 0; g < 50000; g++) {
  const { grid, ships } = placeFleet();
  if (ships.length !== SHIPS.length) { fails++; console.log('PLACEMENT FAIL: only', ships.length, 'ships placed'); break; }
  const cellCount = grid.reduce((a, c) => a + c, 0);
  if (cellCount !== SHIP_CELLS) { fails++; console.log('CELL COUNT FAIL: grid has', cellCount, 'expected', SHIP_CELLS, '(overlap?)'); break; }
  const allCells = ships.flatMap(s => s.cells);
  if (new Set(allCells).size !== SHIP_CELLS) { fails++; console.log('OVERLAP FAIL: duplicate ship cells'); break; }
  if (allCells.some(i => i < 0 || i >= N * N)) { fails++; console.log('BOUNDS FAIL'); break; }
  placeGames++;
}
console.log(`Placement: ${placeGames} fleets, all ${SHIPS.length} ships placed, ${SHIP_CELLS} cells, no overlap/oob`);
// Test 2: a full random-fire game always sinks one fleet within bounds (no infinite loop, correct sink detection)
let gameRuns = 0, maxShots = 0;
for (let g = 0; g < 20000; g++) {
  const foe = placeFleet();
  const shots = new Array(N * N).fill(false);
  let fired = 0, guard = 0;
  while (!allSunk(foe.ships) && guard++ < 200) {
    const untried = []; for (let i = 0; i < N * N; i++) if (!shots[i]) untried.push(i);
    if (!untried.length) { fails++; console.log('RAN OUT OF CELLS before sinking all ships (sink-detect bug?)'); break; }
    const t = untried[Math.floor(Math.random() * untried.length)];
    shots[t] = true; fired++;
    const ship = shipAt(foe.ships, t); if (ship) ship.hits.add(t);
  }
  if (guard >= 200) { fails++; console.log('NON-TERMINATION game', g); }
  if (!allSunk(foe.ships)) { fails++; console.log('game ended without all ships sunk', g); }
  // sanity: hits never exceed total ship cells
  const totalHits = foe.ships.reduce((a, s) => a + s.hits.size, 0);
  if (totalHits !== SHIP_CELLS) { fails++; console.log('HIT COUNT FAIL', totalHits); }
  maxShots = Math.max(maxShots, fired); gameRuns++;
}
console.log(`Random-fire games: ${gameRuns}, all sank every ship, max shots in a game=${maxShots} (<=64)`);
console.log(fails === 0 ? 'PASS: Battleship placement always succeeds + games always terminate with correct sink detection' : `FAIL: ${fails} violations`);
process.exit(fails === 0 ? 0 : 1);
