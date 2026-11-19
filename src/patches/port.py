import sys, re
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit('expected %d of %r, found %d' % (count, old[:80], n))
    s = s.replace(old, new)

# --- head: drop external fonts, add CrazyGames SDK v3 ---
rep('<link rel="preconnect" href="https://fonts.googleapis.com">\n<!-- fonts load without blocking the page, so the game still opens where Google Fonts is unreachable -->\n'
    '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">\n',
    '<!-- CrazyGames SDK v3. The game also runs without it (offline or blocked): every call goes through the cg* helpers below. -->\n'
    '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n')
rep('maximum-scale=1, user-scalable=no">', 'maximum-scale=1, user-scalable=no, viewport-fit=cover">')

# --- CSS: portrait column centred in any viewport ---
rep('html,body{height:100%;margin:0}',
    'html,body{height:100%;margin:0}\n'
    '/* portrait: the game always lives in a 9:16 (or narrower) column; wide screens get a patterned backdrop on both sides */\n'
    'html{background:#C4E2E1}\n'
    'body{display:flex;justify-content:center;align-items:stretch;height:100vh;height:100dvh;\n'
    '  background:#C4E2E1 url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'69.28\'%3E%3Cpath d=\'M0 0h40L20 34.64zM20 34.64L40 69.28H0z\' fill=\'%23B6D9D8\'/%3E%3C/svg%3E") repeat}\n'
    '#app{position:relative;height:100%;width:100%;max-width:calc(100vh * 9 / 16);max-width:calc(100dvh * 9 / 16);background:var(--mat);overflow:hidden;\n'
    '  box-shadow:0 0 0 1px rgba(30,58,76,.08),0 0 40px rgba(30,58,76,.18);padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}\n'
    '#rotate{display:none;position:fixed;inset:0;z-index:50;background:var(--mat);flex-direction:column;align-items:center;justify-content:center;gap:14px;\n'
    '  font-family:var(--display);font-size:24px;text-align:center;padding:20px}\n'
    '#rotate svg{animation:tip 1.8s ease-in-out infinite}\n'
    '@keyframes tip{0%,30%{transform:rotate(-90deg)}60%,100%{transform:rotate(0)}}\n'
    '@media (orientation:landscape) and (max-height:500px) and (pointer:coarse){ #rotate{display:flex} }')
# the menu is centred inside the column, not the window
rep('#menu{overflow-y:auto;padding:22px 20px 18px;gap:16px;max-width:560px;margin:0 auto;width:100%}',
    '#menu{overflow-y:auto;padding:22px 20px 18px;gap:16px;width:100%}')
rep('@media (max-height:620px){', '@media (max-width:380px){ h1{font-size:38px} #hero{width:120px;height:120px} .diff .nm{font-size:21px} }\n@media (max-height:620px){')

# --- body: wrap screens in #app, add rotate prompt ---
rep('<body>\n\n<section id="menu" class="screen">', '<body>\n<div id="app">\n<section id="menu" class="screen">')
rep('    </div>\n  </div>\n</section>\n\n<script>',
    '    </div>\n  </div>\n</section>\n</div>\n<div id="rotate" aria-live="polite">'
    '<svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5" fill="#fff" stroke="#1E3A4C" stroke-width="1.8"/><circle cx="12" cy="18.5" r="1" fill="#1E3A4C"/></svg>'
    '<div id="tRotate"></div></div>\n\n<script>')

# --- layout: always the portrait arrangement (board above, tray below) ---
rep('const pad = 12, land = W > Hc * 1.15, np = G.pieces.length;', 'const pad = 12, land = false, np = G.pieces.length;')

# --- text for the rotate prompt ---
rep("sOn: '声音：开', sOff: '声音：关',", "sOn: '声音：开', sOff: '声音：关', rotate: '请竖着拿手机玩',")
rep("sOn: 'Sound: on', sOff: 'Sound: off',", "sOn: 'Sound: on', sOff: 'Sound: off', rotate: 'Please turn your phone upright',")
rep("sOn: 'サウンド：オン', sOff: 'サウンド：オフ',", "sOn: 'サウンド：オン', sOff: 'サウンド：オフ', rotate: 'スマホをたてにしてね',")
rep("$('bSound').textContent = save.sound ? t.sOn : t.sOff;", "$('bSound').textContent = save.sound ? t.sOn : t.sOff; $('tRotate').textContent = t.rotate;")

