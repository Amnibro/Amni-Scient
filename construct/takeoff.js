// Same quantities as construct/he/takeoff.amni. The page runs this file.
// Lengths are feet. Waste fractions match the field guide on the Construct home page.
export const WASTE = {
  framing: 0.10,
  deck: 0.10,
  deck_diagonal: 0.15,
  concrete: 0.10,
  paver: 0.10,
  tile: 0.15,
  tile_diagonal: 0.20,
  gravel: 0.15
};

export function shoelace(xs, ys, n = Math.min(xs.length, ys.length)) {
  if (n < 3) return 0;
  let a = 0;
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    a += xs[i] * ys[j] - xs[j] * ys[i];
  }
  return Math.abs(a) * 0.5;
}

export function perimeter(xs, ys, n = Math.min(xs.length, ys.length)) {
  if (n < 2) return 0;
  let p = 0;
  for (let i = 0; i < n; i++) {
    const j = i + 1 === n ? 0 : i + 1;
    const dx = xs[j] - xs[i], dy = ys[j] - ys[i];
    p += Math.hypot(dx, dy);
  }
  return p;
}

export function withWaste(qty, rate) {
  return qty * (1 + rate);
}

export function concreteYards(area, thickIn) {
  if (!(area > 0) || !(thickIn > 0)) return 0;
  return area * (thickIn / 12) / 27;
}

export function pieces(lengthFt, pieceFt) {
  if (!(lengthFt > 0) || !(pieceFt > 0)) return 0;
  let covered = 0, n = 0;
  while (covered < lengthFt) {
    covered += pieceFt;
    n += 1;
    if (n > 1000000) return n;
  }
  return n;
}

const round = n => Math.round(n * 100) / 100;

/** Quantities from a footprint the model read. Still a suggestion: the corners came from a picture. */
export function quantify(layout) {
  const fp = (layout && layout.footprint) || [];
  const xs = fp.map(p => +p.x || 0), ys = fp.map(p => +p.y || 0);
  const n = Math.min(xs.length, ys.length);
  const area = shoelace(xs, ys, n);
  const edge = perimeter(xs, ys, n);
  const thick = +layout?.thickness_in || 0;
  const key = WASTE[layout?.waste] != null ? layout.waste : (layout?.trade === 'patio' || layout?.trade === 'pool' ? 'concrete' : layout?.trade === 'deck' ? 'deck' : 'framing');
  const rate = WASTE[key];
  const yards = concreteYards(area, thick);
  return {
    area_sqft: round(area),
    perimeter_ft: round(edge),
    waste: key,
    waste_rate: rate,
    order_area_sqft: round(withWaste(area, rate)),
    concrete_yd3: thick ? round(withWaste(yards, WASTE.concrete)) : null,
    concrete_yd3_net: thick ? round(yards) : null
  };
}
