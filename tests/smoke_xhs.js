// 小红书版冒烟测试：用模拟的 window.xhs.miniTool 打开 dist/xhs，玩 3 关，检查中文界面、存档读写、发笔记，任何页面错误或外网请求都算失败。
// 普通浏览器里跑通不代表容器里没问题，上线前仍要在创服平台模拟器和 Android / iOS 真机上验证。
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', 'dist', 'xhs'), OUT = path.resolve(__dirname, '..', 'build');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
const mock = (store) => `(() => { const S = ${JSON.stringify(store)}; window.__xhs = { set: 0, notes: [] };
  window.xhs = { launchOptions: { miniToolEnv: { buildVersion: 9530000, userDataPath: 'usr' } }, miniTool: {
    getStorage: async ({ key }) => ({ errMsg: 'getStorage:ok', data: key in S ? S[key] : null }),
    setStorage: async ({ key, data }) => { S[key] = data; window.__xhs.set++; window.__xhs.last = data; return { errMsg: 'setStorage:ok' }; },
    getWindowInfo: async () => ({ menuButtons: { share: { top: 8, bottom: 40, left: 300, right: 380 } }, safeArea: { top: 0 } }),
    writeTempFile: async ({ data }) => ({ errMsg: 'writeTempFile:ok', filePath: 'tmp/' + data.length + '.jpg' }),
    postNote: async (o) => { window.__xhs.notes.push(o); return { errMsg: 'postNote:ok' }; } } }; })();`;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const b = await chromium.launch(), errs = [];
  const solve = (p) => p.evaluate(() => { while (!G.won) { doHint(); const h = G.hint; place(h.p, h.off); rebuildOcc(); G.hint = null; if (occ.size === G.boardSet.size) win(true); } });
  let saved = null;
  for (const [name, q, withXhs] of [['xhs', '', true], ['nogap', '?nogap', true], ['plain', '', false]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    await ctx.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : (errs.push(name + ': external request ' + r.request().url()), r.abort()));
    if (withXhs) await ctx.addInitScript(mock(saved ? { 'tri-zoo-v1': saved } : {}));
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto(base + q); await p.waitForTimeout(1500);
    const menu = await p.evaluate(() => [document.title, $('tTitle').textContent, $('diffs').innerText.split('\n')[0], getComputedStyle(document.documentElement).getPropertyValue('--sat'), document.documentElement.className]);
    await p.screenshot({ path: OUT + `/xhs-${name}-menu.png` });
    await p.click('.diff[data-d="0"]'); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + `/xhs-${name}-levels.png` });
    await p.click('#bContinue'); await p.waitForTimeout(1000);
    await p.screenshot({ path: OUT + `/xhs-${name}-game.png` });
    await p.mouse.click(200, 600); await p.waitForTimeout(300);
    await solve(p); await p.waitForTimeout(2000);
    await p.screenshot({ path: OUT + `/xhs-${name}-win.png` });
    for (let k = 0; k < 2; k++) { await p.click('#bNext', { force: true }); await p.waitForTimeout(500); await solve(p); await p.waitForTimeout(300); }
    const audio = await p.evaluate(() => [!!window.TRIANGLE_AUDIO, audioHealth.decoded, audioHealth.error]);
    await p.evaluate(() => showZoo()); await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + `/xhs-${name}-zoo.png` });
    let note = null;
    if (withXhs) { await p.click('#bZooShare'); await p.waitForTimeout(800);
      note = await p.evaluate(() => { const n = window.__xhs.notes[0]; return n && [n.title, n.content.slice(0, 40), n.pageType, n.mediaInfo.image_resources[0].url]; });
      await p.waitForTimeout(600); saved = await p.evaluate(() => window.__xhs.last); }
    console.log(name, JSON.stringify({ menu, level: await p.evaluate(() => [G && G.level, zooCount()]), audio, note,
      sets: withXhs ? await p.evaluate(() => window.__xhs.set) : '-' }));
    await ctx.close();
  }
  // 重新打开：存档应从 getStorage 恢复
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(mock({ 'tri-zoo-v1': saved }));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push('reload: ' + e.message)); await p.goto(base); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => [save.prog.join(','), zooCount(), $('bZoo').innerText.replace(/\s+/g, ' ')]);
    console.log('reload', JSON.stringify(r)); if (!(save => save)(r) || r[1] < 1) errs.push('reload: save not restored');
    await ctx.close(); }
  console.log('errors:', errs);
  await b.close(); srv.close();
  if (errs.length) process.exit(1);
})();
