/* 角角入位 — 游戏脚本（由 scripts/build_xhs.py 生成） */
/*CORE-START*/
// ===================== triangle grid =====================
// cell = [i, j, t]: rhombus (i,j) on the lattice e1=(1,0), e2=(1/2,H); t=0 points down, t=1 points up.
const H = Math.sqrt(3) / 2;
const K = (i, j, t) => i + ',' + j + ',' + t;
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function nbrs(c){ const i = c[0], j = c[1];
  return c[2] === 0 ? [[i, j, 1], [i - 1, j, 1], [i, j - 1, 1]] : [[i, j, 0], [i + 1, j, 0], [i, j + 1, 0]]; }
function cverts(c){ const i = c[0], j = c[1];
  return c[2] === 0 ? [[i, j], [i + 1, j], [i, j + 1]] : [[i + 1, j], [i + 1, j + 1], [i, j + 1]]; }
function vxy(v){ return [v[0] + v[1] / 2, v[1] * H]; }
function cxy(c){ const u = 3 * c[0] + 1 + c[2], v = 3 * c[1] + 1 + c[2]; return [(u + v / 2) / 3, v * H / 3]; }
// rotate one cell 60 degrees clockwise (screen) about the lattice origin
function rot60(c){ const u = 3 * c[0] + 1 + c[2], v = 3 * c[1] + 1 + c[2]; const u2 = -v, v2 = u + v;
  const t2 = (((u2 % 3) + 3) % 3) === 1 ? 0 : 1; return [(u2 - 1 - t2) / 3, (v2 - 1 - t2) / 3, t2]; }
// mirror one cell left-right
function flipCell(c){ const u = 3 * c[0] + 1 + c[2], v = 3 * c[1] + 1 + c[2]; return [(-u - v - 1 - c[2]) / 3, c[1], c[2]]; }
function normCells(cells){ let mi = Infinity, mj = Infinity;
  for (const c of cells){ if (c[0] < mi) mi = c[0]; if (c[1] < mj) mj = c[1]; }
  return { cells: cells.map(c => [c[0] - mi, c[1] - mj, c[2]]), off: [mi, mj] }; }
// orientation (r, f) of a shape: mirror first when f=1, then r turns of 60 degrees
function oriCells(base, r, f){ let out = f ? base.map(flipCell) : base; for (let n = 0; n < r; n++) out = out.map(rot60); return normCells(out).cells; }
const sigOf = cells => cells.map(c => K(c[0], c[1], c[2])).sort().join(';');
function orientations(base, rot, flip){ const out = [], seen = new Set();
  for (let f = 0; f < (flip ? 2 : 1); f++) for (let r = 0; r < (rot ? 6 : 1); r++){
    const cells = oriCells(base, r, f), sig = sigOf(cells); if (seen.has(sig)) continue; seen.add(sig); out.push({ r, f, cells, sig }); }
  return out; }
function pickW(rng, items, ws){ let s = 0; for (const w of ws) s += w; let r = rng() * s;
  for (let k = 0; k < items.length; k++){ r -= ws[k]; if (r <= 0) return items[k]; } return items[items.length - 1]; }
const parseK = k => k.split(',').map(Number);
function connected(cells){ if (!cells.length) return false; const set = new Set(cells.map(c => K(c[0], c[1], c[2])));
  const q = [cells[0]], vis = new Set([K(cells[0][0], cells[0][1], cells[0][2])]);
  while (q.length){ const c = q.pop(); for (const nb of nbrs(c)){ const k = K(nb[0], nb[1], nb[2]); if (set.has(k) && !vis.has(k)){ vis.add(k); q.push(nb); } } }
  return vis.size === cells.length; }

// ===================== level generator =====================
// Pieces are grown one after another, each touching what is already there.
// The board is their union, so every level has at least one solution by construction.
function tryGen(rng, cfg){
  const n = cfg.n, total = n * (cfg.min + cfg.max) / 2;
  const asp = 0.8 + rng() * 0.45;
  const side = Math.sqrt(total) + 0.6;
  const hw = side * Math.sqrt(asp) / 2, hh = side / Math.sqrt(asp) / 2;
  const tight = 0.6 + rng() * 1.6, chunk = rng() * 1.5;
  const inWin = c => { const p = cxy(c); return Math.abs(p[0] - 0.5) <= hw && Math.abs(p[1] - 0.3) <= hh; };
  const occ = new Map(), pieces = [];
  for (let p = 0; p < n; p++){
    const size = cfg.min + Math.floor(rng() * (cfg.max - cfg.min + 1));
    let start;
    if (p === 0) start = [0, 0, 0];
    else {
      const seen = new Map();
      for (const k of occ.keys()) for (const nb of nbrs(parseK(k))){
        const kk = K(nb[0], nb[1], nb[2]); if (occ.has(kk) || !inWin(nb)) continue; seen.set(kk, (seen.get(kk) || 0) + 1); }
      if (!seen.size) return null;
      const items = [], ws = [];
      for (const [kk, cnt] of seen){ const c = parseK(kk), q = cxy(c);
        const d = Math.hypot(q[0] - 0.5, q[1] - 0.3) / side;
        items.push(c); ws.push(cnt * cnt * Math.exp(-tight * d * 4)); }
      start = pickW(rng, items, ws);
    }
    const cells = [start], own = new Set([K(start[0], start[1], start[2])]);
    while (cells.length < size){
      const cand = new Map();
      for (const c of cells) for (const nb of nbrs(c)){
        const kk = K(nb[0], nb[1], nb[2]); if (own.has(kk) || occ.has(kk) || !inWin(nb)) continue; cand.set(kk, (cand.get(kk) || 0) + 1); }
      if (!cand.size) break;
      const items = [], ws = [];
      for (const [kk, cnt] of cand){ items.push(parseK(kk)); ws.push(1 + chunk * (cnt - 1) * 2); }
      const c = pickW(rng, items, ws); cells.push(c); own.add(K(c[0], c[1], c[2]));
    }
    if (cells.length < cfg.min) return null;
    for (const c of cells) occ.set(K(c[0], c[1], c[2]), p);
    pieces.push(cells);
  }
  // close pinholes (enclosed gaps of 1-2 cells) by giving them to a neighbouring piece
  let mi = Infinity, mj = Infinity, xi = -Infinity, xj = -Infinity;
  for (const k of occ.keys()){ const c = parseK(k); mi = Math.min(mi, c[0]); xi = Math.max(xi, c[0]); mj = Math.min(mj, c[1]); xj = Math.max(xj, c[1]); }
  mi -= 2; mj -= 2; xi += 2; xj += 2;
  const inBox = c => c[0] >= mi && c[0] <= xi && c[1] >= mj && c[1] <= xj;
  const out = new Set([K(mi, mj, 0)]); const q = [[mi, mj, 0]];
  while (q.length){ const c = q.pop(); for (const nb of nbrs(c)){ const kk = K(nb[0], nb[1], nb[2]);
    if (!inBox(nb) || occ.has(kk) || out.has(kk)) continue; out.add(kk); q.push(nb); } }
  const done = new Set();
  for (let i = mi; i <= xi; i++) for (let j = mj; j <= xj; j++) for (let t = 0; t < 2; t++){
    const k0 = K(i, j, t); if (occ.has(k0) || out.has(k0) || done.has(k0)) continue;
    const comp = [[i, j, t]]; done.add(k0);
    for (let h = 0; h < comp.length; h++) for (const nb of nbrs(comp[h])){ const kk = K(nb[0], nb[1], nb[2]);
      if (occ.has(kk) || done.has(kk) || out.has(kk)) continue; done.add(kk); comp.push(nb); }
    if (comp.length > 2) continue;
    for (const c of comp){ let best = -1;
      for (const nb of nbrs(c)){ const o = occ.get(K(nb[0], nb[1], nb[2]));
        if (o !== undefined && (best < 0 || pieces[o].length < pieces[best].length)) best = o; }
      if (best >= 0){ pieces[best].push(c); occ.set(K(c[0], c[1], c[2]), best); } }
  }
  // colours: neighbours never share one
  const adj = pieces.map(() => new Set());
  for (const [k, p] of occ) for (const nb of nbrs(parseK(k))){ const o = occ.get(K(nb[0], nb[1], nb[2])); if (o !== undefined && o !== p) adj[p].add(o); }
  const NC = 8, use = new Array(NC).fill(0), colors = [], shift = Math.floor(rng() * NC);
  for (let p = 0; p < pieces.length; p++){
    let best = -1, bs = 1e9;
    for (let c0 = 0; c0 < NC; c0++){ const c = (c0 + shift) % NC; let bad = false;
      for (const o of adj[p]) if (colors[o] === c) bad = true;
      const s = use[c] + (bad ? 100 : 0) + rng() * 0.5; if (s < bs){ bs = s; best = c; } }
    colors.push(best); use[best]++;
  }
  return { pieces, colors };
}
function generate(seed, cfg){
  for (let a = 0; a < 400; a++){ const r = tryGen(mulberry32(seed + a * 7919), cfg); if (r) return r; }
  return tryGen(mulberry32(1), { n: 3, min: 3, max: 4 });
}
// extra pieces that look plausible but are never needed: a real piece with one triangle moved
function makeDecoys(rng, bases, count, rot, flip){
  const keyOf = b => orientations(b, rot, flip).map(o => o.sig).sort()[0];
  const taken = new Set(bases.map(keyOf)), out = [];
  for (let d = 0; d < count; d++) for (let a = 0; a < 80; a++){
    const src = bases[Math.floor(rng() * bases.length)], ri = Math.floor(rng() * src.length), rest = src.filter((_, n) => n !== ri);
    if (!connected(rest)) continue;
    const set = new Set(src.map(c => K(c[0], c[1], c[2]))), cand = [];
    for (const c of rest) for (const nb of nbrs(c)) if (!set.has(K(nb[0], nb[1], nb[2]))) cand.push(nb);
    if (!cand.length) continue;
    const shape = normCells(rest.concat([cand[Math.floor(rng() * cand.length)]])).cells, key = keyOf(shape);
    if (taken.has(key)) continue; taken.add(key); out.push(shape); break;
  }
  return out;
}

// ===================== familiar shapes =====================
// Each figure is drawn on the triangle grid row by row. Rows are separated by '/', runs by a space,
// a run is 'from:to' (or one column). The cell at row r, column k points up when r + k is even.
function figCells(rows){ const out = [];
  rows.split('/').forEach((row, r) => row.trim().split(/\s+/).filter(Boolean).forEach(run => { const m = run.split(':').map(Number), a = m[0], b = m.length > 1 ? m[1] : m[0];
    for (let k = a; k <= b; k++) out.push((((r + k) % 2) + 2) % 2 === 0 ? [(k - r - 2) / 2, r, 1] : [(k - r - 1) / 2, r, 0]); }));
  return out; }
// the same outline at twice the size: every triangle becomes four
function scale2(cells){ const out = [];
  for (const c of cells){ const a = 2 * c[0], b = 2 * c[1];
    if (c[2] === 0) out.push([a, b, 0], [a + 1, b, 0], [a, b + 1, 0], [a, b, 1]);
    else out.push([a + 1, b, 1], [a + 1, b + 1, 1], [a, b + 1, 1], [a + 1, b + 1, 0]); }
  return out; }
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

// cut a fixed outline into n connected pieces of min..max triangles each
function tryPartition(rng, cells, n, min, max){
  const free = new Map(cells.map(c => [K(c[0], c[1], c[2]), c])), pieces = [];
  const freeNb = c => { let d = 0; for (const nb of nbrs(c)) if (free.has(K(nb[0], nb[1], nb[2]))) d++; return d; };
  for (let p = 0; p < n; p++){
    const R = free.size, left = n - p - 1;
    if (left === 0){ const rest = [...free.values()]; if (rest.length < min || rest.length > max || !connected(rest)) return null; pieces.push(rest); break; }
    const lo = Math.max(min, R - left * max), hi = Math.min(max, R - left * min); if (lo > hi) return null;
    const size = lo + Math.floor(rng() * (hi - lo + 1));
    let best = [], bn = 9; for (const c of free.values()){ const d = freeNb(c); if (d < bn){ bn = d; best = [c]; } else if (d === bn) best.push(c); }
    const start = best[Math.floor(rng() * best.length)], piece = [start]; free.delete(K(start[0], start[1], start[2]));
    while (piece.length < size){
      const cand = new Map(); for (const c of piece) for (const nb of nbrs(c)){ const k = K(nb[0], nb[1], nb[2]); if (free.has(k)) cand.set(k, nb); }
      if (!cand.size) break;
      const items = [...cand.values()], ws = items.map(c => { const d = freeNb(c); return d === 0 ? 8 : d === 1 ? 3 : 1; });
      const c = pickW(rng, items, ws); piece.push(c); free.delete(K(c[0], c[1], c[2]));
    }
    if (piece.length < min) return null;
    // what is left must still split into the remaining number of pieces
    const seen = new Set(); let kmin = 0, kmax = 0;
    for (const [k0, c0] of free){ if (seen.has(k0)) continue; seen.add(k0); const q = [c0]; let sz = 0;
      while (q.length){ const c = q.pop(); sz++; for (const nb of nbrs(c)){ const k = K(nb[0], nb[1], nb[2]); if (free.has(k) && !seen.has(k)){ seen.add(k); q.push(nb); } } }
      const a = Math.ceil(sz / max), b = Math.floor(sz / min); if (a > b) return null; kmin += a; kmax += b; }
    if (left < kmin || left > kmax) return null;
    pieces.push(piece);
  }
  return pieces.length === n ? pieces : null;
}
function partition(seed, cells, n, min, max){
  for (let a = 0; a < 600; a++){ const r = tryPartition(mulberry32(seed + a * 7919), cells, n, min, max + (a >= 400 ? 1 : 0)); if (r) return r; }
  return null;
}
function colorize(pieces, rng){
  const owner = new Map(); pieces.forEach((cs, p) => cs.forEach(c => owner.set(K(c[0], c[1], c[2]), p)));
  const adj = pieces.map(() => new Set());
  for (const [k, p] of owner) for (const nb of nbrs(parseK(k))){ const o = owner.get(K(nb[0], nb[1], nb[2])); if (o !== undefined && o !== p) adj[p].add(o); }
  const NC = 8, use = new Array(NC).fill(0), colors = [], shift = Math.floor(rng() * NC);
  for (let p = 0; p < pieces.length; p++){ let best = -1, bs = 1e9;
    for (let c0 = 0; c0 < NC; c0++){ const c = (c0 + shift) % NC; let bad = false; for (const o of adj[p]) if (colors[o] === c) bad = true;
      const s = use[c] + (bad ? 100 : 0) + rng() * 0.5; if (s < bs){ bs = s; best = c; } }
    colors.push(best); use[best]++; }
  return colors;
}
// which figure a level uses: three levels in four show a familiar shape, the fourth a free-form one
function pickFigure(di, level, cfg){
  const ok = FIGS.filter(f => f.n / cfg.n >= cfg.min + 0.5 && f.n / cfg.n <= cfg.max - 0.5); if (!ok.length) return null;
  const ids = [...new Set(ok.map(f => f.id))], rng = mulberry32((di + 1) * 7001 + 977);
  const order = ZOO.map(d => d.id); for (let a = order.length - 1; a > 0; a--){ const b = Math.floor(rng() * (a + 1)), t = order[a]; order[a] = order[b]; order[b] = t; }
  const avail = order.filter(id => ids.includes(id)), first = ['cat', 'fox', 'owl', 'penguin'][di];
  // level 1 of each difficulty opens with a friendly face
  const id = level === 1 && ids.includes(first) ? first : avail[(level - 1) % avail.length];
  const sizes = ok.filter(f => f.id === id), st = Math.floor(mulberry32(level * 131 + di)() * sizes.length);
  return sizes.slice(st).concat(sizes.slice(0, st));   // preferred size first; other sizes are fallbacks if a cut fails
}