# --- save: CrazyGames data module when available (syncs for signed-in players), else localStorage ---
rep("try { const s = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (s && Array.isArray(s.prog)) save = Object.assign(save, s); } catch (e) {}\n"
    "if (!Array.isArray(save.cur)) save.cur = [null, null, null, null];",
    "function cgData(){ try { const sdk = window.CrazyGames && window.CrazyGames.SDK; return sdk && cgReady && sdk.environment !== 'disabled' ? sdk.data : null; } catch (e) { return null; } }\n"
    "function readSave(){ try { const d = cgData(), raw = d ? d.getItem(SKEY) : localStorage.getItem(SKEY);\n"
    "  const s = JSON.parse(raw || 'null'); if (s && Array.isArray(s.prog)) save = Object.assign(save, s); } catch (e) {}\n"
    "  if (!Array.isArray(save.cur)) save.cur = [null, null, null, null]; }\n"
    "let cgReady = false;\nreadSave();")
rep("function persist(){ try { localStorage.setItem(SKEY, JSON.stringify(save)); } catch (e) {} }",
    "function persist(){ const v = JSON.stringify(save); try { const d = cgData(); if (d) d.setItem(SKEY, v); } catch (e) {} try { localStorage.setItem(SKEY, v); } catch (e) {} }")
# keep the language pick after a reload of the save
rep("(function pickLang(){", "function pickLang(){")
rep("if (q && T[q]) save.lang = q; else if (!T[save.lang]) save.lang = nav.indexOf('zh') === 0 ? 'zh' : nav.indexOf('ja') === 0 ? 'ja' : 'en'; })();",
    "if (q && T[q]) save.lang = q; else if (!T[save.lang]) save.lang = nav.indexOf('zh') === 0 ? 'zh' : nav.indexOf('ja') === 0 ? 'ja' : 'en'; }\npickLang();")

# --- audio: also silent while an ad plays or when the platform mutes the game ---
a0 = s.index('// ===================== AUDIO')
a1 = s.index('// ===================== colours')
audio = s[a0:a1]
audio = audio.replace('!save.sound || document.hidden', '!soundOn()').replace('save.sound && !document.hidden', 'soundOn()')
audio = audio.replace("{ if (save.sound) music(); }", "{ if (soundOn()) music(); }")
audio = "let cgMuted = false, adPlaying = false;\nconst soundOn = () => save.sound && !cgMuted && !adPlaying && !document.hidden;\n" + audio
s = s[:a0] + audio + s[a1:]

# --- CrazyGames gameplay events ---
rep("  if (occ.size === G.boardSet.size) win(true); else sfx('start'); /* [AUDIO] start */\n}",
    "  if (occ.size === G.boardSet.size) win(true); else { sfx('start'); /* [AUDIO] start */ cgPlay(true); }\n}")
rep("  G.won = true; G.hint = null; G.dead = false; updateTip(); $('acts').hidden = true;",
    "  G.won = true; G.hint = null; G.dead = false; updateTip(); $('acts').hidden = true; cgPlay(false); if (!quiet) cgHappy();")
rep("function showMenu(){ if (G && !G.won) persistState();", "function showMenu(){ cgPlay(false); if (G && !G.won) persistState();")
rep("$('bNext').addEventListener('click', () => { sfx('tap'); /* [AUDIO] tap */ startGame(G.diff, G.level + 1); });",
    "$('bNext').addEventListener('click', () => { if (adPlaying) return; sfx('tap'); /* [AUDIO] tap */ const di = G.diff, lv = G.level + 1;\n"
    "  // a natural break between levels: offer a midgame ad (the platform decides whether one actually shows)\n"
    "  cgMidgame(() => startGame(di, lv)); });")

