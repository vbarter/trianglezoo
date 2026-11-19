#!/usr/bin/env python3
"""小红书小工具版「角角入位」：从 CrazyGames 构建的 build/index.html 生成离线 zip 包。

    bash scripts/build.sh            # 先生成 build/index.html（CrazyGames 版，英文）
    python3 scripts/build_xhs.py     # 再生成 dist/xhs/ 和 dist/TriangleZoo_xhs.zip

做的事情：
- 界面和 22 只动物全部换成中文；去掉 CrazyGames SDK（广告、gameplay 事件、云存档）
- 存档改用 xhs.miniTool 的 setStorage/getStorage（客户端 9.46+），不再碰 localStorage
- 脚本全部外置（容器禁止内联 <script>），语法降到 ES2017（Chrome 61）
- 音效与背景音乐放到单独的 js/audio-data.js，开局后再加载；背景音乐改用 WebAudio 播放（容器不允许 data: 音频）
- CSS 加 Chrome 61 基线：inset 展开、flex gap 的 margin 回退、grid-gap、安全区变量
- 「我的动物园」加「发笔记」按钮：生成收集图，调 postNote 唤起图文发布页
- 合规审计（禁用 API、ES2018+ 语法、外链、文件类型、base64 体积），不通过就退出

只依赖 Python 3 标准库。
"""
import base64, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'build', 'index.html')
XHS = os.path.join(ROOT, 'src', 'xhs')
OUT = os.path.join(ROOT, 'dist', 'xhs')
ZIP = os.path.join(ROOT, 'dist', 'TriangleZoo_xhs.zip')

TITLE = '角角入位'
SUB = '用彩色三角拼块填满小动物，它就会活过来！'