// ===================== solver =====================
// Depth-first exact cover: always fill the first empty cell (row order) with an unused piece.
// Used three ways: to score how hard a level is, to give hints from the player's current position,
// and to notice when the current position can no longer be finished.
function makeSolver(boardCells, bases, rot, flip){
  const cells = boardCells.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0] || a[2] - b[2]);
  const idx = new Map(); cells.forEach((c, n) => idx.set(K(c[0], c[1], c[2]), n));
  const N = cells.length, P = bases.length, byMin = Array.from({ length: N }, () => []), groupOf = [], gmap = new Map();
  bases.forEach((base, pid) => {
    const os = orientations(base, rot, flip), key = os.map(o => o.sig).sort()[0];
    if (!gmap.has(key)) gmap.set(key, gmap.size); groupOf[pid] = gmap.get(key);
    for (const o of os){ const a = o.cells[0];
      for (const b of cells){ if (b[2] !== a[2]) continue; const di = b[0] - a[0], dj = b[1] - a[1], list = []; let ok = true, m = N;
        for (const c of o.cells){ const n = idx.get(K(c[0] + di, c[1] + dj, c[2])); if (n === undefined){ ok = false; break; } list.push(n); if (n < m) m = n; }
        if (ok) byMin[m].push({ pid, r: o.r, f: o.f, off: [di, dj], list }); } }
  });
  function solve(occ0, used0, rng, maxNodes){
    const occ = occ0 ? Uint8Array.from(occ0) : new Uint8Array(N), used = used0 ? Uint8Array.from(used0) : new Uint8Array(P), sol = [];
    let nodes = 0, aborted = false;
    function rec(from){
      let e = from; while (e < N && occ[e]) e++;
      if (e === N) return true;
      let cand = byMin[e];
      if (rng && cand.length > 1){ cand = cand.slice(); for (let a = cand.length - 1; a > 0; a--){ const b = Math.floor(rng() * (a + 1)), t = cand[a]; cand[a] = cand[b]; cand[b] = t; } }
      for (const pl of cand){
        if (used[pl.pid]) continue;
        let skip = false; for (let q = 0; q < pl.pid; q++) if (!used[q] && groupOf[q] === groupOf[pl.pid]){ skip = true; break; }
        if (skip) continue;
        let ok = true; for (const n of pl.list) if (occ[n]){ ok = false; break; }
        if (!ok) continue;
        if (++nodes > maxNodes){ aborted = true; return false; }
        for (const n of pl.list) occ[n] = 1; used[pl.pid] = 1; sol.push(pl);
        if (rec(e + 1)) return true;
        if (aborted) return false;
        sol.pop(); used[pl.pid] = 0; for (const n of pl.list) occ[n] = 0;
      }
      return false;
    }
    const found = rec(0);
    return { found, nodes, aborted, sol: found ? sol.slice() : null };
  }
  return { N, P, idx, cells, solve };
}
// search effort: average number of tries a blind solver needs to finish the level
function effort(solver, seed){ const rng = mulberry32(seed), RUNS = 5, CAP = 3000; let tot = 0;
  for (let k = 0; k < RUNS; k++){ const r = solver.solve(null, null, rng, CAP); tot += r.found ? r.nodes : CAP; } return tot / RUNS; }

// ===================== difficulty curve =====================
// up: levels at which one more piece is added. span: levels over which the pick moves from the
// easiest to the hardest of the candidate puzzles. Early levels climb slowly; late master levels add
// mirrored pieces, extra pieces, bigger pieces and a board without grid lines.
const TIERS = [
  { id: 'easy',   size: [3, 5], n0: 5, up: [8, 20, 40],             span: 30 },
  { id: 'normal', size: [3, 6], n0: 5, up: [9, 21, 41],             span: 40 },
  { id: 'hard',   size: [4, 7], n0: 7, up: [7, 16, 31, 51, 81],     span: 50, decoy: [25, 70] },
  { id: 'master', size: [4, 6], n0: 5, up: [6, 13, 26, 41, 61, 91], span: 60, rot: true, flipFrom: 30, decoy: [45, 100], bigFrom: 50, noGridFrom: 60 },
];
function levelCfg(di, level){ const t = TIERS[di], cnt = a => a ? a.filter(u => level >= u).length : 0;
  return { n: t.n0 + cnt(t.up), min: t.size[0], max: t.size[1] + (t.bigFrom && level >= t.bigFrom ? 1 : 0), rot: !!t.rot,
    flip: !!(t.flipFrom && level >= t.flipFrom), decoys: cnt(t.decoy), noGrid: !!(t.noGridFrom && level >= t.noGridFrom),
    q: Math.min(1, (level - 1) / t.span) }; }
const CANDIDATES = 6;
function buildLevel(di, level){
  const cfg = levelCfg(di, level), cands = [], fig = pickFigure(di, level, cfg);
  const figs = fig || [], mirror = figs.length > 0 && mulberry32(level * 53 + di)() < 0.5;
  for (let c = 0; c < CANDIDATES; c++){
    const seed = (di + 1) * 100003 + level * 7919 + c * 104729 + 12345, rng = mulberry32(seed ^ 0x5bd1e995);
    let lv = null;
    const F = figs[c % Math.max(1, figs.length)];
    if (F){ const ps = partition(seed, mirror ? F.cells.map(flipCell) : F.cells, cfg.n, cfg.min, cfg.max); if (ps) lv = { pieces: ps, colors: colorize(ps, rng), fig: F.id, figObj: F }; }
    if (!lv) lv = generate(seed, cfg);
    const cells = []; lv.pieces.forEach(cs => cs.forEach(q => cells.push(q)));
    const shapes = lv.pieces.map((cs, i) => { const n = normCells(cs); return { base: n.cells, off: n.off, sol: cs, color: lv.colors[i], decoy: false }; });
    for (const d of makeDecoys(rng, shapes.map(s => s.base), cfg.decoys, cfg.rot, cfg.flip)) shapes.push({ base: d, off: null, sol: null, color: Math.floor(rng() * 8), decoy: true });
    const solver = makeSolver(cells, shapes.map(s => s.base), cfg.rot, cfg.flip);
    cands.push({ cells, shapes, solver, e: effort(solver, seed + 17), c, fig: lv.fig || null, figObj: lv.figObj || null });
  }
  // an animal whenever one could be cut; free-form only as a last resort
  const pool = cands.some(x => x.fig) ? cands.filter(x => x.fig) : cands;
  pool.sort((a, b) => a.e - b.e || a.c - b.c);
  const pick = pool[Math.round(cfg.q * (pool.length - 1))]; pick.cfg = cfg; pick.mirror = mirror; return pick;
}

// ===================== geometry of a set of cells =====================
function geom(cells){
  let sx = 0, sy = 0; const tris = [], ec = new Map();
  for (const c of cells){ const p = cxy(c); sx += p[0]; sy += p[1]; const vs = cverts(c); tris.push(vs.map(vxy));
    for (let e = 0; e < 3; e++){ const a = vs[e], b = vs[(e + 1) % 3], ka = a[0] + ',' + a[1], kb = b[0] + ',' + b[1];
      const k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const o = ec.get(k); if (o) o.n++; else ec.set(k, { n: 1, a, b }); } }
  const cx = sx / cells.length, cy = sy / cells.length, outer = [], inner = [];
  for (const e of ec.values()) (e.n === 1 ? outer : inner).push(e);
  const adj = new Map();
  for (const e of outer) for (const pq of [[e.a, e.b], [e.b, e.a]]){ const k = pq[0][0] + ',' + pq[0][1];
    if (!adj.has(k)) adj.set(k, []); adj.get(k).push({ to: pq[1], e }); }
  const used = new Set(), loops = [];
  for (const e of outer){ if (used.has(e)) continue; used.add(e);
    const loop = [e.a], sk = e.a[0] + ',' + e.a[1]; let cur = e.b;
    for (;;){ const k = cur[0] + ',' + cur[1]; if (k === sk) break; loop.push(cur);
      const nx = adj.get(k).find(o => !used.has(o.e)); if (!nx) break; used.add(nx.e); cur = nx.to; }
    loops.push(loop.map(vxy)); }
  let hw = 0, hh = 0, R = 0, minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (const T of tris) for (const p of T){ hw = Math.max(hw, Math.abs(p[0] - cx)); hh = Math.max(hh, Math.abs(p[1] - cy));
    R = Math.max(R, Math.hypot(p[0] - cx, p[1] - cy));
    minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
  const bevel = tris.map(T => { const gx = (T[0][0] + T[1][0] + T[2][0]) / 3, gy = (T[0][1] + T[1][1] + T[2][1]) / 3;
    return T.map(p => [gx + (p[0] - gx) * 0.5, gy + (p[1] - gy) * 0.5]); });
  return { cx, cy, loops, bevel, inner: inner.map(e => [vxy(e.a), vxy(e.b)]), hw, hh, R, minx, maxx, miny, maxy };
}
/*CORE-END*/

// ===================== text =====================
const T = {
  zh: { title: '角角入位', sub: '用彩色三角拼块填满小动物，它就会活过来！',
        zoo: '我的动物园', cont: n => '继续 · 第 ' + n + ' 关', done: (a, b) => '已过 ' + a + ' 关 · 当前第 ' + b + ' 关', zooN: (a, b) => '已收集 ' + a + ' / ' + b + ' 只', newZoo: '认识了新朋友！', locked: '？？？',
        zooTip: '过关就能认识新动物，点一点小伙伴跟它打个招呼', zooAll: '所有小动物都找到啦！', names: ['入门', '普通', '困难', '大师'],
        pcs: (a, b) => a + '–' + b + ' 块', rot: ' · 要旋转', lv: n => '第 ' + n + ' 关', hint: '提示', reset: '重来', back: '返回',
        tipDrag: '按住拼块，拖进白色图形', tipRot: '点一下拼块可以旋转', tipFlip: '有的拼块要先翻面才放得进去',
        extra: n => '有 ' + n + ' 块是多余的，用不上', extraShort: n => '多 ' + n + ' 块',
        dead: '这样拼不满了，挪一块试试，或者点提示',
        rotBtn: '旋转', flipBtn: '翻面', noHint: '没用提示', usedHint: n => '用了 ' + n + ' 次提示', win: '拼好了！', next: '下一关', again: '再玩一次', sOn: '声音：开', sOff: '声音：关', rotate: '请竖着拿手机玩',
        share: '发笔记', shareTitle: '我的三角动物园', shareBusy: '正在生成图片…', shareFail: '没能打开发布页，请稍后再试', shareLeft: k => '还差 ' + k + ' 只没找到，一起来拼吧！',
        shareText: (a, b) => '在「角角入位」里用三角拼块拼出了 ' + a + ' / ' + b + ' 只小动物，你能集齐吗？ #益智游戏 #拼图 #小游戏',
        figs: { cat: '猫咪', fox: '狐狸', bear: '小熊', panda: '熊猫', pig: '小猪', rabbit: '兔子', owl: '猫头鹰', frog: '青蛙', mouse: '小老鼠', lion: '狮子', penguin: '企鹅', chick: '小鸡', fish: '小鱼', whale: '鲸鱼', turtle: '乌龟', snail: '蜗牛', duck: '鸭子', crab: '螃蟹', butterfly: '蝴蝶', dino: '恐龙', elephant: '大象', octopus: '章鱼' } },
};

// ===================== save =====================
const SKEY = 'tri-zoo-v1';
let save = { lang: 'zh', zoo: {}, done: [{}, {}, {}, {}], sound: true, prog: [1, 1, 1, 1], cur: [null, null, null, null] };
function readSave(){ try { const raw = window.TZP.getItem(SKEY);
  const s = JSON.parse(raw || 'null'); if (s && Array.isArray(s.prog)) save = Object.assign(save, s); } catch (e) {}
  if (!Array.isArray(save.cur)) save.cur = [null, null, null, null]; if (!save.zoo || typeof save.zoo !== 'object') save.zoo = {};
  if (!Array.isArray(save.done) || save.done.length !== 4) save.done = [{}, {}, {}, {}]; }
readSave();
function pickLang(){ save.lang = 'zh'; }
pickLang();
function persist(){ try { window.TZP.setItem(SKEY, JSON.stringify(save)); } catch (e) {} }
const L = () => T.zh;

let cgMuted = false, adPlaying = false;
const soundOn = () => save.sound && !cgMuted && !adPlaying && !document.hidden;
// ===================== AUDIO =====================
// 小红书容器不允许 data: 音频，背景音乐改为解码成 AudioBuffer 后循环播放；对外保持 play/pause/paused/load 的用法
function makeBufferMusic(){
  const m = { loop: true, volume: .28, preload: 'auto', paused: true, _src: null, _gain: null, _buf: null, _loading: null, _on: {} };
  m.addEventListener = (type, fn) => { (m._on[type] = m._on[type] || []).push(fn); };
  const emit = type => (m._on[type] || []).forEach(fn => { try { fn(); } catch (_) {} });
  const decode = () => {
    if (m._buf) return Promise.resolve(m._buf);
    if (!m._loading) m._loading = audioData().then(data => {
      const bytes = Uint8Array.from(atob(data.music.split(',')[1]), c => c.charCodeAt(0)).buffer;
      return new Promise((ok, bad) => AC.decodeAudioData(bytes, ok, bad));
    }).then(buf => { m._buf = buf; return buf; }, err => { m._loading = null; emit('error'); throw err; });
    return m._loading;
  };
  m.load = () => { m._loading = null; };
  m.play = () => {
    if (!AC) return Promise.reject(new Error('no audio context'));
    m.paused = false;
    return decode().then(buf => {
      if (m.paused || m._src) return;
      if (AC.state === 'suspended') { m.paused = true; const e = new Error('suspended'); e.name = 'NotAllowedError'; throw e; }
      const src = AC.createBufferSource(), g = AC.createGain();
      src.buffer = buf; src.loop = m.loop; g.gain.value = m.volume;
      src.connect(g); g.connect(output); src.start();
      m._src = src; m._gain = g; emit('playing');
    });
  };
  m.pause = () => {
    const was = !m.paused || m._src; m.paused = true;
    if (m._src){ try { m._src.stop(); } catch (_) {} m._src.disconnect(); m._gain.disconnect(); m._src = null; m._gain = null; }
    if (was) emit('pause');
  };
  return m;
}
// 音频数据较大（约 0.9 MB），放在 js/audio-data.js，进入菜单后再加载；首次出声前等待它
let audioDataP = null;
function audioData(){
  if (window.TRIANGLE_AUDIO) return Promise.resolve(window.TRIANGLE_AUDIO);
  if (!audioDataP) audioDataP = new Promise((ok, bad) => {
    const el = document.createElement('script'); el.src = './js/audio-data.js';
    el.addEventListener('load', () => window.TRIANGLE_AUDIO ? ok(window.TRIANGLE_AUDIO) : bad(new Error('audio data missing')));
    el.addEventListener('error', () => { audioDataP = null; el.parentNode.removeChild(el); bad(new Error('audio data failed to load')); });
    document.body.appendChild(el);
  });
  return audioDataP;
}

// [AUDIO-HOOK] All sound goes through two functions: sfx(name) and music(). Nothing else in the file touches audio.
// The tones below are placeholders. To use recorded effects, add the file under its event name in SFX_FILES;
// any name left out keeps its placeholder tone. Every call site is tagged with "[AUDIO] name" for searching.
//
//   name      when it plays                                         suggested length
//   tap       a menu row or button is pressed                        < 0.1 s
//   start     a level opens                                          ~ 0.4 s
//   pick      a finger picks a piece up                              < 0.1 s
//   place     a piece snaps into the board                           ~ 0.15 s
//   back      a piece goes back to the tray, or Reset                ~ 0.15 s
//   rot       a piece turns 60 degrees                               < 0.1 s
//   flip      a piece is mirrored                                    ~ 0.15 s
//   hint      a hint appears                                         ~ 0.3 s
//   dead      the "cannot be finished" warning appears               ~ 0.3 s
//   win       the board is complete (fanfare)                        ~ 1.5 s
//   firework  each firework burst in the celebration (6 per win)     ~ 0.5 s
//   star      each star landing on the result card (1 to 3 per win)  ~ 0.2 s
//
// [AUDIO-HOOK] Background music: put a looping track in MUSIC_FILE. It starts on the first touch,
// follows the Sound switch on the menu, and pauses when the page is hidden.
// Audio-only integration: the original puzzle rules, interface and save format stay unchanged.
let AC = null, bgm = null, output = null, audioLoading = null;
const audioCache = {}, activeSounds = new Set(), recentSounds = {};
const audioHealth = { decoded: 0, error: '', music: 'idle' };
let musicPending = false, musicEpoch = 0;
function soundMessage() {
  return '声音没能加载，点这里重试';
}
function updateAudioStatus() {
  const button = document.getElementById('bSound');
  if (button) {
    button.setAttribute('aria-pressed', String(!!save.sound));
    button.dataset.audioDecoded = String(audioHealth.decoded);
    button.dataset.audioMusic = audioHealth.music;
  }
  let status = document.getElementById('triangle-audio-status');
  if (!status && audioHealth.error && button) {
    status = document.createElement('button');
    status.id = 'triangle-audio-status';
    status.type = 'button';
    status.setAttribute('role', 'status');
    status.style.cssText = 'font:inherit;font-size:12px;color:#a33b21;padding:8px';
    status.onclick = () => { audioHealth.error = ''; audioLoading = null; initTriangleAudio(); if (bgm) bgm.load(); music(); };
    button.parentElement.appendChild(status);
  }
  if (status) { status.hidden = !audioHealth.error; status.textContent = soundMessage(); }
}
function audioProblem(error) {
  audioHealth.error = String((error && error.message) || error);
  console.warn('角角入位 audio:', error);
  updateAudioStatus();
}
function quietSounds() {
  if (output && AC) output.gain.setTargetAtTime(soundOn() ? .7 : 0, AC.currentTime, .015);
  if (!soundOn()) {
    if (musicPending) { musicEpoch++; musicPending = false; }
    if (bgm) bgm.pause();
    for (const source of activeSounds) { try { source.stop(); } catch (_) {} }
    activeSounds.clear();
    audioHealth.music = 'paused';
  }
}
function initTriangleAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      output = AC.createGain();
      const limiter = AC.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.ratio.value = 6;
      output.connect(limiter); limiter.connect(AC.destination);
    } catch (error) { audioProblem(error); return Promise.resolve(); }
  }
  quietSounds();
  if (AC.state === 'suspended') AC.resume().then(() => { if (soundOn() && bgm && bgm.paused) music(); }, audioProblem);
  if (!audioLoading) {
    audioLoading = audioData().then(data => Promise.all(Object.entries(data.sfx).map(async ([name, uri]) => {
      try {
        const bytes = Uint8Array.from(atob(uri.split(',')[1]), c => c.charCodeAt(0)).buffer;
        audioCache[name] = await new Promise((ok, bad) => AC.decodeAudioData(bytes, ok, bad));
      } catch (error) { audioProblem(new Error(name + ': ' + (error && error.message))); }
    }))).then(() => { audioHealth.decoded = Object.keys(audioCache).length; updateAudioStatus(); }, error => { audioLoading = null; audioProblem(error); });
  }
  return audioLoading;
}
function playTriangleSound(name) {
  if (!soundOn() || !AC || AC.state !== 'running' || !audioCache[name] || activeSounds.size >= 12) return;
  const now = AC.currentTime;
  if (now - (recentSounds[name] != null ? recentSounds[name] : -1) < .055) return;
  recentSounds[name] = now;
  const source = AC.createBufferSource(), gain = AC.createGain();
  source.buffer = audioCache[name];
  gain.gain.value = name === 'firework' ? .45 : name === 'win' ? .8 : .9;
  source.connect(gain); gain.connect(output);
  activeSounds.add(source);
  source.onended = () => { activeSounds.delete(source); source.disconnect(); gain.disconnect(); };
  source.start();
}
function sfx(name) {
  if (!soundOn()) return;
  const ready = initTriangleAudio();
  if (audioCache[name]) playTriangleSound(name);
  else if (ready) ready.then(() => playTriangleSound(name));
}
function music() {
  quietSounds();
  if (!soundOn()) { updateAudioStatus(); return; }
  initTriangleAudio();
  if (!bgm) {
    bgm = makeBufferMusic();
    bgm.loop = true; bgm.volume = .28; bgm.preload = 'auto';
    bgm.addEventListener('error', () => audioProblem(new Error('Music could not be decoded')));
    bgm.addEventListener('playing', () => { audioHealth.music = 'playing'; updateAudioStatus(); });
    bgm.addEventListener('pause', () => { audioHealth.music = 'paused'; updateAudioStatus(); });
  }
  if (bgm.paused && !musicPending) {
    musicPending = true;
    const epoch = ++musicEpoch;
    bgm.play().catch(error => {
      // The next actual gesture retries an autoplay denial; real decode errors are visible.
      if (!['NotAllowedError', 'AbortError'].includes(error.name)) audioProblem(error);
    }).then(() => { if (epoch === musicEpoch) musicPending = false; }, () => { if (epoch === musicEpoch) musicPending = false; });
  }
  updateAudioStatus();
}
document.addEventListener('pointerdown', () => { if (soundOn()) music(); }, { passive: true });
document.addEventListener('keydown', () => { if (soundOn()) music(); });
document.addEventListener('visibilitychange', music);
window.addEventListener('pagehide', () => {
  if (bgm) bgm.pause();
  for (const source of activeSounds) { try { source.stop(); } catch (_) {} }
  activeSounds.clear();
});



