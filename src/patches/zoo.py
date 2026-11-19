import sys, re
import os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'zoo') + os.sep
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def rep(old, new):
    global s
    n = s.count(old)
    if n != 1: raise SystemExit('expected 1 of %r, found %d' % (old[:90], n))
    s = s.replace(old, new)
def cut(a, b, new, inclusive_b=True):
    global s
    i = s.index(a); j = s.index(b, i) + (len(b) if inclusive_b else 0)
    s = s[:i] + new + s[j:]

# ---------- animals replace the old figure list ----------
cut('const FIG_DATA = [', '];\n', '')
cut('const FIGS = [];\nfor (const d of FIG_DATA)', 'cells.length * 4 }); }\n', open(D + 'zoo_data.js').read())
# every level is an animal: pick a species for the level, then a size of it that suits the difficulty
cut('function pickFigure(di, level, cfg){', '\n}\n', '''function pickFigure(di, level, cfg){
  const ok = FIGS.filter(f => f.n / cfg.n >= cfg.min + 0.5 && f.n / cfg.n <= cfg.max - 0.5); if (!ok.length) return null;
  const ids = [...new Set(ok.map(f => f.id))], rng = mulberry32((di + 1) * 7001 + 977);
  const order = ZOO.map(d => d.id); for (let a = order.length - 1; a > 0; a--){ const b = Math.floor(rng() * (a + 1)), t = order[a]; order[a] = order[b]; order[b] = t; }
  const avail = order.filter(id => ids.includes(id)), first = ['cat', 'fox', 'owl', 'penguin'][di];
  // level 1 of each difficulty opens with a friendly face
  const id = level === 1 && ids.includes(first) ? first : avail[(level - 1) % avail.length];
  const sizes = ok.filter(f => f.id === id), st = Math.floor(mulberry32(level * 131 + di)() * sizes.length);
  return sizes.slice(st).concat(sizes.slice(0, st));   // preferred size first; other sizes are fallbacks if a cut fails
}
''')
rep('const mirror = fig && mulberry32(level * 53 + di)() < 0.5, figShape = fig ? (mirror ? fig.cells.map(flipCell) : fig.cells) : null;',
    'const figs = fig || [], mirror = figs.length > 0 && mulberry32(level * 53 + di)() < 0.5;')
rep('    if (figShape){ const ps = partition(seed, figShape, cfg.n, cfg.min, cfg.max); if (ps) lv = { pieces: ps, colors: colorize(ps, rng), fig: fig.id }; }',
    '    const F = figs[c % Math.max(1, figs.length)];\n'
    '    if (F){ const ps = partition(seed, mirror ? F.cells.map(flipCell) : F.cells, cfg.n, cfg.min, cfg.max); if (ps) lv = { pieces: ps, colors: colorize(ps, rng), fig: F.id, figObj: F }; }')
rep('c, fig: lv.fig || null });', 'c, fig: lv.fig || null, figObj: lv.figObj || null });')
rep('  cands.sort((a, b) => a.e - b.e || a.c - b.c);\n  const pick = cands[Math.round(cfg.q * (CANDIDATES - 1))]; pick.cfg = cfg; return pick;',
    '  // an animal whenever one could be cut; free-form only as a last resort\n'
    '  const pool = cands.some(x => x.fig) ? cands.filter(x => x.fig) : cands;\n'
    '  pool.sort((a, b) => a.e - b.e || a.c - b.c);\n  const pick = pool[Math.round(cfg.q * (pool.length - 1))]; pick.cfg = cfg; pick.mirror = mirror; return pick;')

# ---------- faces + game hooks ----------
rep('// ===================== game state =====================', open(D + 'zoo_face.js').read() + '\n' + open(D + 'zoo_art.js').read() + '\n// ===================== game state =====================')
rep('  G.boardSet = new Set(lv.cells.map(c => K(c[0], c[1], c[2])));',
    '  G.zoo = lv.figObj ? { d: lv.figObj.zoo, f: lv.figObj, mirror: lv.mirror, c: lv.mirror ? geom(lv.cells).minx + geom(lv.figObj.cells).maxx : 0 } : null; G.alive = 0;\n'
    '  G.boardSet = new Set(lv.cells.map(c => K(c[0], c[1], c[2])));')