def rep(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        sys.exit('build_xhs: expected %d of %r, found %d' % (count, old[:90], n))
    return s.replace(old, new)


def cut(s, a, b, new):
    i = s.index(a); j = s.index(b, i) + len(b)
    return s[:i] + new + s[j:]


# ------------------------------------------------------------------ 中文文案
ZH = r"""const T = {
  zh: { title: '%(title)s', sub: '%(sub)s',
        zoo: '我的动物园', cont: n => '继续 · 第 ' + n + ' 关', done: (a, b) => '已过 ' + a + ' 关 · 当前第 ' + b + ' 关', zooN: (a, b) => '已收集 ' + a + ' / ' + b + ' 只', newZoo: '认识了新朋友！', locked: '？？？',
        zooTip: '过关就能认识新动物，点一点小伙伴跟它打个招呼', zooAll: '所有小动物都找到啦！', names: ['入门', '普通', '困难', '大师'],
        pcs: (a, b) => a + '–' + b + ' 块', rot: ' · 要旋转', lv: n => '第 ' + n + ' 关', hint: '提示', reset: '重来', back: '返回',
        tipDrag: '按住拼块，拖进白色图形', tipRot: '点一下拼块可以旋转', tipFlip: '有的拼块要先翻面才放得进去',
        extra: n => '有 ' + n + ' 块是多余的，用不上', extraShort: n => '多 ' + n + ' 块',
        dead: '这样拼不满了，挪一块试试，或者点提示',
        rotBtn: '旋转', flipBtn: '翻面', noHint: '没用提示', usedHint: n => '用了 ' + n + ' 次提示', win: '拼好了！', next: '下一关', again: '再玩一次', sOn: '声音：开', sOff: '声音：关', rotate: '请竖着拿手机玩',
        share: '发笔记', shareTitle: '我的三角动物园', shareBusy: '正在生成图片…', shareFail: '没能打开发布页，请稍后再试', shareLeft: k => '还差 ' + k + ' 只没找到，一起来拼吧！',
        shareText: (a, b) => '在「%(title)s」里用三角拼块拼出了 ' + a + ' / ' + b + ' 只小动物，你能集齐吗？ #益智游戏 #拼图 #小游戏',
        figs: { cat: '猫咪', fox: '狐狸', bear: '小熊', panda: '熊猫', pig: '小猪', rabbit: '兔子', owl: '猫头鹰', frog: '青蛙', mouse: '小老鼠', lion: '狮子', penguin: '企鹅', chick: '小鸡', fish: '小鱼', whale: '鲸鱼', turtle: '乌龟', snail: '蜗牛', duck: '鸭子', crab: '螃蟹', butterfly: '蝴蝶', dino: '恐龙', elephant: '大象', octopus: '章鱼' } },
};
""" % {'title': TITLE, 'sub': SUB}
FIG_IDS = ['cat', 'fox', 'bear', 'panda', 'pig', 'rabbit', 'owl', 'frog', 'mouse', 'lion', 'penguin', 'chick', 'fish', 'whale',
           'turtle', 'snail', 'duck', 'crab', 'butterfly', 'dino', 'elephant', 'octopus']

# ------------------------------------------------------------------ 背景音乐：WebAudio 版，接口和原来的 HTMLAudioElement 用法一致
BUFFER_MUSIC = r"""// 小红书容器不允许 data: 音频，背景音乐改为解码成 AudioBuffer 后循环播放；对外保持 play/pause/paused/load 的用法
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
"""

# ------------------------------------------------------------------ 小红书平台段（替换 CrazyGames 段）
XHS_SECTION = r"""// ===================== 小红书小工具 =====================
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
"""

SHARE_ICON = ('<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" '
              'stroke-linecap="round" stroke-linejoin="round"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>')


def patch_js(js):
    """build/index.html 里的游戏脚本 → 小红书版（中文、无 SDK、容器存储、ES2017）"""
    # 文案
    i = js.index('const T = {\n  en: {'); j = js.index('\n};\n', i) + 4
    js = js[:i] + ZH + js[j:]
    js = rep(js, "let save = { lang: 'en',", "let save = { lang: 'zh',")
    js = rep(js, "function pickLang(){ save.lang = 'en'; }", "function pickLang(){ save.lang = 'zh'; }")
    js = rep(js, 'const L = () => T.en;', 'const L = () => T.zh;')
    js = rep(js, "  return 'Sound unavailable. Tap to retry';", "  return '声音没能加载，点这里重试';")
    js = rep(js, "console.warn('Triangle Tiles audio:', error);", "console.warn('角角入位 audio:', error);")

    # 存档：只用小工具 Storage（js/platform.js 先把存档读进内存，这里同步读写那份缓存）
    js = rep(js, "function cgData(){ try { const sdk = window.CrazyGames && window.CrazyGames.SDK; return sdk && cgReady && sdk.environment !== 'disabled' ? sdk.data : null; } catch (e) { return null; } }\n", '')
    js = rep(js, "function readSave(){ try { const d = cgData(), raw = d ? d.getItem(SKEY) : localStorage.getItem(SKEY);",
             "function readSave(){ try { const raw = window.TZP.getItem(SKEY);")
    js = rep(js, "let cgReady = false;\nreadSave();", "readSave();")
    js = rep(js, "function persist(){ const v = JSON.stringify(save); try { const d = cgData(); if (d) d.setItem(SKEY, v); } catch (e) {} try { localStorage.setItem(SKEY, v); } catch (e) {} }",
             "function persist(){ try { window.TZP.setItem(SKEY, JSON.stringify(save)); } catch (e) {} }")

    # ES2018+ 语法 / Chrome 61 没有的 API
    js = rep(js, 'audioHealth.error = String(error?.message || error);', 'audioHealth.error = String((error && error.message) || error);')
    js = rep(js, 'if (now - (recentSounds[name] ?? -1) < .055) return;', "if (now - (recentSounds[name] != null ? recentSounds[name] : -1) < .055) return;")
    js = rep(js, "    }).finally(() => { if (epoch === musicEpoch) musicPending = false; });",
             "    }).then(() => { if (epoch === musicEpoch) musicPending = false; }, () => { if (epoch === musicEpoch) musicPending = false; });")

    # 音频：数据移到 js/audio-data.js；音效等数据到了再解码；音乐走 WebAudio
    m = re.search(r'const TRIANGLE_AUDIO=(\{.*?\});\n', js, flags=re.S)
    if not m: sys.exit('build_xhs: TRIANGLE_AUDIO not found')
    audio = m.group(1)
    js = js[:m.start()] + js[m.end():]
    js = rep(js, '// ===================== AUDIO =====================', '// ===================== AUDIO =====================\n' + BUFFER_MUSIC)
    js = rep(js, "  if (!audioLoading) {\n    audioLoading = Promise.all(Object.entries(TRIANGLE_AUDIO.sfx).map(async ([name, uri]) => {",
             "  if (!audioLoading) {\n    audioLoading = audioData().then(data => Promise.all(Object.entries(data.sfx).map(async ([name, uri]) => {")
    js = rep(js, "        audioCache[name] = await AC.decodeAudioData(bytes);\n      } catch (error) { audioProblem(new Error(name + ': ' + error.message)); }\n    })).then(",
             "        audioCache[name] = await new Promise((ok, bad) => AC.decodeAudioData(bytes, ok, bad));\n      } catch (error) { audioProblem(new Error(name + ': ' + (error && error.message))); }\n    }))).then(")
    js = rep(js, "    }))).then(() => { audioHealth.decoded = Object.keys(audioCache).length; updateAudioStatus(); });",
             "    }))).then(() => { audioHealth.decoded = Object.keys(audioCache).length; updateAudioStatus(); }, error => { audioLoading = null; audioProblem(error); });")
    js = rep(js, '    bgm = new Audio(TRIANGLE_AUDIO.music);', '    bgm = makeBufferMusic();')
    # AudioContext 刚恢复时音乐可能被拒，下次点击再试
    js = rep(js, "  if (AC.state === 'suspended') AC.resume().catch(audioProblem);",
             "  if (AC.state === 'suspended') AC.resume().then(() => { if (soundOn() && bgm && bgm.paused) music(); }, audioProblem);")

    # CrazyGames 段 → 小红书段
    i = js.index('// ===================== CrazyGames =====================')
    js = js[:i] + XHS_SECTION

    # aspect-ratio（Chrome 88+）的回退：没有时按宽度写高度
    js = rep(js, "  const cv2 = card.cv, f = card.f, d = f.zoo, w = cv2.clientWidth, h = cv2.clientHeight; if (!w) return;",
             "  if (window.TZ_NO_AR && card.cv.clientWidth && card.cv.style.height !== card.cv.clientWidth + 'px') card.cv.style.height = card.cv.clientWidth + 'px';\n"
             "  const cv2 = card.cv, f = card.f, d = f.zoo, w = cv2.clientWidth, h = cv2.clientHeight; if (!w) return;")
    js = rep(js, "  $('lgrid').innerHTML = h; if (zooAdded) persist();",
             "  $('lgrid').innerHTML = h; if (zooAdded) persist();\n"
             "  if (window.TZ_NO_AR) Array.prototype.forEach.call($('lgrid').children, el => { el.style.height = Math.round(el.clientWidth * 1.12) + 'px'; });")

    # 「我的动物园」：右上角的发笔记按钮（只有容器提供 postNote 时才显示）
    js = rep(js, "  $('bZooBack').innerHTML = ICON.back; $('bZooBack').setAttribute('aria-label', t.back);",
             "  $('bZooBack').innerHTML = ICON.back; $('bZooBack').setAttribute('aria-label', t.back);\n"
             "  { const sb = $('bZooShare'); sb.innerHTML = '" + SHARE_ICON + "'; sb.setAttribute('aria-label', t.share); sb.title = t.share;\n"
             "    sb.style.visibility = window.TZP.canPost && zooCount() > 0 ? 'visible' : 'hidden'; }")
    return js, audio


# ------------------------------------------------------------------ CSS：Chrome 61 基线
COLUMN = {'#rotate', '#menu', '.diffs', '.zc', '.lc', '#win', '.screen'}
FUNC = re.compile(r'(?<![\w-])(clamp|min|max|env)\(')


def patch_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    # 安全区：compat.js 量好写进 --sat / --sab
    css = rep(css, 'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)',
              'padding-top:0;padding-top:var(--sat,0px);padding-bottom:0;padding-bottom:var(--sab,0px)')
    out, extra = [], []

    def do_rule(sel, body):
        decls = []
        for d in body.split(';'):
            if ':' not in d: continue
            p, v = d.split(':', 1); decls.append((p.strip(), v.strip()))
        dmap = dict(decls)
        sels = [x.strip() for x in sel.split(',')]
        res = []
        for p, v in decls:
            if p == 'inset':
                q = v.split(); q = (q * 4)[:4] if len(q) == 1 else q
                res += [('top', q[0]), ('right', q[1]), ('bottom', q[2]), ('left', q[3])]
                continue
            if p in ('gap', 'row-gap', 'column-gap'):
                if 'grid' in dmap.get('display', ''):
                    res.append(('grid-gap', v))
                else:
                    g = v.split(); rg, cg = g[0], g[-1]
                    for x in sels:
                        col = 'column' in dmap.get('flex-direction', '') or x in COLUMN
                        extra.append('.no-flex-gap %s > * + *{%s}' % (x, 'margin-top:%s' % rg if col else 'margin-left:%s' % cg))
            res.append((p, v))
        return sel + '{' + ';'.join('%s:%s' % pv for pv in res) + '}'

    i, n = 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0: out.append(css[i:]); break
        pre = css[i:j].strip()
        depth, k = 0, j
        while True:
            if css[k] == '{': depth += 1
            elif css[k] == '}':
                depth -= 1
                if depth == 0: break
            k += 1
        body = css[j + 1:k]
        if pre.startswith('@media'):
            inner, m = [], 0
            for mm in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
                inner.append(do_rule(mm.group(1).strip(), mm.group(2)))
            out.append(pre + '{' + '\n'.join(inner) + '}')
        elif pre.startswith('@'):
            out.append(pre + '{' + body + '}')
        else:
            out.append(do_rule(pre, body))
        i = k + 1
    xhs = """
/* ---------- 小红书容器 ---------- */
html{touch-action:manipulation}
.no-flex-gap #triangle-audio-status{margin-left:0}
.no-flex-gap .foot > * + *{margin-left:12px}
.no-ar .lc{min-height:84px}
.no-flex-gap #win .fig{margin-top:4px}
.no-flex-gap #win .note{margin-top:6px}
.zoo-btn .mid{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.boot{margin:auto 0;text-align:center;font-size:16px;color:var(--ink-soft);line-height:1.6}
"""
    return '\n'.join(out) + '\n' + '\n'.join(extra) + '\n' + xhs


# ------------------------------------------------------------------ HTML
def patch_html(h):
    h = rep(h, '<html lang="en">', '<html lang="zh-CN">')
    h = rep(h, '<meta charset="utf-8">', '<meta charset="UTF-8">')
    h = rep(h, 'maximum-scale=1, user-scalable=no, viewport-fit=cover">', 'maximum-scale=1, user-scalable=no, viewport-fit=cover">\n'
            '<meta name="description" content="%s：拖动彩色三角拼块填满动物剪影，拼好它就会眨眼蹦跳，收集全部 22 只小动物。">' % TITLE)
    h = re.sub(r'<link rel="icon" href="data:[^"]*">\n', '', h)
    h = rep(h, '<title>Triangle Zoo</title>', '<title>%s</title>' % TITLE)
    h = rep(h, '<!-- CrazyGames SDK v3. The game also runs without it (offline or blocked): every call goes through the cg* helpers below. -->\n'
            '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n', '')
    h = rep(h, '<h1 id="tTitle">Triangle Zoo</h1>', '<h1 id="tTitle">%s</h1>' % TITLE)
    h = rep(h, '<p class="sub" id="tSub"></p>', '<p class="sub" id="tSub">%s</p>' % SUB)
    # 首屏：脚本还没跑完时也能看到标题和加载状态
    h = rep(h, '<div class="diffs" id="diffs"></div>',
            '<div class="diffs" id="diffs"><p class="boot" role="status">正在准备关卡…<br>如果长时间没有进入，请退出后重新打开</p></div>')
    # 动物园右上角：发笔记
    h = rep(h, '    <div class="lvl"><b id="tZoo"></b><span id="tZooN"></span></div>\n    <span style="width:50px;flex:none"></span>',
            '    <div class="lvl"><b id="tZoo"></b><span id="tZooN"></span></div>\n    <button class="ib" id="bZooShare" type="button" style="visibility:hidden"></button>')
    return h


# ------------------------------------------------------------------ build
def main():
    if not os.path.exists(SRC): sys.exit('build_xhs: build/index.html missing, run bash scripts/build.sh first')
    s = open(SRC, encoding='utf-8').read()
    a = s.index('<style>'); b = s.index('</style>', a)
    css = s[a + 7:b]
    c = s.index('<script>\n', b); d = s.rindex('</script>')
    js = s[c + len('<script>\n'):d]
    html = s[:a] + '<link rel="stylesheet" href="./style.css">' + s[b + 8:c] + \
        '<script src="./js/compat.js"></script>\n<script src="./js/platform.js"></script>\n<script src="./js/game.js"></script>' + s[d + 9:]

    js, audio = patch_js(js)
    # 背景音乐换成单声道 80 kbps 版本（src/xhs/music.mp3），单条 base64 解码后 < 1 MiB
    music = base64.b64encode(open(os.path.join(XHS, 'music.mp3'), 'rb').read()).decode()
    audio = re.sub(r'"music":"data:audio/mpeg;base64,[A-Za-z0-9+/=]+"', '"music":"data:audio/mpeg;base64,' + music + '"', audio)

    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT + '/js')
    open(OUT + '/index.html', 'w', encoding='utf-8').write(patch_html(html))
    open(OUT + '/style.css', 'w', encoding='utf-8').write('/* 角角入位 — 小红书小工具样式：Chrome 61 基线 + 增强（由 scripts/build_xhs.py 生成） */\n' + patch_css(css))
    open(OUT + '/js/game.js', 'w', encoding='utf-8').write('/* 角角入位 — 游戏脚本（由 scripts/build_xhs.py 生成） */\n' + js)
    open(OUT + '/js/audio-data.js', 'w', encoding='utf-8').write('/* 角角入位 — 音效与背景音乐（mp3，WebAudio 解码） */\nwindow.TRIANGLE_AUDIO = ' + audio + ';\n')
    for f in ('platform.js', 'compat.js'):
        shutil.copy(os.path.join(XHS, f), OUT + '/js/' + f)

    errors = audit()
    if errors:
        print('FAILED'); [print('  ERROR', e) for e in errors]; sys.exit(1)
    if os.path.exists(ZIP): os.remove(ZIP)
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for root, _, files in os.walk(OUT):
            for f in sorted(files):
                if f.startswith('.'): continue
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, OUT))   # zip 根目录就是 index.html
    print('zip', os.path.relpath(ZIP, ROOT), os.path.getsize(ZIP), 'bytes', '%.2f MiB' % (os.path.getsize(ZIP) / 1048576))