// ===================== colours =====================
function mix(a, b, f){ const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((pa >> s) & 255) * (1 - f) + ((pb >> s) & 255) * f);
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')'; }
const PAL = ['#F0685C', '#F7973B', '#F5C63C', '#69BE66', '#35B3AC', '#4C98E6', '#9879DE', '#F07FAE']
  .map(b => ({ base: b, light: mix(b, '#ffffff', 0.4), dark: mix(b, '#000000', 0.34), side: mix(b, '#000000', 0.2) }));
const INK = '#1E3A4C';

function paths(g){
  const body = new Path2D(), bevel = new Path2D(), lines = new Path2D();
  for (const Lp of g.loops){ Lp.forEach((p, i) => i ? body.lineTo(p[0], p[1]) : body.moveTo(p[0], p[1])); body.closePath(); }
  for (const Tr of g.bevel){ bevel.moveTo(Tr[0][0], Tr[0][1]); bevel.lineTo(Tr[1][0], Tr[1][1]); bevel.lineTo(Tr[2][0], Tr[2][1]); bevel.closePath(); }
  for (const e of g.inner){ lines.moveTo(e[0][0], e[0][1]); lines.lineTo(e[1][0], e[1][1]); }
  g.body = body; g.bevelP = bevel; g.lines = lines; return g;
}
// o: { ang, fx, shadow, halo, lift }. lift is the thickness of the tile; the face stays put and the side shows below it.
function drawTile(ctx, g, col, x, y, k, o){
  o = o || {}; const a0 = ctx.globalAlpha, lift = o.lift || 0;
  ctx.save(); ctx.translate(x, y); if (o.ang) ctx.rotate(o.ang); ctx.scale(k * (o.fx === undefined ? 1 : o.fx), k); ctx.translate(-g.cx, -g.cy);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.shadow){ ctx.save(); ctx.translate(0, lift + o.shadow); ctx.fillStyle = 'rgba(24,52,68,.2)'; ctx.fill(g.body, 'evenodd'); ctx.restore(); }
  if (o.halo){ for (const dy of [0, lift]){ ctx.save(); ctx.translate(0, dy); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.34; ctx.stroke(g.body); ctx.strokeStyle = INK; ctx.lineWidth = 0.2; ctx.stroke(g.body); ctx.restore(); } }
  if (lift > 0.004){ ctx.fillStyle = col.side; ctx.strokeStyle = col.dark; ctx.lineWidth = 0.085;
    ctx.save(); ctx.translate(0, lift); ctx.fill(g.body, 'evenodd'); ctx.stroke(g.body); ctx.restore();
    ctx.save(); ctx.translate(0, lift / 2); ctx.fill(g.body, 'evenodd'); ctx.restore(); }
  ctx.fillStyle = col.base; ctx.fill(g.body, 'evenodd');
  ctx.fillStyle = col.light; ctx.strokeStyle = col.light; ctx.lineWidth = 0.09; ctx.fill(g.bevelP); ctx.stroke(g.bevelP);
  ctx.strokeStyle = col.dark; ctx.globalAlpha = a0 * 0.4; ctx.lineWidth = 0.03; ctx.stroke(g.lines); ctx.globalAlpha = a0;
  ctx.lineWidth = 0.085; ctx.stroke(g.body);
  ctx.restore();
}

