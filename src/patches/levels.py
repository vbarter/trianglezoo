import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def rep(old, new):
    global s
    n = s.count(old)
    if n != 1: raise SystemExit('expected 1 of %r, found %d' % (old[:90], n))
    s = s.replace(old, new)

# ---------- level select screen ----------
rep('<section id="game" class="screen" hidden>',
    '<section id="levels" class="screen" hidden>\n'
    '  <div class="bar">\n    <button class="ib" id="bLvBack" type="button"></button>\n'
    '    <div class="lvl"><b id="tLvTitle"></b><span id="tLvSub"></span></div>\n    <span style="width:50px;flex:none"></span>\n  </div>\n'
    '  <div class="lvwrap"><button class="zoo-btn" id="bContinue" type="button"></button></div>\n'
    '  <div id="lgrid"></div>\n</section>\n\n<section id="game" class="screen" hidden>')
rep('/* ---------- game ---------- */',
    '/* ---------- level select ---------- */\n'
    '.lvwrap{padding:4px 14px 8px}\n'
    '#lgrid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:4px 14px 18px;align-content:start}\n'
    '.lc{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1/1.12;padding:4px;\n'
    '  background:var(--card);border-radius:16px;box-shadow:0 3px 0 rgba(30,58,76,.14);transition:transform .08s,box-shadow .08s}\n'
    '.lc:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(30,58,76,.14)}\n'
    '.lc img{width:72%;aspect-ratio:1;object-fit:contain;display:block}\n'
    '.lc b{font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}\n'
    '.lc .no{font-size:24px;font-weight:600;margin-top:6px}\n'
    '.lc .st{display:flex;gap:1px;line-height:0}\n'
    '.lc.next{background:#FFF4D6;box-shadow:0 3px 0 var(--sun-deep);animation:nudge 1.4s ease-in-out infinite}\n'
    '\n/* ---------- game ---------- */')

# ---------- save: best stars and animal per finished level ----------
rep("let save = { lang: 'en', zoo: {},", "let save = { lang: 'en', zoo: {}, done: [{}, {}, {}, {}],")
rep("if (!save.zoo || typeof save.zoo !== 'object') save.zoo = {}; }",
    "if (!save.zoo || typeof save.zoo !== 'object') save.zoo = {};\n"
    "  if (!Array.isArray(save.done) || save.done.length !== 4) save.done = [{}, {}, {}, {}]; }")
rep("  const stars = starCount(); updateMeter();",
    "  const stars = starCount(); updateMeter();\n"
    "  { const rec = save.done[G.diff][G.level]; save.done[G.diff][G.level] = { s: Math.max(stars, rec ? rec.s : 0), a: G.zoo ? G.zoo.d.id : (rec && rec.a) || null }; persist(); }")

# ---------- text ----------
rep("zoo: 'My Zoo',", "zoo: 'My Zoo', cont: n => 'Continue · Level ' + n, done: (a, b) => a + ' of ' + b + ' levels done',")

# ---------- navigation ----------
rep("$('diffs').addEventListener('click', e => { const b = e.target.closest('.diff'); if (!b) return; const i = +b.dataset.d; sfx('tap'); /* [AUDIO] tap */ startGame(i, save.prog[i] || 1); });",
    "$('diffs').addEventListener('click', e => { const b = e.target.closest('.diff'); if (!b) return; const i = +b.dataset.d; sfx('tap'); /* [AUDIO] tap */ showLevels(i); });\n"
    "$('lgrid').addEventListener('click', e => { const b = e.target.closest('.lc'); if (!b) return; sfx('tap'); /* [AUDIO] tap */ startGame(lvDiff, +b.dataset.l); });\n"
    "$('bContinue').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ startGame(lvDiff, save.prog[lvDiff] || 1); });\n"
    "$('bLvBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showMenu(); });")
# the in-game back button returns to the level list of that difficulty
rep("$('bBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showMenu(); });",
    "$('bBack').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ showLevels(G ? G.diff : 0); });")
rep("function showMenu(){ cgPlay(false); $('zoo').hidden = true;", "function showMenu(){ cgPlay(false); $('zoo').hidden = true; $('levels').hidden = true;")
rep("  $('menu').hidden = true; $('zoo').hidden = true; $('game').hidden = false; newGame(di, level, restore); }",
    "  $('menu').hidden = true; $('zoo').hidden = true; $('levels').hidden = true; $('game').hidden = false; newGame(di, level, restore); }\n"
    "let lvDiff = 0;\n"
    "function showLevels(di){\n"
    "  cgPlay(false); if (G && !G.won) persistState(); G = null; lvDiff = di;\n"
    "  $('menu').hidden = true; $('zoo').hidden = true; $('game').hidden = true; $('levels').hidden = false;\n"
    "  const t = L(), top = save.prog[di] || 1, done = save.done[di] || {}, nDone = top - 1;\n"
    "  // every level below the progress mark has been beaten, even if it was finished before records were kept\n"
    "  const animalOf = l => { if (done[l] && done[l].a) return done[l].a; const f = pickFigure(di, l, levelCfg(di, l)); return f && f.length ? f[0].id : null; };\n"
    "  $('bLvBack').innerHTML = ICON.back; $('bLvBack').setAttribute('aria-label', t.back);\n"
    "  $('tLvTitle').textContent = t.names[di]; $('tLvSub').textContent = t.done(nDone, top);\n"
    "  $('bContinue').innerHTML = '<span class=\"mid\">' + t.cont(top) + '</span><span aria-hidden=\"true\">▶</span>';\n"
    "  let h = '', zooAdded = false;\n"
    "  for (let l = 1; l <= top; l++){ const r = done[l], beat = l < top || !!r, a = beat ? animalOf(l) : null, img = a && zooArt(a);\n"
    "    if (a && !save.zoo[a]){ save.zoo[a] = 1; zooAdded = true; }   // the album agrees with what the level list shows\n"
    "    const st = beat ? '<span class=\"st\">' + [0, 1, 2].map(i => miniStar(i < (r ? r.s : 0))).join('') + '</span>' : '';\n"
    "    h += '<button class=\"lc' + (!beat ? ' next' : '') + '\" type=\"button\" data-l=\"' + l + '\" aria-label=\"' + t.lv(l) + '\">' +\n"
    "      (img ? '<img alt=\"\" src=\"' + img.src + '\">' + '<b>' + l + '</b>' : '<span class=\"no\">' + l + '</span>') + st + '</button>'; }\n"
    "  $('lgrid').innerHTML = h; if (zooAdded) persist();\n"
    "  const cur = $('lgrid').querySelector('.next') || $('lgrid').lastElementChild; if (cur) cur.scrollIntoView({ block: 'center' });\n"
    "}")
# zoo screen hides the level list too
rep("cgPlay(false); $('menu').hidden = true; $('game').hidden = true; $('zoo').hidden = false;",
    "cgPlay(false); $('menu').hidden = true; $('game').hidden = true; $('levels').hidden = true; $('zoo').hidden = false;")

open(dst, 'w', encoding='utf-8').write(s)
print('levels ok', len(s))