# ------------------------------------------------------------------ 合规审计
NS = re.compile(r'http://www\.w3\.org/(2000/svg|1999/xlink)')   # SVG 命名空间，不是网络请求
BANNED_JS = [r'\bfetch\(', r'XMLHttpRequest', r'new WebSocket\(', r'new EventSource\(', r'RTCPeerConnection', r'navigator\.geolocation', r'navigator\.clipboard',
             r'execCommand\(', r'navigator\.(bluetooth|usb|hid|serial|getBattery|connection|credentials|locks)', r'enumerateDevices', r'getDisplayMedia',
             r'storage\.persist', r'serviceWorker', r'new Worker\(', r'new SharedWorker\(', r'DeviceMotionEvent|DeviceOrientationEvent|devicemotion|deviceorientation',
             r'[rR]equestFullscreen', r'\beval\(', r'new Function\(', r'WebAssembly', r'window\.open\(', r'\bprompt\(', r'location\.(href\s*=|assign\()', r'https?://',
             r'localStorage|sessionStorage|indexedDB|document\.cookie|caches\.', r'new Audio\(', r'CrazyGames', r'^\s*(import|export)\s',
             r'\?\.[a-zA-Z_(\[]', r'\?\?', r'\{\s*\.\.\.', r'catch\s*\{', r'\.finally\(',
             r'\.replaceAll\(|\.at\(|Object\.hasOwn|Object\.fromEntries|structuredClone|\.flat\(|\.flatMap\(|globalThis|\|\|=|&&=|\?\?=|matchAll|allSettled|roundRect']