// ===================== zoo: faces and life =====================
// mp(u) maps a point of the animal's unit box to the canvas; k is canvas pixels per unit; open is 0 (eyes shut) .. 1
function drawZooFace(c, d, mp, k, open){
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const fill = (col, a) => { c.globalAlpha = a; c.fillStyle = col; c.fill(); c.globalAlpha = 1; };
  for (const q of d.deco || []){
    c.beginPath();
    if (q[0] === 'e'){ const p = mp([q[1], q[2]]); c.ellipse(p[0], p[1], q[3] * k, q[4] * k, 0, 0, 7); fill(q[5], q[6]); }
    else if (q[0] === 'c'){ const p = mp([q[1], q[2]]); c.arc(p[0], p[1], q[3] * k, 0, 7); fill(q[4], q[5]); }
    else { q[1].forEach((u, n) => { const p = mp(u); n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); fill(q[2], q[3]); }
  }
  const er = Math.max(2.6, (d.er || .055) * k), side = d.eyes.length === 1;
  // cheeks
  for (const e of d.eyes){ const p = mp(e), dx = side ? 0 : (e[0] < .5 ? -1 : 1) * 0.5 * er, q = mp([e[0], e[1] + (d.er || .055) * 1.9]);
    c.beginPath(); c.ellipse(q[0] + dx, q[1], er * 1.05, er * .62, 0, 0, 7); fill('#FF8FA8', .55); }
  for (const e of d.eyes){ const p = mp(e);
    c.beginPath(); c.ellipse(p[0], p[1], er * 1.25, er * 1.25 * Math.max(.12, open), 0, 0, 7); fill('#FFFFFF', 1);
    c.beginPath(); c.ellipse(p[0], p[1] + er * .12, er * .82, er * .82 * Math.max(.1, open), 0, 0, 7); fill('#1E3A4C', 1);
    if (open > .5){ c.beginPath(); c.arc(p[0] - er * .28, p[1] - er * .22, er * .3, 0, 7); fill('#FFFFFF', 1); } }
  const lw = Math.max(1.4, k * .022);
  if (d.nose){ const p = mp(d.nose); c.beginPath(); c.ellipse(p[0], p[1], Math.max(2, k * .04), Math.max(1.5, k * .028), 0, 0, 7); fill('#1E3A4C', 1); }
  if (d.mouth){ const p = mp(d.mouth), r = Math.max(2.5, k * (d.wide ? .12 : .05));
    c.beginPath(); c.arc(p[0], p[1] - r * .6, r, .2 * Math.PI, .8 * Math.PI); c.strokeStyle = '#1E3A4C'; c.lineWidth = lw; c.stroke(); }
  if (d.beak){ const p = mp(d.beak), r = Math.max(3, k * .07);
    c.beginPath(); c.moveTo(p[0] - r, p[1] - r * .4); c.lineTo(p[0] + r, p[1] - r * .4); c.lineTo(p[0], p[1] + r * .8); c.closePath(); fill('#FF9F1C', 1);
    c.strokeStyle = '#B86A0E'; c.lineWidth = lw * .7; c.stroke(); }
  c.restore();
}
// blink: eyes close briefly every few seconds
function zooOpen(t, ph){ const u = (t + ph) % 3.4; return u < 3.22 ? 1 : Math.abs(u - 3.31) / 0.09; }
// hop: [dy, squash] for a hop every 2.6 s; amp in pixels
function zooHop(t, amp){
  const u = t % 2.6;
  if (u < 0.12) { const a = Math.sin(u / 0.12 * Math.PI); return [0, 0.07 * a]; }               // crouch
  if (u < 0.62) { const a = (u - 0.12) / 0.5; return [-Math.sin(a * Math.PI) * amp, -0.05 * Math.sin(a * Math.PI)]; }   // jump, stretched
  if (u < 0.78) { const a = Math.sin((u - 0.62) / 0.16 * Math.PI); return [0, 0.06 * a]; }      // land
  return [0, 0];
}
// the in-game mapping from the animal's unit box to the screen
function zooMap(){
  const z = G && G.zoo; if (!z) return null;
  return u => { let lx = u[0] * z.s; if (z.mirror) lx = z.c - lx; return [BX + S * lx, BY + S * u[1] * z.s]; };
}
// a puff of stars as the pieces turn into the animal
function zooPoof(){
  sfx('flip'); /* [AUDIO] flip */ if (reduced) return;
  const b = G.board, x = BX + S * (b.minx + b.maxx) / 2, y = BY + S * (b.miny + b.maxy) / 2, R = S * Math.max(b.maxx - b.minx, b.maxy - b.miny) / 2;
  for (let i = 0; i < 26; i++){ const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
    parts.push({ kind: 'star', x: x + Math.cos(a) * R * 0.5, y: y + Math.sin(a) * R * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 60, drag: 2.5, s: 6 + Math.random() * 6, c: i % 2 ? '#FFFFFF' : '#FFD25E', life: 0.6 + Math.random() * 0.4, max: 1 }); }
  parts.push({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 0, r: R * 0.4, vr: 500, c: '#FFFFFF', life: 0.4, max: 0.4 });
}

// ===================== zoo: illustrations =====================
// One flat cartoon per animal, drawn in a 100 x 100 box. It replaces the pieces when the board is complete
// and is the picture in the zoo album. Side-view animals face the same way as their board outline.
const ZI = '#1E3A4C';
const zEye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${ZI}" stroke-width="2"/><circle cx="${x + r * .1}" cy="${y + r * .15}" r="${r * .62}" fill="${ZI}" stroke="none"/><circle cx="${x - r * .2}" cy="${y - r * .2}" r="${r * .25}" fill="#fff" stroke="none"/>`;
const zDot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ZI}" stroke="none"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .35}" fill="#fff" stroke="none"/>`;
const zCheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.6" fill="#FF8FA8" opacity=".6" stroke="none"/>`;
const zSmile = (x, y, w) => `<path d="M${x - w} ${y}q${w} ${w * .9} ${2 * w} 0" fill="none" stroke="${ZI}" stroke-width="2.2" stroke-linecap="round"/>`;
const ZOO_ART = {
  cat: `<path d="M18 46 L20 8 L44 26 Z M82 46 L80 8 L56 26 Z" fill="#F7973B"/><path d="M24 38 L25 17 L38 28 Z M76 38 L75 17 L62 28 Z" fill="#FFC9A3" stroke="none"/>
    <circle cx="50" cy="58" r="36" fill="#F7973B"/><path d="M50 22 l-4 12 h8 z M36 25 l0 10 M64 25 l0 10" fill="#D9741F" stroke="#D9741F"/>
    <ellipse cx="50" cy="72" rx="18" ry="12" fill="#FFE3CC" stroke="none"/>${zEye(37, 55, 6.5)}${zEye(63, 55, 6.5)}${zCheek(28, 66)}${zCheek(72, 66)}
    <path d="M46 66 h8 l-4 4 z" fill="#F07FAE"/>${zSmile(45, 72, 5)}<path d="M8 62 l16 2 M8 70 l16 -1 M92 62 l-16 2 M92 70 l-16 -1" stroke-width="1.6"/>`,
  fox: `<path d="M10 36 L18 4 L42 26 Z M90 36 L82 4 L58 26 Z" fill="#F7973B"/><path d="M17 30 L21 13 L34 25 Z M83 30 L79 13 L66 25 Z" fill="#3A2A2A" stroke="none"/>
    <path d="M6 34 Q50 8 94 34 Q86 66 50 96 Q14 66 6 34 Z" fill="#F7973B"/><path d="M20 58 Q36 60 50 70 Q64 60 80 58 Q70 80 50 96 Q30 80 20 58 Z" fill="#fff"/>
    ${zEye(35, 46, 6)}${zEye(65, 46, 6)}${zCheek(25, 58)}${zCheek(75, 58)}<ellipse cx="50" cy="88" rx="5" ry="3.6" fill="${ZI}"/>`,
  bear: `<circle cx="20" cy="22" r="14" fill="#A0714F"/><circle cx="80" cy="22" r="14" fill="#A0714F"/><circle cx="20" cy="22" r="7" fill="#E7C29F" stroke="none"/><circle cx="80" cy="22" r="7" fill="#E7C29F" stroke="none"/>
    <circle cx="50" cy="56" r="38" fill="#A0714F"/><ellipse cx="50" cy="70" rx="17" ry="13" fill="#E7C29F"/>${zEye(36, 50, 6)}${zEye(64, 50, 6)}${zCheek(26, 63)}${zCheek(74, 63)}
    <ellipse cx="50" cy="64" rx="6" ry="4.4" fill="${ZI}"/><path d="M50 68 v5" stroke-width="2"/>${zSmile(44, 73, 6)}`,
  panda: `<circle cx="20" cy="22" r="14" fill="${ZI}"/><circle cx="80" cy="22" r="14" fill="${ZI}"/>
    <circle cx="50" cy="56" r="38" fill="#fff"/><ellipse cx="35" cy="52" rx="10" ry="12" fill="${ZI}" transform="rotate(25 35 52)"/><ellipse cx="65" cy="52" rx="10" ry="12" fill="${ZI}" transform="rotate(-25 65 52)"/>
    <circle cx="36" cy="51" r="4.5" fill="#fff" stroke="none"/><circle cx="64" cy="51" r="4.5" fill="#fff" stroke="none"/><circle cx="37" cy="52" r="2.6" fill="${ZI}"/><circle cx="63" cy="52" r="2.6" fill="${ZI}"/>
    ${zCheek(26, 68)}${zCheek(74, 68)}<ellipse cx="50" cy="66" rx="5.5" ry="4" fill="${ZI}"/>${zSmile(45, 73, 5)}`,
  pig: `<path d="M14 40 L10 6 L40 24 Z M86 40 L90 6 L60 24 Z" fill="#F7A3C0"/><ellipse cx="50" cy="56" rx="42" ry="36" fill="#F7A3C0"/>
    ${zEye(33, 46, 6)}${zEye(67, 46, 6)}${zCheek(22, 60)}${zCheek(78, 60)}<ellipse cx="50" cy="66" rx="15" ry="11" fill="#FFC2D6"/>
    <ellipse cx="44" cy="66" rx="2.8" ry="4" fill="#B0476E" stroke="none"/><ellipse cx="56" cy="66" rx="2.8" ry="4" fill="#B0476E" stroke="none"/>${zSmile(45, 82, 5)}`,
  rabbit: `<ellipse cx="35" cy="26" rx="10" ry="25" fill="#fff"/><ellipse cx="65" cy="26" rx="10" ry="25" fill="#fff"/><ellipse cx="35" cy="28" rx="4.6" ry="17" fill="#FFC2D6" stroke="none"/><ellipse cx="65" cy="28" rx="4.6" ry="17" fill="#FFC2D6" stroke="none"/>
    <circle cx="50" cy="68" r="30" fill="#fff"/>${zEye(39, 64, 5.5)}${zEye(61, 64, 5.5)}${zCheek(31, 75)}${zCheek(69, 75)}
    <path d="M46 73 h8 l-4 4 z" fill="#F07FAE"/><path d="M50 77 v3" stroke-width="2"/>${zSmile(45, 80, 5)}`,
  owl: `<path d="M12 34 L12 4 L38 22 Z M88 34 L88 4 L62 22 Z" fill="#9C6B45"/><ellipse cx="50" cy="58" rx="38" ry="40" fill="#9C6B45"/>
    <ellipse cx="50" cy="74" rx="22" ry="20" fill="#F2D6A8"/><path d="M38 70 q4 4 8 0 M54 70 q4 4 8 0 M44 80 q6 5 12 0" fill="none" stroke="#C49A63" stroke-width="2"/>
    <circle cx="33" cy="42" r="15" fill="#F2D6A8"/><circle cx="67" cy="42" r="15" fill="#F2D6A8"/>${zEye(33, 42, 9.5)}${zEye(67, 42, 9.5)}
    <path d="M44 52 h12 l-6 9 z" fill="#FF9F1C"/><path d="M24 98 l4 -6 l4 6 M68 98 l4 -6 l4 6" fill="#FF9F1C"/>`,
  frog: `<ellipse cx="50" cy="66" rx="46" ry="30" fill="#69BE66"/><circle cx="26" cy="36" r="17" fill="#69BE66"/><circle cx="74" cy="36" r="17" fill="#69BE66"/>
    ${zEye(26, 36, 10)}${zEye(74, 36, 10)}<ellipse cx="50" cy="80" rx="28" ry="12" fill="#B7E3A6" stroke="none"/>${zCheek(18, 62)}${zCheek(82, 62)}
    <path d="M28 62 Q50 82 72 62" fill="#E2566B"/><circle cx="44" cy="52" r="1.6" fill="${ZI}"/><circle cx="56" cy="52" r="1.6" fill="${ZI}"/>`,
  mouse: `<circle cx="20" cy="30" r="20" fill="#A9B4BD"/><circle cx="80" cy="30" r="20" fill="#A9B4BD"/><circle cx="20" cy="30" r="11" fill="#FFC2D6" stroke="none"/><circle cx="80" cy="30" r="11" fill="#FFC2D6" stroke="none"/>
    <path d="M22 56 Q22 34 50 34 Q78 34 78 56 Q74 90 50 96 Q26 90 22 56 Z" fill="#A9B4BD"/>${zEye(39, 60, 5.5)}${zEye(61, 60, 5.5)}${zCheek(30, 74)}${zCheek(70, 74)}
    <circle cx="50" cy="82" r="5" fill="#F07FAE"/><path d="M12 76 l22 -2 M12 86 l22 -6 M88 76 l-22 -2 M88 86 l-22 -6" stroke-width="1.6"/>`,
  lion: `<path d="${Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12, r = i % 2 ? 40 : 49; return (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (50 + r * Math.sin(a)).toFixed(1); }).join(' ')} Z" fill="#D9741F"/>
    <circle cx="20" cy="26" r="8" fill="#F5C63C"/><circle cx="80" cy="26" r="8" fill="#F5C63C"/><circle cx="50" cy="52" r="30" fill="#F5C63C"/>
    <ellipse cx="50" cy="64" rx="14" ry="10" fill="#FFF1C9"/>${zEye(39, 47, 5.5)}${zEye(61, 47, 5.5)}${zCheek(30, 59)}${zCheek(70, 59)}
    <path d="M45 57 h10 l-5 5 z" fill="#6B3E26"/>${zSmile(45, 66, 5)}`,
  penguin: `<path d="M24 40 L6 78 L26 72 Z M76 40 L94 78 L74 72 Z" fill="#2E4A5E"/><ellipse cx="50" cy="54" rx="30" ry="44" fill="#2E4A5E"/>
    <path d="M50 22 Q72 26 70 50 Q74 92 50 96 Q26 92 30 50 Q28 26 50 22 Z" fill="#fff"/>${zEye(41, 34, 5.5)}${zEye(59, 34, 5.5)}${zCheek(35, 46)}${zCheek(65, 46)}
    <path d="M44 42 h12 l-6 7 z" fill="#FF9F1C"/><path d="M34 98 q6 -6 12 0 z M54 98 q6 -6 12 0 z" fill="#FF9F1C"/>`,
  chick: `<path d="M40 26 L44 6 L50 22 L58 6 L60 26 Z" fill="#FFD25E"/><circle cx="50" cy="60" r="38" fill="#FFD25E"/><path d="M14 64 q-6 12 8 16 M86 64 q6 12 -8 16" fill="none" stroke-width="2.2"/>
    ${zEye(37, 54, 6)}${zEye(63, 54, 6)}${zCheek(27, 66)}${zCheek(73, 66)}<path d="M42 62 h16 l-8 10 z" fill="#FF9F1C"/>`,
  fish: `<path d="M66 50 L98 18 L94 50 L98 82 Z" fill="#35B3AC"/><ellipse cx="42" cy="50" rx="38" ry="28" fill="#35B3AC"/>
    <path d="M30 24 Q46 8 58 26 Z M36 76 Q46 90 54 74 Z" fill="#2A8F89"/><path d="M50 30 q8 20 0 40 M60 34 q6 16 0 32" fill="none" stroke="#2A8F89" stroke-width="2.4"/>
    ${zEye(22, 44, 7)}${zCheek(24, 58)}<path d="M6 54 q5 4 10 0" fill="none" stroke-width="2.2"/>`,
  whale: `<path d="M76 58 L102 20 L98 44 L86 64 Z" fill="#4C98E6"/><path d="M2 60 Q2 30 44 30 Q86 30 88 62 Q86 90 44 90 Q2 90 2 60 Z" fill="#4C98E6"/>
    <path d="M8 70 Q44 98 82 72 Q60 84 44 84 Q20 84 8 70 Z" fill="#DCEEFF"/><path d="M36 26 q-2 -10 -8 -14 M36 26 q2 -10 8 -14" fill="none" stroke="#7FC4F5" stroke-width="3"/>
    ${zEye(22, 56, 6)}${zCheek(26, 68)}${zSmile(10, 70, 6)}<path d="M50 70 q10 8 18 0" fill="none" stroke="#2F6FB0" stroke-width="2.2"/>`,
  turtle: `<circle cx="30" cy="80" r="9" fill="#8BCF73"/><circle cx="70" cy="80" r="9" fill="#8BCF73"/><path d="M14 60 L0 70 L16 72 Z" fill="#8BCF73"/><circle cx="88" cy="55" r="12" fill="#8BCF73"/>
    <path d="M14 66 Q14 26 50 26 Q86 26 86 66 Z" fill="#4E9A49"/><path d="M38 34 l12 -6 l12 6 l0 14 l-12 6 l-12 -6 z M24 54 l8 -10 M76 54 l-8 -10 M38 48 l-10 14 M62 48 l10 14" fill="#69BE66" stroke-width="2"/>
    <path d="M10 66 h80" stroke-width="2.6"/>${zDot(91, 51, 3.4)}${zSmile(88, 59, 3)}`,
  snail: `<path d="M2 86 Q2 70 18 70 L80 74 Q98 76 98 86 Q98 94 80 94 L14 94 Q2 94 2 86 Z" fill="#F7C89A"/>
    <path d="M10 70 L6 52 M18 68 L18 50" stroke-width="2.4"/><circle cx="6" cy="51" r="3" fill="${ZI}"/><circle cx="18" cy="49" r="3" fill="${ZI}"/>
    <circle cx="60" cy="48" r="30" fill="#9879DE"/><path d="M60 48 m0 -20 a20 20 0 1 1 -18 26 a13 13 0 1 1 22 -12 a6 6 0 1 1 -8 6" fill="none" stroke="#6F4FC2" stroke-width="3"/>
    ${zCheek(16, 82)}${zSmile(4, 80, 4)}`,
  duck: `<path d="M86 58 L100 34 L96 66 Z" fill="#FFD25E"/><ellipse cx="56" cy="68" rx="40" ry="25" fill="#FFD25E"/><path d="M40 62 Q60 56 74 70 Q58 80 42 72 Z" fill="#F5B82E"/>
    <path d="M30 50 L42 52 L36 64 Z" fill="#FFD25E" stroke="none"/><circle cx="28" cy="34" r="19" fill="#FFD25E"/><path d="M12 36 L-2 40 Q4 48 14 44 Z" fill="#FF9F1C"/>
    ${zEye(24, 30, 5.5)}${zCheek(30, 42)}<path d="M40 96 l6 -6 l6 6 M60 96 l6 -6 l6 6" fill="#FF9F1C"/>`,
  crab: `<path d="M20 70 L4 90 M28 76 L16 96 M80 70 L96 90 M72 76 L84 96" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 34 Q16 46 30 54 M80 34 Q84 46 70 54" fill="none" stroke="#F0685C" stroke-width="7" stroke-linecap="round"/>
    <path d="M4 22 Q4 8 16 10 L14 22 L26 18 Q28 32 14 34 Q4 34 4 22 Z M96 22 Q96 8 84 10 L86 22 L74 18 Q72 32 86 34 Q96 34 96 22 Z" fill="#F0685C"/>
    <ellipse cx="50" cy="62" rx="38" ry="22" fill="#F0685C"/><path d="M40 44 V34 M60 44 V34" stroke-width="2.4"/>${zEye(40, 32, 5.5)}${zEye(60, 32, 5.5)}
    ${zCheek(30, 64)}${zCheek(70, 64)}${zSmile(45, 64, 5)}`,
  butterfly: `<ellipse cx="27" cy="35" rx="24" ry="25" fill="#F07FAE"/><ellipse cx="73" cy="35" rx="24" ry="25" fill="#F07FAE"/><ellipse cx="31" cy="72" rx="18" ry="18" fill="#9879DE"/><ellipse cx="69" cy="72" rx="18" ry="18" fill="#9879DE"/>
    <circle cx="25" cy="33" r="9" fill="#FFD25E"/><circle cx="75" cy="33" r="9" fill="#FFD25E"/><circle cx="30" cy="73" r="6" fill="#fff"/><circle cx="70" cy="73" r="6" fill="#fff"/>
    <ellipse cx="50" cy="58" rx="7" ry="34" fill="#5A4636"/><path d="M47 24 Q42 8 34 6 M53 24 Q58 8 66 6" fill="none" stroke-width="2.2"/><circle cx="34" cy="6" r="2.6" fill="${ZI}"/><circle cx="66" cy="6" r="2.6" fill="${ZI}"/>
    <circle cx="50" cy="28" r="9" fill="#5A4636"/>${zDot(46.5, 27, 2.2)}${zDot(53.5, 27, 2.2)}`,
  dino: `<path d="M24 60 L-2 88 L32 74 Z" fill="#69BE66"/><path d="M32 78 h12 v20 h-12 z M56 78 h12 v20 h-12 z" fill="#4E9A49"/><ellipse cx="48" cy="66" rx="30" ry="21" fill="#69BE66"/>
    <path d="M62 52 L70 22 L86 26 L76 58 Z" fill="#69BE66" stroke="none"/><path d="M62 52 L70 22 M86 26 L76 58" fill="none"/><ellipse cx="80" cy="22" rx="17" ry="11" fill="#69BE66"/>
    <path d="M30 46 l6 -9 l6 9 M44 44 l6 -10 l6 10 M58 48 l4 -8 l6 6" fill="#F5C63C"/><ellipse cx="46" cy="74" rx="18" ry="9" fill="#B7E3A6" stroke="none"/>
    ${zDot(84, 18, 3.4)}${zCheek(86, 27)}<path d="M90 28 q4 2 6 -1" fill="none" stroke-width="2"/>`,
  elephant: `<path d="M36 70 h12 v26 h-12 z M72 70 h12 v26 h-12 z" fill="#9AAFC0"/><ellipse cx="58" cy="55" rx="38" ry="28" fill="#9AAFC0"/>
    <path d="M10 44 Q4 70 6 90 Q12 96 18 90 Q16 70 22 52" fill="#9AAFC0"/><circle cx="26" cy="40" r="22" fill="#9AAFC0"/>
    <ellipse cx="42" cy="42" rx="14" ry="20" fill="#B9C9D6"/><ellipse cx="42" cy="43" rx="8" ry="13" fill="#FFC2D6" stroke="none"/>
    ${zDot(20, 36, 3.6)}${zCheek(24, 48)}<path d="M96 52 q6 6 2 14" fill="none" stroke-width="2.4"/>`,
  octopus: `${[20, 40, 60, 80].map(x => `<path d="M${x - 9} 52 Q${x - 12} 80 ${x - 4} 96 Q${x + 4} 98 ${x + 2} 88 Q${x} 74 ${x + 9} 52 Z" fill="#9879DE"/>`).join('')}
    <ellipse cx="50" cy="38" rx="36" ry="32" fill="#9879DE"/><circle cx="34" cy="20" r="4" fill="#B9A3EC" stroke="none"/><circle cx="68" cy="16" r="3" fill="#B9A3EC" stroke="none"/>
    ${zEye(38, 40, 6.5)}${zEye(62, 40, 6.5)}${zCheek(28, 52)}${zCheek(72, 52)}${zSmile(45, 53, 5)}`,
};
const zooArtImg = {};
function zooArt(id){ const im = zooArtImg[id]; return im && im.complete && im.naturalWidth ? im : null; }
// the art box is -4..104 in picture units
const ZA0 = -4, ZA1 = 104, ZAS = ZA1 - ZA0;
const zooArtLoaded = Promise.all(ZOO.map(d => new Promise(res => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ZA0 + ' ' + ZA0 + ' ' + ZAS + ' ' + ZAS + '" width="432" height="432"><g stroke="' + ZI + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">' + ZOO_ART[d.id] + '</g></svg>';
  const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false);
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); zooArtImg[d.id] = im; })));