rep('  // board\n  const b = G.board; c.save();', '  // board (hidden once the animal comes alive and hops off it)\n  if (G.alive) return;\n  const b = G.board; c.save();')
rep('  if (G.hint && !reduced) active = true;', '  if (G.hint && !reduced) active = true;\n  if (G.alive) active = true;')
rep("  if (fw){ drawRays(fw); ctx.save();", "  if (fw){ drawRays(fw); } if (fw && !G.alive){ ctx.save();")
rep("  for (const id of G.order){ const p = G.pieces[id]; if (p.placed && p !== dp) tile(p); }\n",
    "  let al = null;\n"
    "  if (G.alive){ const t = clock - G.alive, b = G.board, hop = reduced ? [0, 0] : zooHop(t, Math.min(24, S * (b.maxy - b.miny) * 0.07));\n"
    "    al = { x: BX + S * (b.minx + b.maxx) / 2, y: BY + S * b.maxy, open: zooOpen(t, 0) };\n"
    "    ctx.save(); ctx.translate(al.x, al.y + hop[0]); ctx.scale(1 + hop[1], 1 - hop[1]); ctx.translate(-al.x, -al.y); }\n"
    "  const artI = al ? zooArt(G.zoo.d.id) : null, tA = al ? clock - G.alive : 0, fadeP = artI ? Math.max(0, 1 - tA / 0.35) : 1;\n"
    "  if (fadeP > 0){ ctx.globalAlpha = fadeP; for (const id of G.order){ const p = G.pieces[id]; if (p.placed && p !== dp){ tile(p); ctx.globalAlpha = fadeP; } } ctx.globalAlpha = 1; }\n")
rep("  ctx.restore();\n  if (fw) drawShine(fw);",
    "  ctx.restore();\n"
    "  if (al){\n"
    "    if (artI){ // the picture sits exactly where the board was cut from it, and swells in from the middle\n"
    "      const r = zooArtRect(G.zoo.f, G.zoo.mirror, G.zoo.c, BX, BY, S), u = Math.min(1, Math.max(0, (tA - 0.05) / 0.45));\n"
    "      const pop = u <= 0 ? 0 : 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2), cx = r[0] + r[2] / 2, cy = r[1] + r[2] / 2;\n"
    "      if (pop > 0){ ctx.save(); ctx.globalAlpha = Math.min(1, u * 2.5); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); drawZooArt(ctx, artI, r); ctx.restore(); } }\n"
    "    ctx.restore(); }\n"
    "  if (fw && !al) drawShine(fw);")
# reset brings the empty board back
rep("function doReset(){ if (!G || drag) return;", "function doReset(){ if (!G || drag) return; if (G.alive){ G.alive = 0; layout(true); }")
# win: record the animal, wake it up when the card appears
rep("  save.cur[G.diff] = null; persist();",
    "  const fresh = !!(G.zoo && !save.zoo[G.zoo.d.id]); if (G.zoo) save.zoo[G.zoo.d.id] = 1;\n  save.cur[G.diff] = null; persist();")
rep("  $('tNote').textContent = G.hints ? L().usedHint(G.hints) : L().noHint;",
    "  $('tNote').textContent = (fresh ? L().newZoo + ' · ' : '') + (G.hints ? L().usedHint(G.hints) : L().noHint); $('tNote').classList.toggle('new', fresh);")
rep("  const g0 = G, show = () => { if (G !== g0 || !G.won) return; $('win').hidden = false;",
    "  const g0 = G, wake = () => { if (G !== g0 || !G.won || !G.zoo || G.alive) return; G.alive = clock + 0.001; layout(true); zooPoof(); };\n"
    "  setTimeout(wake, quiet || reduced ? 0 : 650);\n"
    "  const show = () => { if (G !== g0 || !G.won) return; $('win').hidden = false; wake();")