ALLOWED_EXT = {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json'}


def strip_comments(code):
    # 只去掉块注释和整行 // 注释（行内 // 可能出现在字符串里，例如 data URI）
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.S)
    return '\n'.join('' if l.lstrip().startswith('//') else l for l in code.split('\n'))


def audit():
    errs, files = [], []
    for root, _, fs in os.walk(OUT):
        for f in fs: files.append(os.path.relpath(os.path.join(root, f), OUT))
    if 'index.html' not in files: errs.append('index.html not at root')
    if sum(1 for f in files if f.endswith('.html')) != 1: errs.append('must have exactly one html')
    for f in files:
        if os.path.splitext(f)[1].lower() not in ALLOWED_EXT: errs.append('file type not allowed: ' + f)
        if os.path.basename(f).startswith('.'): errs.append('hidden file: ' + f)
    h = open(OUT + '/index.html', encoding='utf-8').read()
    if re.search(r'<script(?![^>]*\bsrc=)[^>]*>', h): errs.append('inline <script> in index.html')
    if re.search(r'\son[a-z]+\s*=', h): errs.append('inline event handler in index.html')
    if re.search(r'type="module"|<base |<iframe|<object|http-equiv|javascript:', h): errs.append('forbidden markup in index.html')
    if re.search(r'https?://', NS.sub('', h)): errs.append('external reference in index.html')
    if 'viewport-fit=cover' not in h or 'lang="zh-CN"' not in h or not h.startswith('<!DOCTYPE html>'): errs.append('index.html head requirements')
    for ref in re.findall(r'<(?:script|link)[^>]*(?:src|href)="([^"]+)"', h):
        if ref.startswith('/') or not os.path.exists(os.path.join(OUT, ref)): errs.append('bad reference: ' + ref)
    for f in files:
        if not f.endswith('.js'): continue
        code = strip_comments(open(OUT + '/' + f, encoding='utf-8').read())
        code = NS.sub('', code)
        for pat in BANNED_JS:
            m = re.search(pat, code, flags=re.M)
            if m: errs.append('%s: banned pattern %r near "%s"' % (f, pat, code[max(0, m.start() - 40):m.end() + 40].strip()))
        if re.search(r"""\son[a-z]+=\\?["']""", code): errs.append(f + ': inline event handler in generated markup')
    c = open(OUT + '/style.css', encoding='utf-8').read()
    for pat in [r'(?<![\w-])inset\s*:', r'@import', r'@container', r'@layer', r':has\(', r'\benv\(']:
        if re.search(pat, c): errs.append('style.css: ' + pat)
    if re.search(r'https?://', NS.sub('', c)): errs.append('style.css: external reference')
    # 用到 Chrome 61 不认识的值（dvh / clamp / min / max）时，同一条规则里前面必须有同属性的普通写法
    for rule in re.findall(r'\{([^{}]*)\}', c):
        seen = {}
        for dcl in rule.split(';'):
            if ':' not in dcl: continue
            p, v = dcl.split(':', 1); p = p.strip()
            modern = bool(FUNC.search(v)) or bool(re.search(r'\d(dvh|svh|lvh)\b', v))
            if modern and not seen.get(p): errs.append('style.css: no baseline before "%s:%s"' % (p, v[:60]))
            if not modern: seen[p] = True
    # base64
    for f in files:
        if f.endswith(('.js', '.css', '.html')):
            s = open(OUT + '/' + f, encoding='utf-8').read()
            for m in re.finditer(r'base64,([A-Za-z0-9+/=]{1000,})', s):
                size = len(m.group(1)) * 3 / 4
                if size > 1024 * 1024: errs.append('%s: base64 %.0f KiB > 1 MiB' % (f, size / 1024))
                elif size > 100 * 1024: print('  WARN %s: base64 %.0f KiB (> 100 KiB; mp3 不在容器允许的文件类型里，只能内嵌)' % (f, size / 1024))
    sizes = sorted(((os.path.getsize(OUT + '/' + f), f) for f in files), reverse=True)
    print('files', len(files), 'unzipped', sum(x for x, _ in sizes), 'bytes:', ', '.join('%s %d' % (f, x) for x, f in sizes))
    return errs


if __name__ == '__main__':
    main()