// ---- the board for each animal is cut from its picture ----
// A grid triangle belongs to the board when most of it is covered by the picture. For each size the
// picture is slid around under the grid and the placement that matches the outline best is kept;
// sizes whose outline no longer looks like the picture are dropped.
const ZM = 216;   // alpha map resolution over the art box
function zooAlpha(id){
  const c = document.createElement('canvas'); c.width = c.height = ZM; const x = c.getContext('2d');
  x.drawImage(zooArtImg[id], 0, 0, ZM, ZM); const d = x.getImageData(0, 0, ZM, ZM).data, a = new Uint8Array(ZM * ZM);
  for (let n = 0; n < a.length; n++) a[n] = d[n * 4 + 3] > 110 ? 1 : 0; return a;
}
const ZBARY = []; for (let u = 0; u < 4; u++) for (let v = 0; v + u < 4; v++) ZBARY.push([(u + .5) / 4.5, (v + .5) / 4.5]);
// k: picture units per grid unit; (ox, oy): grid position of picture point (0, 0)
function zooCut(alpha, k, ox, oy){
  const L = ZA0 / k + ox, R = ZA1 / k + ox, T = ZA0 / k + oy, B = ZA1 / k + oy, cells = [], cov = [];
  const j0 = Math.floor(T / H) - 1, j1 = Math.ceil(B / H) + 1;
  for (let j = j0; j <= j1; j++) for (let i = Math.floor(L - j / 2) - 1; i <= Math.ceil(R - j / 2) + 1; i++) for (let t = 0; t < 2; t++){
    const vs = cverts([i, j, t]).map(vxy); let hit = 0;
    for (const w of ZBARY){ const px = vs[0][0] + (vs[1][0] - vs[0][0]) * w[0] + (vs[2][0] - vs[0][0]) * w[1], py = vs[0][1] + (vs[1][1] - vs[0][1]) * w[0] + (vs[2][1] - vs[0][1]) * w[1];
      const ax = Math.floor(((px - ox) * k - ZA0) / ZAS * ZM), ay = Math.floor(((py - oy) * k - ZA0) / ZAS * ZM);
      if (ax >= 0 && ay >= 0 && ax < ZM && ay < ZM && alpha[ay * ZM + ax]) hit++; }
    const f = hit / ZBARY.length; if (f > 0) cov.push([i, j, t, f]); }
  let inter = 0, uni = 0; const picked = [];
  for (const q of cov){ if (q[3] >= 0.5){ picked.push([q[0], q[1], q[2]]); inter += q[3]; uni += 1; } else uni += q[3]; }
  // one edge-connected piece, no stray triangles
  const set = new Map(picked.map(c => [K(c[0], c[1], c[2]), c])), seen = new Set(); let best = [];
  for (const [k0, c0] of set){ if (seen.has(k0)) continue; seen.add(k0); const comp = [c0];
    for (let h = 0; h < comp.length; h++) for (const nb of nbrs(comp[h])){ const kk = K(nb[0], nb[1], nb[2]); if (set.has(kk) && !seen.has(kk)){ seen.add(kk); comp.push(nb); } }
    if (comp.length > best.length) best = comp; }
  return { cells: best, iou: uni ? inter / uni * (best.length / Math.max(1, picked.length)) : 0 };
}
function buildZooFigs(){
  FIGS.length = 0;
  for (const d of ZOO){
    if (!zooArt(d.id)) continue;
    const alpha = zooAlpha(d.id), seen = new Set();
    for (const target of [20, 23, 27, 31, 36, 42, 48, 56, 66, 78, 90]){   // below ~20 triangles every head looks like a hexagon
      // scale for roughly this many triangles: area of the picture / area of one triangle
      let lo = 0.5, hi = 40, best = null;
      for (let n = 0; n < 12; n++){ const k = Math.sqrt(lo * hi), r = zooCut(alpha, k, 0, 0); if (r.cells.length > target) lo = k; else hi = k; }
      const k = Math.sqrt(lo * hi);
      for (let a = 0; a < 6; a++) for (let b = 0; b < 3; b++){ const r = zooCut(alpha, k, a / 6, b * H / 3);
        if (!best || r.iou > best.iou) best = Object.assign(r, { ox: a / 6, oy: b * H / 3, k }); }
      if (!best || best.cells.length < 19 || best.iou < 0.7 || seen.has(best.cells.length)) continue;
      seen.add(best.cells.length);
      FIGS.push({ id: d.id, cells: best.cells, n: best.cells.length, zoo: d, k: best.k, ox: best.ox, oy: best.oy, iou: best.iou });
    }
  }
}
// where the picture sits on the screen for a board drawn at (BX, BY, S); returns [left, top, size, flip]
function zooArtRect(f, mirror, c, bx, by, sc){
  const left = f.ox + ZA0 / f.k, top = f.oy + ZA0 / f.k, size = ZAS / f.k;
  return [bx + sc * (mirror ? c - left - size : left), by + sc * top, sc * size, mirror];
}
function drawZooArt(ctx, im, r){
  ctx.save(); if (r[3]){ ctx.translate(r[0] + r[2], r[1]); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, r[2], r[2]); } else ctx.drawImage(im, r[0], r[1], r[2], r[2]); ctx.restore();
}

// ===================== game state =====================
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let G = null, W = 0, Hc = 0, dpr = 1, S = 40, BX = 0, BY = 0, trayK = 30, trayRect = null, staticLayer = null;
let drag = null, parts = [], raf = 0, lastT = 0, clock = 0;
const LIFT_TRAY = 0.11, LIFT_HELD = 0.18;
const occ = new Map();

function setOri(p, r, f){ p.r = ((r % 6) + 6) % 6; p.f = f ? 1 : 0; p.cells = oriCells(p.base, p.r, p.f); p.g = paths(geom(p.cells)); }
function absKeys(p, off){ return p.cells.map(c => K(c[0] + off[0], c[1] + off[1], c[2])); }
function rebuildOcc(){ occ.clear(); for (const p of G.pieces) if (p.placed) for (const k of absKeys(p, p.placed)) occ.set(k, p.id); }
function fits(p, di, dj){ for (const c of p.cells){ const k = K(c[0] + di, c[1] + dj, c[2]);
  if (!G.boardSet.has(k)) return false; const o = occ.get(k); if (o !== undefined && o !== p.id) return false; } return true; }
function unplace(p){ p.placed = null; G.placedOrder = G.placedOrder.filter(id => id !== p.id); }
function place(p, off){ p.placed = off; G.placedOrder = G.placedOrder.filter(id => id !== p.id).concat(p.id); }
function stateArrays(exclude){ const sv = G.solver, o = new Uint8Array(sv.N), u = new Uint8Array(sv.P);
  for (const p of G.pieces){ if (!p.placed || (exclude && exclude.has(p.id))) continue; u[p.id] = 1;
    for (const k of absKeys(p, p.placed)) o[sv.idx.get(k)] = 1; }
  return [o, u]; }
function stateData(){ return { level: G.level, hints: G.hints, order: G.placedOrder.slice(), pcs: G.pieces.map(p => ({ r: p.r, f: p.f, placed: p.placed })) }; }
function persistState(){ if (!G) return; save.cur[G.diff] = G.won ? null : stateData(); persist(); }

function newGame(di, level, restore){
  const lv = buildLevel(di, level), cfg = lv.cfg, rng = mulberry32(level * 31 + di * 977 + 5);
  G = { diff: di, level, cfg, fig: lv.fig, fxw: null, rot: cfg.rot, flip: cfg.flip, hints: 0, won: false, hint: null, pieces: [], touched: false, sel: null, dead: false,
    placedOrder: [], solver: lv.solver };
  G.zoo = lv.figObj ? { d: lv.figObj.zoo, f: lv.figObj, mirror: lv.mirror, c: lv.mirror ? geom(lv.cells).minx + geom(lv.figObj.cells).maxx : 0 } : null; G.alive = 0;
  G.boardSet = new Set(lv.cells.map(c => K(c[0], c[1], c[2])));
  G.board = paths(geom(lv.cells));
  lv.shapes.forEach((s, id) => {
    const p = { id, base: s.base, solOff: s.off, solSet: s.sol ? new Set(s.sol.map(c => K(c[0], c[1], c[2]))) : null, decoy: s.decoy, col: PAL[s.color],
      placed: null, x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1, ang: 0, fx: 1, pulse: 0, lf: LIFT_TRAY, delay: 0, wt: 0, slot: null, tb: rng(), r: 0, f: 0 };
    setOri(p, cfg.rot ? Math.floor(rng() * 6) : 0, cfg.flip && rng() < 0.5 ? 1 : 0); G.pieces.push(p); });
  if (cfg.rot && G.pieces.every(p => p.r === 0)) setOri(G.pieces[0], 2, G.pieces[0].f);
  rebuildOcc();   // start from an empty board: nothing may carry over from the level before
  if (restore && restore.pcs && restore.pcs.length === G.pieces.length){
    G.hints = restore.hints || 0;
    restore.pcs.forEach((s, i) => setOri(G.pieces[i], cfg.rot ? (s.r || 0) : 0, cfg.flip ? (s.f || 0) : 0));
    rebuildOcc();
    const ids = (restore.order || []).concat(G.pieces.map(p => p.id));
    for (const id of ids){ const p = G.pieces[id], s = restore.pcs[id]; if (!p || p.placed || !s || !s.placed) continue;
      if (fits(p, s.placed[0], s.placed[1])){ place(p, [s.placed[0], s.placed[1]]); rebuildOcc(); } }
    G.touched = G.placedOrder.length > 0;
  }
  G.order = G.pieces.map(p => p.id);
  drag = null; parts = []; $('win').hidden = true; $('acts').hidden = !cfg.rot; $('bFlip').hidden = !cfg.flip;
  renderGameText(); layout(true); checkDead(); updateTip(); updateMeter();
  if (!reduced) G.pieces.filter(p => !p.placed && p.slot).sort((a, c) => (a.slot.y - c.slot.y) || (a.slot.x - c.slot.x))
    .forEach((p, n) => { p.k = 0.01; p.delay = 0.1 + n * 0.055; });
  G.pieces.forEach(p => { if (p.placed) p.lf = 0; });
  if (occ.size === G.boardSet.size) win(true); else { sfx('start'); /* [AUDIO] start */ cgPlay(true); }
}

// ===================== layout =====================
function layout(jump){
  if (!G) return;
  const st = $('stage'); W = st.clientWidth; Hc = st.clientHeight; if (!W || !Hc) return;
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(W * dpr); cv.height = Math.round(Hc * dpr);
  const pad = 12, land = false, np = G.pieces.length; let bR, tR;
  if (land){ const bw = Math.round(W * 0.56); bR = { x: 0, y: 0, w: bw, h: Hc }; tR = { x: bw, y: pad, w: W - bw - pad, h: Hc - 2 * pad }; }
  else { const bh = Math.round(Hc * (np <= 6 ? 0.54 : np <= 9 ? 0.5 : 0.46) - (G.rot ? 20 : 0)); bR = { x: 0, y: 0, w: W, h: bh }; tR = { x: pad, y: bh, w: W - 2 * pad, h: Hc - bh - pad }; }
  const b = G.board, bw = b.maxx - b.minx, bh = b.maxy - b.miny;
  S = Math.min((bR.w - 2 * pad - 10) / bw, (bR.h - 2 * pad - 10) / bh, 84);
  BX = bR.x + (bR.w - bw * S) / 2 - b.minx * S; BY = bR.y + (bR.h - bh * S) / 2 - b.miny * S;
  trayRect = tR;
  // shelf-pack the tray, largest scale that fits
  const inner = { x: tR.x + 8, y: tR.y + 22, w: tR.w - 16, h: tR.h - 30 - (G.rot ? 60 : 0) }, gap = 12;
  const sorted = G.pieces.slice().sort((a, c) => (slotH(c) - slotH(a)) || (a.tb - c.tb));
  function slotW(p){ return 2 * (G.rot ? p.g.R : p.g.hw); }
  function slotH(p){ return Math.round(2 * (G.rot ? p.g.R : p.g.hh) * 4) / 4; }
  function pack(k){ const rows = []; let row = [], x = 0, rh = 0, y = 0;
    for (const p of sorted){ const w = slotW(p) * k + gap, h = slotH(p) * k + gap; if (w > inner.w) return null;
      if (x + w > inner.w && row.length){ rows.push({ row, w: x, h: rh }); y += rh; row = []; x = 0; rh = 0; }
      row.push({ p, x, w, h }); x += w; rh = Math.max(rh, h); }
    rows.push({ row, w: x, h: rh }); y += rh; return y > inner.h ? null : { rows, h: y }; }
  let lo = 4, hi = S, best = pack(lo) || { rows: [], h: 0 }; trayK = lo;
  for (let n = 0; n < 18; n++){ const mid = (lo + hi) / 2, r = pack(mid); if (r){ best = r; trayK = mid; lo = mid; } else hi = mid; }
  const spare = Math.max(0, inner.h - best.h) / (best.rows.length + 1); let y = inner.y + spare;
  for (const r of best.rows){ const x0 = inner.x + (inner.w - r.w) / 2;
    for (const it of r.row) it.p.slot = { x: x0 + it.x + it.w / 2, y: y + r.h / 2, w: it.w, h: r.h };
    y += r.h + spare; }
  for (const p of G.pieces){ retarget(p); if (jump){ p.x = p.tx; p.y = p.ty; p.k = p.tk; } }
  buildStatic(bR, tR);
  const tip = $('tip'), acts = $('acts');
  if (land){ tip.style.left = (tR.x + tR.w / 2) + 'px'; tip.style.top = (tR.y + 24) + 'px'; } else { tip.style.left = '50%'; tip.style.top = tR.y + 'px'; }
  acts.style.left = (tR.x + tR.w / 2) + 'px'; acts.style.top = (tR.y + tR.h - 60) + 'px';
  invalidate();
}
function retarget(p){
  if (drag && drag.p === p) return;
  if (p.placed){ p.tx = BX + S * (p.g.cx + p.placed[0] + p.placed[1] / 2); p.ty = BY + S * (p.g.cy + p.placed[1] * H); p.tk = S; }
  else if (p.slot){ p.tx = p.slot.x; p.ty = p.slot.y; p.tk = trayK; }
}
function rrect(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function boardInk(){ return Math.min(0.11, 7 / S); }
function buildStatic(bR, tR){
  staticLayer = document.createElement('canvas'); staticLayer.width = cv.width; staticLayer.height = cv.height;
  const c = staticLayer.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#D6ECEB'; c.fillRect(0, 0, W, Hc);
  // the mat: a triangle lattice that lines up exactly with the board
  c.strokeStyle = '#BBD9DA'; c.lineWidth = 1; c.beginPath();
  const rowH = S * H, span = W + Hc;
  for (let m = Math.floor(-BY / rowH); BY + m * rowH <= Hc; m++){ const y = BY + m * rowH; c.moveTo(0, y); c.lineTo(W, y); }
  const n0 = Math.floor((-BX - span) / S), n1 = Math.ceil((W - BX + span) / S), far = span / H;
  for (let n = n0; n <= n1; n++){ const x = BX + n * S;
    c.moveTo(x - 0.5 * far, BY - H * far); c.lineTo(x + 0.5 * far, BY + H * far);
    c.moveTo(x + 0.5 * far, BY - H * far); c.lineTo(x - 0.5 * far, BY + H * far); }
  c.stroke();
  const vg = c.createRadialGradient(W / 2, Hc * 0.42, Math.min(W, Hc) * 0.25, W / 2, Hc * 0.42, Math.hypot(W, Hc) * 0.62);
  vg.addColorStop(0, 'rgba(30,58,76,0)'); vg.addColorStop(1, 'rgba(30,58,76,.10)'); c.fillStyle = vg; c.fillRect(0, 0, W, Hc);
  // tray
  rrect(c, tR.x, tR.y, tR.w, tR.h, 22); c.fillStyle = 'rgba(255,255,255,.62)'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; c.stroke();
  // board (hidden once the animal comes alive and hops off it)
  if (G.alive) return;
  const b = G.board; c.save(); c.translate(BX, BY); c.scale(S, S); c.lineJoin = 'round';
  // a shallow well: light lip below, soft shadow inside the top edge
  c.save(); c.translate(0, Math.min(0.07, 3.5 / S)); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = boardInk(); c.stroke(b.body); c.restore();
  c.fillStyle = '#FFFFFF'; c.fill(b.body, 'evenodd');
  if (!G.cfg.noGrid){ c.strokeStyle = '#C5D6DC'; c.lineWidth = 0.03; c.stroke(b.lines); }
  c.save(); c.clip(b.body, 'evenodd'); c.shadowColor = 'rgba(24,52,68,.26)'; c.shadowBlur = Math.min(7, S * 0.1) * dpr; c.shadowOffsetY = Math.min(4, S * 0.06) * dpr;
  c.strokeStyle = INK; c.lineWidth = boardInk(); c.stroke(b.body); c.restore();
  c.strokeStyle = INK; c.lineWidth = boardInk(); c.stroke(b.body); c.restore();
}
function updateTip(){
  const tip = $('tip'), t = L(); let text = '', warn = false;
  if (!G || G.won) text = '';
  else if (G.dead){ text = t.dead; warn = true; }
  else if (!G.touched){
    text = G.cfg.flip && G.level < TIERS[G.diff].flipFrom + 3 ? t.tipFlip : G.cfg.decoys ? t.extra(G.cfg.decoys)
      : G.rot && G.level <= 3 ? t.tipRot : G.diff === 0 && G.level <= 2 ? t.tipDrag : '';
  }
  if (text) tip.textContent = text;
  tip.classList.toggle('off', !text); tip.classList.toggle('warn', warn); $('bHint').classList.toggle('nudge', warn);
}

// ===================== frame loop =====================
function invalidate(){ if (!raf) raf = requestAnimationFrame(frame); }
function frame(ts){ raf = 0; const dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016); lastT = ts; clock += dt;
  const active = step(dt); draw(); if (active) invalidate(); }