# ---------- save ----------
rep("const SKEY = 'tri-tiles-v1';", "const SKEY = 'tri-zoo-v1';")
rep("let save = { lang: 'en', sound: true,", "let save = { lang: 'en', zoo: {}, sound: true,")
rep("  if (!Array.isArray(save.cur)) save.cur = [null, null, null, null]; }",
    "  if (!Array.isArray(save.cur)) save.cur = [null, null, null, null]; if (!save.zoo || typeof save.zoo !== 'object') save.zoo = {}; }")

# ---------- text ----------
rep("title: 'Triangle Tiles', sub: 'Drag the colored pieces into the white shape until it is full.',",
    "title: 'Triangle Zoo', sub: 'Fill each animal with colored pieces and watch it come to life.',\n"
    "        zoo: 'My Zoo', zooN: (a, b) => a + ' / ' + b + ' animals', newZoo: 'New animal!', locked: '???',\n"
    "        zooTip: 'Finish levels to meet new animals. Tap a friend to say hi.', zooAll: 'You found every animal!',")
i = s.index("figs: { tree: 'Pine tree'"); j = s.index('} },', i)
names = dict(cat='Cat', fox='Fox', bear='Bear', panda='Panda', pig='Pig', rabbit='Bunny', owl='Owl', frog='Frog', mouse='Mouse', lion='Lion',
             penguin='Penguin', chick='Chick', fish='Fish', whale='Whale', turtle='Turtle', snail='Snail', duck='Duck', crab='Crab',
             butterfly='Butterfly', dino='Dino', elephant='Elephant', octopus='Octopus')
s = s[:i] + 'figs: { ' + ', '.join("%s: '%s'" % kv for kv in names.items()) + ' ' + s[j:]
rep('<title>Triangle Tiles</title>', '<title>Triangle Zoo</title>')
rep('<h1 id="tTitle">Triangle Tiles</h1>', '<h1 id="tTitle">Triangle Zoo</h1>')

# ---------- zoo screen ----------
rep('  <div class="opts">\n', '  <button class="zoo-btn" id="bZoo" type="button"></button>\n  <div class="opts">\n')
rep('<section id="game" class="screen" hidden>',
    '<section id="zoo" class="screen" hidden>\n'
    '  <div class="bar">\n    <button class="ib" id="bZooBack" type="button"></button>\n'
    '    <div class="lvl"><b id="tZoo"></b><span id="tZooN"></span></div>\n    <span style="width:50px;flex:none"></span>\n  </div>\n'
    '  <p class="ztip" id="tZooTip"></p>\n  <div id="zgrid"></div>\n</section>\n\n<section id="game" class="screen" hidden>')
rep('/* ---------- game ---------- */',
    '/* ---------- zoo ---------- */\n'
    '.zoo-btn{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;padding:10px 16px;border-radius:18px;background:var(--sun);\n'
    '  box-shadow:0 4px 0 var(--sun-deep);font-size:20px;font-weight:600;text-align:left;transition:transform .08s,box-shadow .08s}\n'
    '.zoo-btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--sun-deep)}\n'
    '.zoo-btn .mid{flex:1}\n.zoo-btn .lv{font-size:16px;background:rgba(255,255,255,.6);border-radius:999px;padding:6px 12px;font-variant-numeric:tabular-nums}\n'
    '.ztip{margin:0;padding:0 16px 6px;font-size:14px;color:var(--ink-soft);text-align:center}\n'
    '#zgrid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:6px 14px 18px;align-content:start}\n'
    '.zc{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 8px;background:var(--card);border-radius:16px;box-shadow:0 3px 0 rgba(30,58,76,.14)}\n'
    '.zc canvas{width:100%;aspect-ratio:1;display:block}\n.zc span{font-size:14px;font-weight:600;line-height:1.2}\n'
    '.zc.lock{background:rgba(255,255,255,.55);box-shadow:none;cursor:default}\n.zc.lock span{color:var(--ink-soft)}\n'
    '#win .note.new{color:var(--sun-deep);font-weight:600}\n\n/* ---------- game ---------- */')
rep("function showMenu(){ cgPlay(false);", "function showMenu(){ cgPlay(false); $('zoo').hidden = true;")
rep("  $('menu').hidden = true; $('game').hidden = false; newGame(di, level, restore); }",
    "  $('menu').hidden = true; $('zoo').hidden = true; $('game').hidden = false; newGame(di, level, restore); }")
