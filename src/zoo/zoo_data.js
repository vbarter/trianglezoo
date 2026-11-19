// ===================== zoo animals =====================
// Each animal is drawn in a unit box (x right, y down) from circles 'c', ellipses 'e' and polygons 'p'.
// The board is the set of grid triangles whose centre falls inside, made at several sizes so every
// difficulty finds animals that fit. eyes/nose/mouth/beak/deco use the same unit box and appear when the board is complete.
const ZOO = [
  { id: 'cat', col: 1, body: [['c', .5, .58, .38], ['p', [[.13, .52], [.15, .02], [.47, .26]]], ['p', [[.87, .52], [.85, .02], [.53, .26]]]],
    eyes: [[.36, .55], [.64, .55]], nose: [.5, .68], mouth: [.5, .74] },
  { id: 'fox', col: 1, body: [['p', [[.02, .3], [.98, .3], [.5, .98]]], ['e', .5, .42, .44, .22], ['p', [[.08, .4], [.14, -.02], [.44, .24]]], ['p', [[.92, .4], [.86, -.02], [.56, .24]]]],
    eyes: [[.35, .46], [.65, .46]], nose: [.5, .84], deco: [['p', [[.22, .6], [.5, .98], [.78, .6], [.5, .7]], '#FFFFFF', .55]] },
  { id: 'bear', col: 7, body: [['c', .5, .58, .38], ['c', .19, .24, .15], ['c', .81, .24, .15]],
    eyes: [[.37, .54], [.63, .54]], nose: [.5, .68], mouth: [.5, .74], deco: [['e', .5, .7, .13, .09, '#FFFFFF', .45]] },
  { id: 'panda', col: 5, body: [['c', .5, .58, .38], ['c', .19, .24, .15], ['c', .81, .24, .15]],
    eyes: [[.37, .55], [.63, .55]], nose: [.5, .69], mouth: [.5, .75], deco: [['e', .36, .56, .1, .12, '#1E3A4C', .8], ['e', .64, .56, .1, .12, '#1E3A4C', .8]] },
  { id: 'pig', col: 7, body: [['e', .5, .56, .44, .38], ['p', [[.12, .38], [.1, .0], [.42, .22]]], ['p', [[.88, .38], [.9, .0], [.58, .22]]]],
    eyes: [[.34, .48], [.66, .48]], deco: [['e', .5, .67, .14, .1, '#FFC2D6', 1], ['e', .45, .67, .025, .04, '#B0476E', 1], ['e', .55, .67, .025, .04, '#B0476E', 1]] },
  { id: 'rabbit', col: 6, body: [['c', .5, .68, .31], ['e', .35, .26, .1, .27], ['e', .65, .26, .1, .27]],
    eyes: [[.39, .66], [.61, .66]], nose: [.5, .77], mouth: [.5, .82] },
  { id: 'owl', col: 0, body: [['e', .5, .58, .39, .42], ['p', [[.12, .34], [.13, -.02], [.4, .2]]], ['p', [[.88, .34], [.87, -.02], [.6, .2]]]],
    eyes: [[.34, .44], [.66, .44]], er: .1, beak: [.5, .58], deco: [['e', .5, .8, .2, .14, '#FFFFFF', .35]] },
  { id: 'frog', col: 3, body: [['e', .5, .66, .46, .3], ['c', .26, .36, .17], ['c', .74, .36, .17]],
    eyes: [[.26, .36], [.74, .36]], er: .085, mouth: [.5, .7], wide: 1 },
  { id: 'mouse', col: 4, body: [['c', .5, .66, .3], ['c', .18, .3, .2], ['c', .82, .3, .2]],
    eyes: [[.4, .63], [.6, .63]], nose: [.5, .78], deco: [['c', .18, .3, .1, '#FFC2D6', .7], ['c', .82, .3, .1, '#FFC2D6', .7]] },
  { id: 'lion', col: 2, body: [['p', Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12, r = i % 2 ? .4 : .5; return [.5 + r * Math.cos(a), .5 + r * Math.sin(a)]; })]],
    eyes: [[.4, .47], [.6, .47]], nose: [.5, .58], mouth: [.5, .64], deco: [['c', .5, .52, .27, '#FFE7A6', .75]] },
  { id: 'penguin', col: 5, body: [['e', .5, .55, .3, .45], ['p', [[.24, .4], [.04, .78], [.24, .72]]], ['p', [[.76, .4], [.96, .78], [.76, .72]]]],
    eyes: [[.41, .32], [.59, .32]], beak: [.5, .41], deco: [['e', .5, .65, .19, .3, '#FFFFFF', .8]] },
  { id: 'chick', col: 2, body: [['c', .5, .6, .38], ['p', [[.4, .3], [.46, .06], [.52, .26], [.6, .08], [.62, .3]]]],
    eyes: [[.37, .54], [.63, .54]], beak: [.5, .64] },
  { id: 'fish', col: 4, side: 1, body: [['e', .42, .5, .37, .27], ['p', [[.68, .5], [.99, .2], [.99, .8]]]],
    eyes: [[.22, .44]], mouth: [.1, .55], deco: [['p', [[.3, .25], [.5, .22], [.42, .4]], '#FFFFFF', .35]] },
  { id: 'whale', col: 5, side: 1, body: [['e', .44, .6, .43, .3], ['p', [[.78, .58], [1.02, .2], [1.02, .42], [.88, .62]]]],
    eyes: [[.2, .58]], mouth: [.13, .7], deco: [['e', .4, .78, .3, .1, '#FFFFFF', .45]] },
  { id: 'turtle', col: 3, side: 1, body: [['e', .5, .55, .36, .27], ['c', .89, .55, .12], ['c', .3, .8, .1], ['c', .7, .8, .1], ['p', [[.12, .6], [.0, .7], [.16, .7]]]],
    eyes: [[.92, .5]], er: .045, deco: [['c', .5, .5, .13, '#FFFFFF', .3], ['c', .3, .55, .08, '#FFFFFF', .3], ['c', .7, .55, .08, '#FFFFFF', .3]] },
  { id: 'snail', col: 6, side: 1, body: [['c', .6, .48, .3], ['e', .5, .8, .48, .13], ['c', .12, .68, .11]],
    eyes: [[.1, .64]], er: .045, mouth: [.07, .72], deco: [['c', .6, .48, .18, '#FFFFFF', .3], ['c', .6, .48, .08, '#FFFFFF', .3]] },
  { id: 'duck', col: 2, side: 1, body: [['e', .56, .66, .4, .25], ['c', .27, .33, .19], ['p', [[.33, .45], [.45, .5], [.3, .6]]], ['p', [[.88, .55], [1.02, .3], [.98, .62]]]],
    eyes: [[.22, .28]], beak: [.06, .36], side_beak: 1 },
  { id: 'crab', col: 0, body: [['e', .5, .6, .38, .22], ['c', .13, .24, .12], ['c', .87, .24, .12], ['p', [[.12, .3], [.22, .3], [.32, .5], [.22, .55]]], ['p', [[.88, .3], [.78, .3], [.68, .5], [.78, .55]]],
    ['p', [[.2, .7], [.04, .9], [.14, .92], [.3, .76]]], ['p', [[.8, .7], [.96, .9], [.86, .92], [.7, .76]]]],
    eyes: [[.4, .52], [.6, .52]], mouth: [.5, .66] },
  { id: 'butterfly', col: 6, body: [['e', .27, .36, .24, .25], ['e', .73, .36, .24, .25], ['e', .31, .72, .18, .18], ['e', .69, .72, .18, .18], ['e', .5, .55, .07, .38]],
    eyes: [[.46, .3], [.54, .3]], er: .035, deco: [['c', .27, .36, .1, '#FFFFFF', .4], ['c', .73, .36, .1, '#FFFFFF', .4]] },
  { id: 'dino', col: 3, side: 1, body: [['e', .48, .66, .3, .21], ['e', .8, .22, .16, .1], ['p', [[.62, .5], [.7, .22], [.84, .26], [.76, .56]]], ['p', [[.24, .58], [-.02, .86], [.3, .76]]],
    ['p', [[.32, .78], [.42, .78], [.42, .98], [.32, .98]]], ['p', [[.56, .78], [.66, .78], [.66, .98], [.56, .98]]]],
    eyes: [[.84, .18]], er: .045, mouth: [.9, .26] },
  { id: 'elephant', col: 5, side: 1, body: [['e', .58, .55, .38, .28], ['c', .26, .4, .22], ['p', [[.06, .42], [.18, .46], [.16, .92], [.05, .92]]],
    ['p', [[.35, .7], [.47, .7], [.47, .96], [.35, .96]]], ['p', [[.72, .7], [.84, .7], [.84, .96], [.72, .96]]]],
    eyes: [[.2, .36]], deco: [['e', .36, .42, .1, .16, '#FFC2D6', .6]] },
  { id: 'octopus', col: 7, body: [['e', .5, .38, .36, .32], ...[.2, .4, .6, .8].map(x => ['p', [[x - .09, .55], [x + .09, .55], [x + .02, .98], [x - .06, .98]]])],
    eyes: [[.38, .4], [.62, .4]], mouth: [.5, .52] },
];
function zooInside(d, x, y){
  for (const q of d.body){
    if (q[0] === 'c'){ const dx = x - q[1], dy = y - q[2]; if (dx * dx + dy * dy <= q[3] * q[3]) return true; }
    else if (q[0] === 'e'){ const dx = (x - q[1]) / q[3], dy = (y - q[2]) / q[4]; if (dx * dx + dy * dy <= 1) return true; }
    else { const P = q[1]; let inn = false;
      for (let a = 0, b = P.length - 1; a < P.length; b = a++){ const xa = P[a][0], ya = P[a][1], xb = P[b][0], yb = P[b][1];
        if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) inn = !inn; }
      if (inn) return true; }
  }
  return false;
}
function zooCells(d, s){
  let out = [];
  const j0 = Math.floor(-0.1 * s / H) - 2, j1 = Math.ceil(1.1 * s / H) + 2;
  for (let j = j0; j <= j1; j++) for (let i = Math.floor(-0.2 * s - j / 2) - 2; i <= Math.ceil(1.2 * s - j / 2) + 2; i++) for (let t = 0; t < 2; t++){
    const p = cxy([i, j, t]); if (zooInside(d, p[0] / s, p[1] / s)) out.push([i, j, t]); }
  // keep the largest edge-connected part
  const set = new Map(out.map(c => [K(c[0], c[1], c[2]), c])), seen = new Set(); let best = [];
  for (const [k0, c0] of set){ if (seen.has(k0)) continue; seen.add(k0); const comp = [c0];
    for (let h = 0; h < comp.length; h++) for (const nb of nbrs(comp[h])){ const k = K(nb[0], nb[1], nb[2]); if (set.has(k) && !seen.has(k)){ seen.add(k); comp.push(nb); } }
    if (comp.length > best.length) best = comp; }
  return best;
}
const ZOO_SMALL = ['cat', 'fox', 'bear', 'owl', 'lion', 'chick', 'fish', 'whale', 'duck', 'penguin', 'frog'];
const ZOO_BY = {}; ZOO.forEach(d => ZOO_BY[d.id] = d);
const FIGS = [];   // filled by buildZooFigs() from the pictures, before the first level is made