function step(dt){
  let active = false; if (!G) return false;
  for (const p of G.pieces){
    if (p.delay > 0){ p.delay -= dt; active = true; if (p.delay > 0) continue; p.pulse = 0.22; }
    const held = drag && drag.p === p && drag.moved, lt = held ? LIFT_HELD : p.placed ? 0 : LIFT_TRAY;
    if (p.lf !== lt){ p.lf += (lt - p.lf) * (1 - Math.exp(-(reduced ? 400 : 16) * dt)); if (Math.abs(lt - p.lf) < 0.003) p.lf = lt; else active = true; }
    const rate = reduced ? 400 : (drag && drag.p === p ? 42 : 15), a = 1 - Math.exp(-rate * dt);
    p.x += (p.tx - p.x) * a; p.y += (p.ty - p.y) * a; p.k += (p.tk - p.k) * a;
    if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) < 0.4 && Math.abs(p.tk - p.k) < 0.05){ p.x = p.tx; p.y = p.ty; p.k = p.tk; } else active = true;
    if (p.ang){ p.ang *= Math.exp(-(reduced ? 400 : 16) * dt); if (Math.abs(p.ang) < 0.01) p.ang = 0; else active = true; }
    if (p.fx !== 1){ p.fx += (1 - p.fx) * (1 - Math.exp(-(reduced ? 400 : 14) * dt)); if (p.fx > 0.985) p.fx = 1; else active = true; }
    if (p.pulse){ p.pulse *= Math.exp(-9 * dt); if (p.pulse < 0.004) p.pulse = 0; else active = true; }
    if (p.wt > 0){ p.wt -= dt; if (p.wt > 0){ p.ang = 0.13 * Math.sin((0.42 - p.wt) * 36) * (p.wt / 0.42); active = true; } else p.ang = 0; }
  }
  if (G.hint && !reduced) active = true;
  if (G.alive) active = true;
  const f = G.fxw;
  if (f){ f.t += dt;
    while (f.q.length && f.t >= f.q[0].at){ const b = f.q.shift(); burst(b.x, b.y, b.h); sfx('firework'); /* [AUDIO] firework */ }
    if (f.t < f.rainUntil){ f.acc += dt * 60; while (f.acc >= 1){ f.acc -= 1; rain(); } }
    if (f.t < 6.2) active = true; }
  if (parts.length){
    for (const q of parts){ const d = Math.exp(-q.drag * dt); q.vx *= d; q.vy = q.vy * d + q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.kind === 'ring') q.r += q.vr * dt; else if (q.kind === 'conf'){ q.r += q.vr * dt; q.ph += dt * 7; } }
    parts = parts.filter(q => q.life > 0 && q.y < Hc + 40); if (parts.length) active = true; }
  return active;
}
function ghost(p, off, alpha, dashed, g){ g = g || p.g;
  ctx.save(); ctx.translate(BX, BY); ctx.scale(S, S); ctx.translate(off[0] + off[1] / 2, off[1] * H); ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha; ctx.fillStyle = p.col.light; ctx.fill(g.body, 'evenodd');
  ctx.globalAlpha = Math.min(1, alpha + 0.35); ctx.strokeStyle = p.col.dark; ctx.lineWidth = 0.08; if (dashed) ctx.setLineDash([0.16, 0.14]);
  ctx.stroke(g.body); ctx.restore();
}
// a small puff where a piece lands
function placeFx(p){ if (reduced) return; retarget(p);
  for (let i = 0; i < 12; i++){ const a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 150;
    parts.push({ kind: 'spark', x: p.tx, y: p.ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 200, drag: 3, s: 2 + Math.random() * 2, c: i % 2 ? p.col.base : p.col.dark, life: 0.3 + Math.random() * 0.3, max: 0.6 }); }
  parts.push({ kind: 'ring', x: p.tx, y: p.ty, vx: 0, vy: 0, g: 0, drag: 0, r: p.g.R * S * 0.5, vr: 220, c: '#FFFFFF', life: 0.32, max: 0.32 });
}
// ---------- celebration ----------
function burst(x, y, h){
  const c1 = PAL[h % 8].base, c2 = PAL[(h + 3) % 8].base, n = 40;
  for (let i = 0; i < n; i++){ const a = (i / n) * Math.PI * 2 + Math.random() * 0.3, v = 140 + Math.random() * 340;
    parts.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 240, drag: 2.3, s: 2.4 + Math.random() * 2.4, c: i % 3 ? c1 : c2, life: 0.8 + Math.random() * 0.7, max: 1.5 }); }
  for (let i = 0; i < 7; i++){ const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 150;
    parts.push({ kind: 'star', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 40, drag: 1.6, s: 7 + Math.random() * 7, c: '#FFB627', life: 0.9 + Math.random() * 0.8, max: 1.7 }); }
  parts.push({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, drag: 0, r: 6, vr: 520, c: c1, life: 0.45, max: 0.45 });
}
function rain(){
  parts.push({ kind: 'conf', x: Math.random() * W, y: -20 - Math.random() * 40, vx: (Math.random() - 0.5) * 90, vy: 150 + Math.random() * 170, g: 70, drag: 0.35,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 9, ph: Math.random() * 6, s: 6 + Math.random() * 6, c: PAL[Math.floor(Math.random() * 8)].base, tri: Math.random() < 0.5, life: 4.5, max: 4.5 });
}
function drawRays(f){
  const env = Math.min(1, f.t / 0.35) * Math.max(0, Math.min(1, (6 - f.t) / 1.2)); if (env <= 0) return;
  ctx.save(); ctx.translate(f.cx, f.cy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, f.R * 1.6); g.addColorStop(0, 'rgba(255,205,80,' + (0.6 * env) + ')'); g.addColorStop(1, 'rgba(255,205,80,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, f.R * 1.6, 0, 7); ctx.fill();
  ctx.rotate(f.t * 0.35); ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * env) + ')'; const n = 12, far = Math.hypot(W, Hc);
  for (let i = 0; i < n; i++){ const a = i * Math.PI * 2 / n; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - 0.11) * far, Math.sin(a - 0.11) * far);
    ctx.lineTo(Math.cos(a + 0.11) * far, Math.sin(a + 0.11) * far); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawShine(f){
  if (f.t < 0.15 || f.t > 1.3) return; const u = (f.t - 0.15) / 1.15, b = G.board, w = b.maxx - b.minx, h = b.maxy - b.miny, x = b.minx - w * 0.5 + u * (w * 2.1), sk = 0.55 * h;
  ctx.save(); ctx.translate(BX, BY); ctx.scale(S, S); ctx.clip(b.body, 'evenodd');
  for (const band of [[0, 0.9, 0.6], [1.15, 0.3, 0.45]]){ const x0 = x + band[0]; ctx.fillStyle = 'rgba(255,255,255,' + band[2] + ')';
    ctx.beginPath(); ctx.moveTo(x0 + sk, b.miny); ctx.lineTo(x0 + sk + band[1], b.miny); ctx.lineTo(x0 + band[1], b.maxy); ctx.lineTo(x0, b.maxy); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawParts(){
  ctx.lineCap = 'round';
  for (const q of parts){ ctx.globalAlpha = Math.max(0, Math.min(1, q.life / (q.max * 0.4)));
    if (q.kind === 'spark'){ ctx.strokeStyle = q.c; ctx.lineWidth = q.s; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.045, q.y - q.vy * 0.045); ctx.stroke(); }
    else if (q.kind === 'ring'){ ctx.strokeStyle = q.c; ctx.lineWidth = 1 + 5 * q.life / q.max; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.stroke(); }
    else if (q.kind === 'star'){ const k = q.s * (0.6 + 0.4 * Math.sin(q.life * 14)); ctx.fillStyle = q.c; ctx.beginPath();
      ctx.moveTo(q.x, q.y - k); ctx.quadraticCurveTo(q.x, q.y, q.x + k, q.y); ctx.quadraticCurveTo(q.x, q.y, q.x, q.y + k); ctx.quadraticCurveTo(q.x, q.y, q.x - k, q.y); ctx.quadraticCurveTo(q.x, q.y, q.x, q.y - k); ctx.fill(); }
    else { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.scale(1, Math.cos(q.ph)); ctx.fillStyle = q.c;
      if (q.tri){ ctx.beginPath(); ctx.moveTo(0, -q.s); ctx.lineTo(q.s * 0.87, q.s * 0.5); ctx.lineTo(-q.s * 0.87, q.s * 0.5); ctx.closePath(); ctx.fill(); } else ctx.fillRect(-q.s * 0.7, -q.s * 0.4, q.s * 1.4, q.s * 0.8);
      ctx.restore(); } }
  ctx.globalAlpha = 1;
}
function draw(){
  if (!G || !staticLayer) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.drawImage(staticLayer, 0, 0, W, Hc);
  const dp = drag ? drag.p : null, hp = G.hint ? G.hint.p : null, fw = G.fxw;
  if (fw){ drawRays(fw); } if (fw && !G.alive){ ctx.save(); ctx.translate(BX, BY); ctx.scale(S, S); ctx.fillStyle = '#FFFFFF'; ctx.fill(G.board.body, 'evenodd'); ctx.restore(); }
  if (hp && !hp.placed) ghost(hp, G.hint.off, reduced ? 0.55 : 0.4 + 0.25 * Math.sin(clock * 5), true, G.hint.g);
  if (drag && drag.snap) ghost(dp, drag.snap, 0.6, false);
  const tile = p => { const bump = 1 + p.pulse + (p === hp && !p.placed && p !== dp && !reduced ? 0.05 * (1 + Math.sin(clock * 5)) : 0);
    if (G.won && !p.placed) ctx.globalAlpha = 0.35;   // extra pieces that were never needed
    drawTile(ctx, p.g, p.col, p.x, p.y, p.k * bump, { ang: p.ang, fx: p.fx, lift: p.lf, shadow: p.lf > 0.004 ? (p === dp ? 0.12 : 0.04) : 0,
      halo: G.rot && G.sel === p.id && !p.placed && p !== dp });
    ctx.globalAlpha = 1; };
  let al = null;
  if (G.alive){ const t = clock - G.alive, b = G.board, hop = reduced ? [0, 0] : zooHop(t, Math.min(24, S * (b.maxy - b.miny) * 0.07));
    al = { x: BX + S * (b.minx + b.maxx) / 2, y: BY + S * b.maxy, open: zooOpen(t, 0) };
    ctx.save(); ctx.translate(al.x, al.y + hop[0]); ctx.scale(1 + hop[1], 1 - hop[1]); ctx.translate(-al.x, -al.y); }
  const artI = al ? zooArt(G.zoo.d.id) : null, tA = al ? clock - G.alive : 0, fadeP = artI ? Math.max(0, 1 - tA / 0.35) : 1;
  if (fadeP > 0){ ctx.globalAlpha = fadeP; for (const id of G.order){ const p = G.pieces[id]; if (p.placed && p !== dp){ tile(p); ctx.globalAlpha = fadeP; } } ctx.globalAlpha = 1; }
  ctx.save(); ctx.globalAlpha = fadeP; ctx.translate(BX, BY); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = boardInk(); ctx.stroke(G.board.body);
  if (fw && fw.t < 1.8){ ctx.globalAlpha = (1 - fw.t / 1.8) * fadeP; ctx.strokeStyle = '#FFB627'; ctx.lineWidth = boardInk() * 2.2; ctx.stroke(G.board.body); ctx.globalAlpha = 1; }
  ctx.restore();
  if (al){
    if (artI){ // the picture sits exactly where the board was cut from it, and swells in from the middle
      const r = zooArtRect(G.zoo.f, G.zoo.mirror, G.zoo.c, BX, BY, S), u = Math.min(1, Math.max(0, (tA - 0.05) / 0.45));
      const pop = u <= 0 ? 0 : 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2), cx = r[0] + r[2] / 2, cy = r[1] + r[2] / 2;
      if (pop > 0){ ctx.save(); ctx.globalAlpha = Math.min(1, u * 2.5); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); drawZooArt(ctx, artI, r); ctx.restore(); } }
    ctx.restore(); }
  if (fw && !al) drawShine(fw);
  for (const id of G.order){ const p = G.pieces[id]; if (!p.placed && p !== dp) tile(p); }
  if (dp) tile(dp);
  if (parts.length) drawParts();
}