rep("  $('bSound').textContent = save.sound ? t.sOn : t.sOff;",
    "  $('bZoo').innerHTML = '<svg width=\"30\" height=\"30\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"6\" cy=\"7\" r=\"2.6\" fill=\"#1E3A4C\"/><circle cx=\"18\" cy=\"7\" r=\"2.6\" fill=\"#1E3A4C\"/><circle cx=\"3.6\" cy=\"13\" r=\"2.3\" fill=\"#1E3A4C\"/><circle cx=\"20.4\" cy=\"13\" r=\"2.3\" fill=\"#1E3A4C\"/><path d=\"M12 10.5c3 0 6 4.3 6 6.6 0 2.4-2.6 2.6-6 1.4-3.4 1.2-6 1-6-1.4 0-2.3 3-6.6 6-6.6z\" fill=\"#1E3A4C\"/></svg>'\n"
    "    + '<span class=\"mid\">' + t.zoo + '</span><span class=\"lv\">' + zooCount() + ' / ' + ZOO.length + '</span>';\n"
    "  $('bSound').textContent = save.sound ? t.sOn : t.sOff;")
rep("$('bBack').addEventListener('click',",
    "$('bZoo').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showZoo(); });\n"
    "$('bZooBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showMenu(); });\n"
    "$('bBack').addEventListener('click',")
rep('// ===================== CrazyGames =====================', open(D + 'zoo_screen.js').read() + '\n// ===================== CrazyGames =====================')

# ---------- menu hero gets a face once it has landed ----------
rep("    x.globalAlpha = 1; if (busy) requestAnimationFrame(frame); })(t0);",
    "    x.globalAlpha = 1;\n"
    "    let more = busy;\n"
    "    if (!busy){ const ai = zooArt(fig.id); if (ai){ heroDone = heroDone || t; const a = reduced ? 1 : Math.min(1, (t - heroDone) / 0.45); x.globalAlpha = a;\n"
    "      drawZooArt(x, ai, zooArtRect(fig, false, 0, w / 2 - mx * k, h / 2 - 3 - my * k, k)); x.globalAlpha = 1; more = a < 1; } }\n"
    "    if (more) requestAnimationFrame(frame); })(t0);")
rep("  const run = ++heroRun, t0 = performance.now();", "  const run = ++heroRun, t0 = performance.now(); let heroDone = 0;")
rep("  const pool = FIGS.filter(f => f.n >= 24 && f.n <= 44), fig = pool[Math.floor(Math.random() * pool.length)], seed = (Math.random() * 1e9) | 0;",
    "  const pool0 = FIGS.filter(f => f.n >= 24 && f.n <= 44), pool = pool0.length ? pool0 : FIGS; if (!pool.length) return;\n  const fig = pool[Math.floor(Math.random() * pool.length)], seed = (Math.random() * 1e9) | 0;")
# boot waits for the pictures, then cuts the boards from them
rep("  await cgInit();\n", "  await cgInit();\n  await zooArtLoaded; buildZooFigs();\n")
rep("(function frame(now){ if (run !== heroRun) return;", "(function frame(now){ if (run !== heroRun || $('menu').hidden) return;")

# the board outline fades with the pieces
rep("  ctx.save(); ctx.translate(BX, BY); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = boardInk(); ctx.stroke(G.board.body);\n  if (fw && fw.t < 1.8){ ctx.globalAlpha = 1 - fw.t / 1.8;",
    "  ctx.save(); ctx.globalAlpha = fadeP; ctx.translate(BX, BY); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = boardInk(); ctx.stroke(G.board.body);\n  if (fw && fw.t < 1.8){ ctx.globalAlpha = (1 - fw.t / 1.8) * fadeP;")

# beginner starts at five pieces so its boards are big enough to look like the animal
rep("  { id: 'easy',   size: [3, 5], n0: 3, up: [6, 16, 36],             span: 30 },", "  { id: 'easy',   size: [3, 5], n0: 5, up: [8, 20, 40],             span: 30 },")

open(dst, 'w', encoding='utf-8').write(s)
print('zoo ok', len(s))
