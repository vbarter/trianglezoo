import sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def rep(old, new):
    global s
    if s.count(old) != 1: raise SystemExit('expected 1 of %r, found %d' % (old[:80], s.count(old)))
    s = s.replace(old, new)
# My Zoo and the sound switch share one row at the bottom of the menu
rep('  <button class="zoo-btn" id="bZoo" type="button"></button>\n  <div class="opts">\n    <button class="pill" id="bSound" type="button"></button>\n  </div>\n',
    '  <div class="foot">\n    <button class="zoo-btn" id="bZoo" type="button"></button>\n    <button class="snd" id="bSound" type="button"></button>\n  </div>\n')
rep('/* ---------- level select ---------- */',
    '.foot{display:flex;gap:12px;align-items:stretch;flex-wrap:wrap}\n.foot .zoo-btn{flex:1;width:auto}\n'
    '.snd{flex:none;width:62px;min-height:62px;display:inline-flex;align-items:center;justify-content:center;border-radius:18px;background:var(--card);\n'
    '  box-shadow:0 4px 0 rgba(30,58,76,.16);transition:transform .08s,box-shadow .08s}\n'
    '.snd:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(30,58,76,.16)}\n.snd.off{background:rgba(255,255,255,.6);color:var(--ink-soft)}\n'
    '#triangle-audio-status{flex-basis:100%}\n'
    '/* ---------- level select ---------- */')
rep("  $('bSound').textContent = save.sound ? t.sOn : t.sOff;",
    "  $('bSound').innerHTML = '<svg width=\"30\" height=\"30\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 9h4l5-4v14l-5-4H4z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>'\n"
    "    + (save.sound ? '<path d=\"M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>'\n"
    "                  : '<path d=\"M16 9l6 6M22 9l-6 6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>') + '</svg>';\n"
    "  $('bSound').setAttribute('aria-label', save.sound ? t.sOn : t.sOff); $('bSound').title = save.sound ? t.sOn : t.sOff; $('bSound').classList.toggle('off', !save.sound);")
open(dst, 'w', encoding='utf-8').write(s); print('foot ok')