// ===================== input =====================
function pt(e){ const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function cellAt(ux, uy){ const fj = uy / H, fi = ux - fj / 2, i = Math.floor(fi), j = Math.floor(fj); return [i, j, (fi - i) + (fj - j) < 1 ? 0 : 1]; }
function pieceAt(x, y){
  for (let n = G.order.length - 1; n >= 0; n--){ const p = G.pieces[G.order[n]]; if (p.placed) continue;
    const c = cellAt((x - p.x) / p.k + p.g.cx, (y - p.y) / p.k + p.g.cy);
    if (p.cells.some(q => q[0] === c[0] && q[1] === c[1] && q[2] === c[2])) return p; }
  const c = cellAt((x - BX) / S, (y - BY) / S), o = occ.get(K(c[0], c[1], c[2]));
  if (o !== undefined) return G.pieces[o];
  let best = null, bd = 1e9;
  for (const p of G.pieces){ if (p.placed || !p.slot) continue;
    if (Math.abs(x - p.slot.x) <= p.slot.w / 2 && Math.abs(y - p.slot.y) <= p.slot.h / 2){ const d = Math.hypot(x - p.slot.x, y - p.slot.y); if (d < bd){ bd = d; best = p; } } }
  return best;
}
function findSnap(p, cxp, cyp){
  const ox = (cxp - BX) / S - p.g.cx, oy = (cyp - BY) / S - p.g.cy, fj = oy / H, fi = ox - fj / 2, j0 = Math.floor(fj), i0 = Math.floor(fi);
  let best = null, bd = 0.95;
  for (let dj = j0 - 1; dj <= j0 + 2; dj++) for (let di = i0 - 2; di <= i0 + 3; di++){
    const d = Math.hypot(di + dj / 2 - ox, dj * H - oy); if (d < bd && fits(p, di, dj)){ bd = d; best = [di, dj]; } }
  return best;
}
cv.addEventListener('pointerdown', e => {
  if (!G || G.won || drag) return;
  const [x, y] = pt(e); rebuildOcc(); const p = pieceAt(x, y); if (!p) return;
  e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  drag = { p, id: e.pointerId, sx: x, sy: y, t0: performance.now(), moved: false, maxD: 0, touch: e.pointerType !== 'mouse',
    gx: (x - p.x) / p.k, gy: (y - p.y) / p.k, from: p.placed, snap: null };
  p.placed = null; rebuildOcc(); G.sel = p.id;
  G.order = G.order.filter(id => id !== p.id).concat(p.id); p.pulse = 0.06; p.delay = 0;
  sfx('pick'); /* [AUDIO] pick */ invalidate();
});
cv.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const [x, y] = pt(e), p = drag.p, d = Math.hypot(x - drag.sx, y - drag.sy);
  if (d > drag.maxD) drag.maxD = d;
  if (!drag.moved && d > (drag.touch ? 10 : 6)) drag.moved = true;
  if (!drag.moved) return;
  const lift = drag.touch ? Math.max(48, Math.min(86, S * 1.35)) : 0;
  p.tk = S; p.tx = x - drag.gx * S; p.ty = y - drag.gy * S - lift;
  drag.snap = findSnap(p, p.tx, p.ty); invalidate();
});
function endDrag(e, cancel){
  if (!drag || e.pointerId !== drag.id) return;
  const p = drag.p, d = drag; drag = null;
  // a short, small wobble that lands nowhere still counts as a tap (helps unsteady hands)
  const wobble = d.moved && !d.snap && !d.from && d.maxD < 22 && performance.now() - d.t0 < 450;
  if (cancel || !d.moved || wobble){
    if (d.from) p.placed = d.from;
    else if (!cancel && G.rot) turn(p, true);
  } else if (d.snap){
    place(p, d.snap); p.pulse = 0.09; placeFx(p); sfx('place'); /* [AUDIO] place */ if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) {}
    G.touched = true;
  } else { if (d.from) unplace(p); if (!reduced) p.wt = 0.42; sfx('back'); /* [AUDIO] back */ }
  retarget(p); afterChange();
}
cv.addEventListener('pointerup', e => endDrag(e, false));
cv.addEventListener('pointercancel', e => endDrag(e, true));

function miniStar(on){ return '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17.2 6.2 20.4l1.3-6.5L2.7 9.4l6.5-.8z" fill="' +
  (on ? '#FFB627' : 'rgba(255,255,255,.8)') + '" stroke="' + (on ? '#D98A12' : '#A9C4CB') + '" stroke-width="1.6" stroke-linejoin="round"/></svg>'; }
function starCount(){ return G.hints === 0 ? 3 : G.hints <= 2 ? 2 : 1; }
// progress bar (how much of the picture is covered) and the stars still on offer
function updateMeter(){ if (!G) return; $('pFill').style.width = (100 * occ.size / G.boardSet.size) + '%';
  const n = starCount(); if ($('mini').dataset.n !== String(n)){ $('mini').dataset.n = n; $('mini').innerHTML = [0, 1, 2].map(i => miniStar(i < n)).join(''); } }
// every change to the board goes through here
function afterChange(){
  rebuildOcc();
  if (G.hint){ const h = G.hint; if (h.p.placed || [...h.keys].some(k => occ.has(k))) G.hint = null; }
  updateMeter();
  if (occ.size === G.boardSet.size){ win(false); return; }
  const was = G.dead; checkDead(); if (G.dead && !was) sfx('dead'); /* [AUDIO] dead */ updateTip(); persistState(); invalidate();
}
// beginner and normal: say so when the current layout can no longer be completed
function checkDead(){ G.dead = false; if (G.won || G.diff > 1 || !G.placedOrder.length) return;
  const st = stateArrays(), r = G.solver.solve(st[0], st[1], null, 30000); G.dead = !r.found && !r.aborted; }

// ===================== rotate / flip =====================
function selPiece(){ let p = G.sel !== null ? G.pieces[G.sel] : null;
  if (!p || p.placed){ p = null; for (const id of G.order){ const q = G.pieces[id]; if (!q.placed && q.slot){ if (!p || q.slot.y < p.slot.y - 1 || (Math.abs(q.slot.y - p.slot.y) <= 1 && q.slot.x < p.slot.x)) p = q; } } }
  if (p) G.sel = p.id; return p; }
function turn(p, quiet){ setOri(p, p.r + 1, p.f); p.ang = -Math.PI / 3; sfx('rot'); /* [AUDIO] rot */
  if (!G.touched && G.rot && G.level <= 3 && !G.cfg.decoys){ G.touched = true; }
  if (!quiet){ retarget(p); } updateTip(); persistState(); invalidate(); }
function mirror(p){ setOri(p, 6 - p.r, 1 - p.f); p.fx = -1; sfx('flip'); /* [AUDIO] flip */ G.touched = true; retarget(p); updateTip(); persistState(); invalidate(); }

// ===================== hint / reset / win =====================
function showHint(p, r, f, off){
  const dr = ((p.r - r) % 6 + 6) % 6;
  if (p.f !== f){ setOri(p, r, f); p.fx = -1; } else if (dr){ setOri(p, r, f); p.ang = (dr > 3 ? dr - 6 : dr) * Math.PI / 3; }
  G.hint = { p, off, g: p.g, keys: new Set(absKeys(p, off)) }; G.hints++; p.pulse = 0.12; G.sel = p.id;
  G.order = G.order.filter(id => id !== p.id).concat(p.id);
  G.pieces.forEach(retarget); sfx('hint'); /* [AUDIO] hint */ checkDead(); updateTip(); updateMeter(); persistState(); invalidate();
}
function doHint(){
  if (!G || G.won || drag) return;
  rebuildOcc();
  if (G.hint && !G.hint.p.placed){ G.hint.p.pulse = 0.12; sfx('hint'); /* [AUDIO] hint */ invalidate(); return; }
  const CAP = 300000, t0 = performance.now(); let st = stateArrays(), res = G.solver.solve(st[0], st[1], null, CAP), ex = new Set();
  if (!res.found && !res.aborted){
    // the current layout is a dead end: take back as few pieces as possible, newest first
    const recent = G.placedOrder.slice().reverse(); let fixed = false;
    const late = () => performance.now() - t0 > 700;
    for (const id of recent){ if (late()) break; const e1 = new Set([id]); st = stateArrays(e1); const r2 = G.solver.solve(st[0], st[1], null, CAP); if (r2.found){ res = r2; ex = e1; fixed = true; break; } }
    if (!fixed){ ex = new Set(); for (const id of recent){ if (late()) break; ex.add(id); st = stateArrays(ex); const r2 = G.solver.solve(st[0], st[1], null, CAP); if (r2.found){ res = r2; break; } if (r2.aborted) break; } }
  }
  if (!res.found){ legacyHint(); return; }
  for (const id of ex) unplace(G.pieces[id]);
  rebuildOcc();
  // of the pieces still to place, show the one that hugs the edge or its neighbours most
  let best = null, bs = -1;
  for (const pl of res.sol){ let s = 0;
    for (const n of pl.list) for (const nb of nbrs(G.solver.cells[n])){ const k = K(nb[0], nb[1], nb[2]); if (!G.boardSet.has(k) || occ.has(k)) s++; }
    s /= pl.list.length; if (s > bs){ bs = s; best = pl; } }
  if (!best) return;
  showHint(G.pieces[best.pid], best.r, best.f, best.off);
}
// fallback when the search runs out of budget: steer toward the layout the level was generated from
function legacyHint(){
  const at = p => { if (!p.placed) return false; const ks = absKeys(p, p.placed); return ks.length === p.solSet.size && ks.every(k => p.solSet.has(k)); };
  const wrong = G.pieces.filter(p => !p.decoy && !at(p)); if (!wrong.length) return;
  const free = p => [...p.solSet].every(k => !occ.has(k));
  const c = wrong.find(p => !p.placed && free(p)) || wrong.find(p => !p.placed) || wrong[0];
  for (const k of c.solSet){ const o = occ.get(k); if (o !== undefined && o !== c.id) unplace(G.pieces[o]); }
  unplace(c); rebuildOcc(); showHint(c, 0, 0, c.solOff);
}
function doReset(){ if (!G || drag) return; if (G.alive){ G.alive = 0; layout(true); } G.pieces.forEach(p => { p.placed = null; }); G.placedOrder = []; G.hint = null; G.won = false; G.dead = false; G.fxw = null; parts = []; $('win').hidden = true;
  $('acts').hidden = !G.rot; rebuildOcc(); G.pieces.forEach(retarget); sfx('back'); /* [AUDIO] back */ updateTip(); updateMeter(); persistState(); invalidate(); }
function starSvg(on){ return '<svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17.2 6.2 20.4l1.3-6.5L2.7 9.4l6.5-.8z" fill="' +
  (on ? '#FFB627' : '#E3EDEF') + '" stroke="' + (on ? '#D98A12' : '#C5D6DC') + '" stroke-width="1.4" stroke-linejoin="round"/></svg>'; }
function win(quiet){
  G.won = true; G.hint = null; G.dead = false; updateTip(); $('acts').hidden = true; cgPlay(false); if (!quiet) cgHappy();
  // unused extra pieces stay in the tray
  if (save.prog[G.diff] < G.level + 1) save.prog[G.diff] = G.level + 1;
  const fresh = !!(G.zoo && !save.zoo[G.zoo.d.id]); if (G.zoo) save.zoo[G.zoo.d.id] = 1;
  save.cur[G.diff] = null; persist();
  const stars = starCount(); updateMeter();
  { const rec = save.done[G.diff][G.level]; save.done[G.diff][G.level] = { s: Math.max(stars, rec ? rec.s : 0), a: G.zoo ? G.zoo.d.id : (rec && rec.a) || null }; persist(); }
  $('tNote').textContent = (fresh ? L().newZoo + ' · ' : '') + (G.hints ? L().usedHint(G.hints) : L().noHint); $('tNote').classList.toggle('new', fresh);
  if (!quiet && navigator.vibrate) try { navigator.vibrate([12, 60, 12, 60, 30]); } catch (err) {}
  $('stars').innerHTML = [0, 1, 2].map(n => starSvg(n < stars)).join('');
  $('tWin').textContent = L().win; $('bNext').textContent = L().next; $('bAgain').textContent = L().again;
  if (!quiet && !reduced){
    sfx('win'); /* [AUDIO] win */
    const b = G.board, cx = BX + S * (b.minx + b.maxx) / 2, cy = BY + S * (b.miny + b.maxy) / 2, R = S * Math.max(b.maxx - b.minx, b.maxy - b.miny) / 2;
    // ripple outward from the middle of the picture
    G.pieces.forEach(p => { if (!p.placed) return; const d = Math.hypot(p.tx - cx, p.ty - cy); setTimeout(() => { p.pulse = 0.16; invalidate(); }, 60 + d * 1.6); });
    const top = Math.max(30, cy - R - 10), bot = Math.min(Hc * 0.62, cy + R), q = [{ at: 0.05, x: cx, y: cy, h: 2 }];
    [0.4, 0.75, 1.1, 1.5, 1.95].forEach((at, i) => q.push({ at, x: W * (0.14 + Math.random() * 0.72), y: top + Math.random() * (bot - top), h: i * 3 + 1 }));
    G.fxw = { t: 0, q, rainUntil: 1.8, acc: 0, cx, cy, R };
    for (let n = 0; n < 24; n++) rain();
  } else if (!quiet) sfx('win'); /* [AUDIO] win */
  const g0 = G, wake = () => { if (G !== g0 || !G.won || !G.zoo || G.alive) return; G.alive = clock + 0.001; layout(true); zooPoof(); };
  setTimeout(wake, quiet || reduced ? 0 : 650);
  const show = () => { if (G !== g0 || !G.won) return; $('win').hidden = false; wake();
    if (!quiet) for (let n = 0; n < stars; n++) setTimeout(() => { if (G === g0) sfx('star'); /* [AUDIO] star */ }, 80 + n * 200); };
  if (quiet || reduced) show(); else setTimeout(show, 1250);
  invalidate();
}