# --- boot: wait for the SDK, then start ---
b0 = s.index('// keep a viewer\'s place when the page is republished')
b1 = s.index('</script>\n</body>')
s = s[:b0] + r'''// ===================== CrazyGames =====================
// All SDK use lives here. Each helper is a no-op when the SDK did not load, so the file still plays on its own.
const CG = () => (cgReady && window.CrazyGames && window.CrazyGames.SDK) || null;
let cgPlaying = false, cgAdCount = 0;
function cgPlay(on){ const sdk = CG(); if (!sdk || on === cgPlaying) return; cgPlaying = on;
  try { on ? sdk.game.gameplayStart() : sdk.game.gameplayStop(); } catch (e) {} }
function cgHappy(){ const sdk = CG(); if (!sdk) return; try { sdk.game.happytime(); } catch (e) {} }
// midgame ad between levels; from level 3 on, every second "next" asks for one
function cgMidgame(then){
  const sdk = CG(); cgAdCount++;
  if (!sdk || G && G.level < 2 || cgAdCount % 2) { then(); return; }
  let done = false; const finish = () => { if (done) return; done = true; adPlaying = false; music(); then(); };
  try {
    sdk.ad.requestAd('midgame', {
      adStarted: () => { adPlaying = true; quietSounds(); },
      adFinished: finish,
      adError: finish,
    });
  } catch (e) { finish(); }
}
function cgSettings(st){ cgMuted = !!(st && st.muteAudio); quietSounds(); if (soundOn()) music(); }
async function cgInit(){
  const sdk = window.CrazyGames && window.CrazyGames.SDK; if (!sdk) return;
  try {
    await sdk.init(); cgReady = true;
    try { sdk.game.loadingStart(); } catch (e) {}
    try { cgSettings(sdk.game.settings); sdk.game.addSettingsChangeListener(cgSettings); } catch (e) {}
    readSave(); pickLang();
  } catch (e) { cgReady = false; console.warn('CrazyGames SDK unavailable:', e); }
}
// arrow keys and space must not scroll the page that hosts the game
window.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) && e.target === document.body) e.preventDefault(); });
document.addEventListener('contextmenu', e => { if (e.target === cv) e.preventDefault(); });

(async function boot(){
  await cgInit();
  renderText(); showMenu();
  const sdk = CG(); if (sdk) try { sdk.game.loadingStop(); } catch (e) {}
})();
''' + s[b1:]

open(dst, 'w', encoding='utf-8').write(s)
print('ok', len(s))

# ===== English only (CrazyGames release) =====
s = open(dst, encoding='utf-8').read()
def rep2(old, new):
    global s
    if s.count(old) != 1: raise SystemExit('EN: expected 1 of %r, found %d' % (old[:70], s.count(old)))
    s = s.replace(old, new)
rep2('<html lang="zh-CN">', '<html lang="en">')
rep2('<title>三角拼拼</title>', '<title>Triangle Tiles</title>')
rep2('<h1 id="tTitle">三角拼拼</h1>', '<h1 id="tTitle">Triangle Tiles</h1>')
i0 = s.index('    <select class="pill" id="selLang"'); i1 = s.index('</select>\n', i0) + len('</select>\n'); s = s[:i0] + s[i1:]
z0 = s.index('  zh: { title:'); z1 = s.index('  en: { title:'); s = s[:z0] + s[z1:]
j0 = s.index('  ja: { title:'); j1 = s.index('};\n', j0); s = s[:j0] + s[j1:]
rep2("let save = { lang: null,", "let save = { lang: 'en',")
p0 = s.index('function pickLang(){'); p1 = s.index('}\npickLang();', p0) + 1
s = s[:p0] + "function pickLang(){ save.lang = 'en'; }" + s[p1:]
rep2('const L = () => T[save.lang] || T.zh;', 'const L = () => T.en;')
rep2("  const lang = save.lang || 'zh';\n  return { zh: '声音未能加载，点此重试', en: 'Sound unavailable. Tap to retry', ja: '音声を読み込めません。再試行' }[lang];",
     "  return 'Sound unavailable. Tap to retry';")
rep2(" $('selLang').value = save.lang;", "")
rep2("$('selLang').addEventListener('change', e => { save.lang = e.target.value; persist(); renderText(); });\n", "")
rep2("document.documentElement.lang = save.lang === 'zh' ? 'zh-CN' : save.lang; ", "")
open(dst, 'w', encoding='utf-8').write(s)
print('english ok')