// ===================== menu =====================
function diffGlyph(i){ const cols = ['#69BE66', '#4C98E6', '#F7973B', '#F0685C'], n = i + 1, s = 17, h = s * H; let d = '';
  for (let k = 0; k < n; k++){ const x = 3 + k * s / 2; d += k % 2 ? 'M' + x + ' 5l' + s + ' 0l' + (-s / 2) + ' ' + h + 'z' : 'M' + x + ' ' + (5 + h) + 'l' + s + ' 0l' + (-s / 2) + ' ' + (-h) + 'z'; }
  return '<svg width="52" height="26" viewBox="0 0 52 26" aria-hidden="true"><path d="' + d + '" fill="' + cols[i] + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></svg>'; }
const ICON = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  hint: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" fill="#FFB627" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rot: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  flip: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/><path d="M9 7L3 18h6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 7l6 11h-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
function renderGameText(){ if (!G) return; const t = L();
  const name = G.fig ? t.figs[G.fig] : '', extra = G.cfg.decoys ? t.extraShort(G.cfg.decoys) : '';
  $('tLevel').textContent = t.lv(G.level); $('tDiff').textContent = [extra ? '' : t.names[G.diff], name, extra].filter(Boolean).join(' · ') || t.names[G.diff];
  $('tFig').textContent = name; $('tFig').hidden = !name; }
function renderText(){
  const t = L(); document.title = t.title;
  $('tTitle').textContent = t.title; $('tSub').textContent = t.sub;
  $('diffs').innerHTML = TIERS.map((d, i) => '<button class="diff" type="button" data-d="' + i + '">' + diffGlyph(i) +
    '<span class="mid"><div class="nm">' + t.names[i] + '</div><div class="ds">' + t.pcs(d.n0, d.n0 + d.up.length) + (d.rot ? t.rot : '') + '</div></span>' +
    '<span class="lv">' + t.lv(save.prog[i] || 1) + '</span></button>').join('');
  $('bZoo').innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.6" fill="#1E3A4C"/><circle cx="18" cy="7" r="2.6" fill="#1E3A4C"/><circle cx="3.6" cy="13" r="2.3" fill="#1E3A4C"/><circle cx="20.4" cy="13" r="2.3" fill="#1E3A4C"/><path d="M12 10.5c3 0 6 4.3 6 6.6 0 2.4-2.6 2.6-6 1.4-3.4 1.2-6 1-6-1.4 0-2.3 3-6.6 6-6.6z" fill="#1E3A4C"/></svg>'
    + '<span class="mid">' + t.zoo + '</span><span class="lv">' + zooCount() + ' / ' + ZOO.length + '</span>';
  $('bSound').innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
    + (save.sound ? '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
                  : '<path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>') + '</svg>';
  $('bSound').setAttribute('aria-label', save.sound ? t.sOn : t.sOff); $('bSound').title = save.sound ? t.sOn : t.sOff; $('bSound').classList.toggle('off', !save.sound); $('tRotate').textContent = t.rotate;
  $('bBack').innerHTML = ICON.back; $('bBack').setAttribute('aria-label', t.back);
  $('bHint').innerHTML = ICON.hint + '<span>' + t.hint + '</span>'; $('bReset').innerHTML = ICON.reset + '<span>' + t.reset + '</span>';
  $('bRot').innerHTML = ICON.rot + '<span>' + t.rotBtn + '</span>'; $('bFlip').innerHTML = ICON.flip + '<span>' + t.flipBtn + '</span>';
  renderGameText();
}
let heroRun = 0;
function drawHero(){
  const c = $('hero'), w = c.clientWidth, h = c.clientHeight, r = Math.min(window.devicePixelRatio || 1, 3); if (!w) return;
  c.width = w * r; c.height = h * r; const x = c.getContext('2d');
  const pool0 = FIGS.filter(f => f.n >= 24 && f.n <= 44), pool = pool0.length ? pool0 : FIGS; if (!pool.length) return;
  const fig = pool[Math.floor(Math.random() * pool.length)], seed = (Math.random() * 1e9) | 0;
  const ps = partition(seed, fig.cells, Math.round(fig.n / 5), 3, 7) || [fig.cells], cols = colorize(ps, mulberry32(seed));
  const b = geom(fig.cells), k = Math.min((w - 16) / (b.maxx - b.minx), (h - 22) / (b.maxy - b.miny)), mx = (b.minx + b.maxx) / 2, my = (b.miny + b.maxy) / 2;
  const tiles = ps.map((cs, i) => { const g = paths(geom(cs)), a = Math.atan2(g.cy - my, g.cx - mx) + (Math.random() - 0.5);
    return { g, col: PAL[cols[i]], x: w / 2 + (g.cx - mx) * k, y: h / 2 - 3 + (g.cy - my) * k, dx: Math.cos(a) * w * 0.7, dy: Math.sin(a) * h * 0.7, spin: (Math.random() - 0.5) * 2.4, at: 0.15 + i * 0.09 }; });
  const run = ++heroRun, t0 = performance.now(); let heroDone = 0;
  // the pieces fly in and settle into the picture, once
  (function frame(now){ if (run !== heroRun || $('menu').hidden) return; const t = reduced ? 9 : (now - t0) / 1000; let busy = false;
    x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, w, h);
    for (const q of tiles){ const u = Math.max(0, Math.min(1, (t - q.at) / 0.6)), e = 1 - Math.pow(1 - u, 3), back = 1 + 0.12 * Math.sin(u * Math.PI); if (u < 1) busy = true;
      x.globalAlpha = Math.min(1, u * 3); drawTile(x, q.g, q.col, q.x + q.dx * (1 - e), q.y + q.dy * (1 - e), k * back, { ang: q.spin * (1 - e), lift: 0.11 * (1 - e) + 0.05, shadow: 0.05 }); }
    x.globalAlpha = 1;
    let more = busy;
    if (!busy){ const ai = zooArt(fig.id); if (ai){ heroDone = heroDone || t; const a = reduced ? 1 : Math.min(1, (t - heroDone) / 0.45); x.globalAlpha = a;
      drawZooArt(x, ai, zooArtRect(fig, false, 0, w / 2 - mx * k, h / 2 - 3 - my * k, k)); x.globalAlpha = 1; more = a < 1; } }
    if (more) requestAnimationFrame(frame); })(t0);
}
function showMenu(){ cgPlay(false); $('zoo').hidden = true; $('levels').hidden = true; if (G && !G.won) persistState(); $('game').hidden = true; $('menu').hidden = false; G = null; renderText(); drawHero(); }
function startGame(di, level, restore){
  if (!restore && save.cur[di] && save.cur[di].level === level) restore = save.cur[di];
  $('menu').hidden = true; $('zoo').hidden = true; $('levels').hidden = true; $('game').hidden = false; newGame(di, level, restore); }
let lvDiff = 0;
function showLevels(di){
  cgPlay(false); if (G && !G.won) persistState(); G = null; lvDiff = di;
  $('menu').hidden = true; $('zoo').hidden = true; $('game').hidden = true; $('levels').hidden = false;
  const t = L(), top = save.prog[di] || 1, done = save.done[di] || {}, nDone = top - 1;
  // every level below the progress mark has been beaten, even if it was finished before records were kept
  const animalOf = l => { if (done[l] && done[l].a) return done[l].a; const f = pickFigure(di, l, levelCfg(di, l)); return f && f.length ? f[0].id : null; };
  $('bLvBack').innerHTML = ICON.back; $('bLvBack').setAttribute('aria-label', t.back);
  $('tLvTitle').textContent = t.names[di]; $('tLvSub').textContent = t.done(nDone, top);
  $('bContinue').innerHTML = '<span class="mid">' + t.cont(top) + '</span><span aria-hidden="true">▶</span>';
  let h = '', zooAdded = false;
  for (let l = 1; l <= top; l++){ const r = done[l], beat = l < top || !!r, a = beat ? animalOf(l) : null, img = a && zooArt(a);
    if (a && !save.zoo[a]){ save.zoo[a] = 1; zooAdded = true; }   // the album agrees with what the level list shows
    const st = beat ? '<span class="st">' + [0, 1, 2].map(i => miniStar(i < (r ? r.s : 0))).join('') + '</span>' : '';
    h += '<button class="lc' + (!beat ? ' next' : '') + '" type="button" data-l="' + l + '" aria-label="' + t.lv(l) + '">' +
      (img ? '<img alt="" src="' + img.src + '">' + '<b>' + l + '</b>' : '<span class="no">' + l + '</span>') + st + '</button>'; }
  $('lgrid').innerHTML = h; if (zooAdded) persist();
  if (window.TZ_NO_AR) Array.prototype.forEach.call($('lgrid').children, el => { el.style.height = Math.round(el.clientWidth * 1.12) + 'px'; });
  const cur = $('lgrid').querySelector('.next') || $('lgrid').lastElementChild; if (cur) cur.scrollIntoView({ block: 'center' });
}

$('diffs').addEventListener('click', e => { const b = e.target.closest('.diff'); if (!b) return; const i = +b.dataset.d; sfx('tap'); /* [AUDIO] tap */ showLevels(i); });
$('lgrid').addEventListener('click', e => { const b = e.target.closest('.lc'); if (!b) return; sfx('tap'); /* [AUDIO] tap */ startGame(lvDiff, +b.dataset.l); });
$('bContinue').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ startGame(lvDiff, save.prog[lvDiff] || 1); });
$('bLvBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showMenu(); });
$('bSound').addEventListener('click', () => { save.sound = !save.sound; persist(); renderText(); sfx('tap'); /* [AUDIO] tap */ music(); });
$('bZoo').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showZoo(); });
$('bZooBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showMenu(); });
$('bBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showLevels(G ? G.diff : 0); });
$('bHint').addEventListener('click', doHint);
$('bReset').addEventListener('click', doReset);
$('bRot').addEventListener('click', () => { if (!G || G.won || drag) return; const p = selPiece(); if (p) turn(p, false); });
$('bFlip').addEventListener('click', () => { if (!G || G.won || drag || !G.flip) return; const p = selPiece(); if (p) mirror(p); });
$('bNext').addEventListener('click', () => { if (adPlaying) return; sfx('tap'); /* [AUDIO] tap */ const di = G.diff, lv = G.level + 1;
  // a natural break between levels: offer a midgame ad (the platform decides whether one actually shows)
  cgMidgame(() => startGame(di, lv)); });
$('bAgain').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ save.cur[G.diff] = null; startGame(G.diff, G.level); });
if (window.ResizeObserver) new ResizeObserver(() => layout(true)).observe($('stage')); else window.addEventListener('resize', () => layout(true));

// ===================== zoo album =====================
const ZOO_THUMB = {};
function zooThumbs(){ for (const f of FIGS){ const b = ZOO_THUMB[f.id]; if (!b || Math.abs(f.n - 40) < Math.abs(b.n - 40)) ZOO_THUMB[f.id] = f; } }
const GREY = { base: '#C9D9DE', light: '#DCE8EB', dark: '#9FB4BC', side: '#B3C6CC' };
const zooCount = () => ZOO.filter(d => save.zoo[d.id]).length;
let zooCards = [], zooRaf = 0;
function zooThumb(card, t){
  if (window.TZ_NO_AR && card.cv.clientWidth && card.cv.style.height !== card.cv.clientWidth + 'px') card.cv.style.height = card.cv.clientWidth + 'px';
  const cv2 = card.cv, f = card.f, d = f.zoo, w = cv2.clientWidth, h = cv2.clientHeight; if (!w) return;
  const r = Math.min(window.devicePixelRatio || 1, 3);
  if (cv2.width !== Math.round(w * r)){ cv2.width = Math.round(w * r); cv2.height = Math.round(h * r); }
  const x = cv2.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); x.clearRect(0, 0, w, h);
  const b = card.g, k = Math.min((w - 14) / (b.maxx - b.minx), (h - 14) / (b.maxy - b.miny)), mx = (b.minx + b.maxx) / 2, my = (b.miny + b.maxy) / 2;
  const open = card.on ? zooOpen(t, card.ph) : 1, hop = card.on && card.hopAt >= 0 ? zooHop(Math.min(t - card.hopAt, 0.9), 8) : [0, 0];
  const baseY = h - 4;
  x.save(); x.translate(w / 2, baseY + hop[0]); x.scale(1 + hop[1], 1 - hop[1]); x.translate(-w / 2, -baseY);
  const art = card.on ? zooArt(d.id) : null;
  if (art) x.drawImage(art, 2, 2, w - 4, h - 4);
  else { drawTile(x, card.g, card.on ? PAL[d.col] : GREY, w / 2 + (b.cx - mx) * k, h / 2 + (b.cy - my) * k, k, { lift: 0.06 });
  }
  if (!card.on){ x.fillStyle = '#7F98A3'; x.font = '600 ' + Math.round(h * 0.3) + 'px ' + getComputedStyle(document.body).fontFamily; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', w / 2, h / 2); }
  x.restore();
}
function zooLoop(ts){ zooRaf = 0; if ($('zoo').hidden) return; const t = ts / 1000;
  for (const c of zooCards) zooThumb(c, t);
  zooRaf = requestAnimationFrame(zooLoop); }
function showZoo(){
  cgPlay(false); $('menu').hidden = true; $('game').hidden = true; $('levels').hidden = true; $('zoo').hidden = false;
  const t = L(), n = zooCount();
  $('tZoo').textContent = t.zoo; $('tZooN').textContent = t.zooN(n, ZOO.length); $('tZooTip').textContent = n < ZOO.length ? t.zooTip : t.zooAll;
  $('bZooBack').innerHTML = ICON.back; $('bZooBack').setAttribute('aria-label', t.back);
  { const sb = $('bZooShare'); sb.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'; sb.setAttribute('aria-label', t.share); sb.title = t.share;
    sb.style.visibility = window.TZP.canPost && zooCount() > 0 ? 'visible' : 'hidden'; }
  zooThumbs(); const grid = $('zgrid'); grid.innerHTML = '';
  zooCards = ZOO.filter(d => ZOO_THUMB[d.id]).map((d, i) => { const on = !!save.zoo[d.id], el = document.createElement('button'); el.type = 'button'; el.className = 'zc' + (on ? '' : ' lock');
    el.innerHTML = '<canvas></canvas><span>' + (on ? t.figs[d.id] : t.locked) + '</span>'; grid.appendChild(el);
    const f = ZOO_THUMB[d.id], card = { el, cv: el.querySelector('canvas'), f, g: paths(geom(f.cells)), on, ph: i * 0.37, hopAt: -1 };
    el.addEventListener('click', () => { if (!card.on) return; card.hopAt = performance.now() / 1000; sfx('place'); /* [AUDIO] place */ });
    return card; });
  if (!zooRaf) zooRaf = requestAnimationFrame(zooLoop);
}

// ===================== 小红书小工具 =====================
// 没有广告和 gameplay 事件：原来的 cg* 调用点保留为空函数，游戏逻辑不用改。存档走 window.TZP（js/platform.js）。
let cgReady = false;
function cgPlay(){}
function cgHappy(){}
function cgMidgame(then){ then(); }
async function cgInit(){
  try { await window.TZP.init(SKEY); } catch (e) {}
  readSave(); pickLang();
}

// ---------- 发笔记：把「我的动物园」画成一张 3:4 的图 ----------
let sharing = false;
function zooShareImage(){
  const W = 1080, H = 1440, cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  const x = cvs.getContext('2d'), t = L(), font = getComputedStyle(document.body).fontFamily, n = zooCount();
  x.fillStyle = '#D6ECEB'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#BBD9DA';
  for (let yy = 0; yy < H; yy += 69){ for (let xx = (yy / 69) % 2 ? -20 : 0; xx < W; xx += 40){ x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 20, yy + 34.6); x.lineTo(xx + 40, yy); x.fill(); } }
  x.fillStyle = 'rgba(214,236,235,.86)'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1E3A4C'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = '600 84px ' + font; x.fillText(t.title, W / 2, 150);
  x.font = '500 40px ' + font; x.fillStyle = '#547080'; x.fillText(t.zooN(n, ZOO.length), W / 2, 214);
  const cols = 5, gx = 56, gy = 262, gap = 18, cw = (W - gx * 2 - gap * (cols - 1)) / cols, ch = cw * 1.1;
  ZOO.forEach((d, i) => {
    const cx = gx + (i % cols) * (cw + gap), cy = gy + Math.floor(i / cols) * (ch + gap), on = !!save.zoo[d.id];
    x.fillStyle = on ? '#FFFFFF' : 'rgba(255,255,255,.55)';
    const r = 26; x.beginPath(); x.moveTo(cx + r, cy); x.arcTo(cx + cw, cy, cx + cw, cy + ch, r); x.arcTo(cx + cw, cy + ch, cx, cy + ch, r); x.arcTo(cx, cy + ch, cx, cy, r); x.arcTo(cx, cy, cx + cw, cy, r); x.fill();
    const art = on ? zooArt(d.id) : null, s = cw * 0.78;
    if (art) { try { x.drawImage(art, cx + (cw - s) / 2, cy + 8, s, s); } catch (e) {} }
    else { x.fillStyle = '#9FB4BC'; x.font = '600 ' + Math.round(cw * 0.42) + 'px ' + font; x.textBaseline = 'middle'; x.fillText('?', cx + cw / 2, cy + 8 + s / 2); x.textBaseline = 'alphabetic'; }
    x.fillStyle = on ? '#1E3A4C' : '#7F98A3'; x.font = '600 27px ' + font; x.fillText(on ? t.figs[d.id] : t.locked, cx + cw / 2, cy + ch - 18);
  });
  x.fillStyle = '#547080'; x.font = '500 34px ' + font; x.fillText(n < ZOO.length ? t.shareLeft(ZOO.length - n) : t.zooAll, W / 2, H - 56);
  return cvs.toDataURL('image/jpeg', 0.9);
}
async function zooShare(){
  if (sharing || !window.TZP.canPost) return; sharing = true;
  const b = $('bZooShare'), t = L(); b.disabled = true; b.setAttribute('aria-busy', 'true');
  let ok = false;
  try { ok = await window.TZP.postImage(zooShareImage(), t.shareTitle, t.shareText(zooCount(), ZOO.length)); } catch (e) { ok = false; }
  b.disabled = false; b.removeAttribute('aria-busy'); sharing = false;
  if (!ok) { $('tZooTip').textContent = t.shareFail; }
}
$('bZooShare').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ zooShare(); });

document.addEventListener('contextmenu', e => { if (e.target === cv) e.preventDefault(); });

(async function boot(){
  await cgInit();
  await zooArtLoaded; buildZooFigs();
  renderText(); showMenu();
  // 菜单出来以后再在后台加载音效数据，不挡首屏
  setTimeout(() => { audioData().then(null, e => console.warn('角角入位 audio:', e)); }, 600);
})();
