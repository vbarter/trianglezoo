const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
// Smoke test: loads dist/index.html on a phone, a desktop and without the SDK, plays 3 levels with hints, fails on any page error.
const MOCK = `window.__cg=[];window.CrazyGames={SDK:{environment:'local',
 init:async()=>{__cg.push('init')},
 game:{settings:{muteAudio:false},addSettingsChangeListener(){},loadingStart(){__cg.push('loadingStart')},loadingStop(){__cg.push('loadingStop')},
  gameplayStart(){__cg.push('gameplayStart')},gameplayStop(){__cg.push('gameplayStop')},happytime(){__cg.push('happytime')}},
 ad:{requestAd(t,cb){__cg.push('ad:'+t);cb.adStarted();setTimeout(cb.adFinished,50)}},
 data:{_m:{},getItem(k){return this._m[k]??null},setItem(k,v){this._m[k]=v;__cg.push('data.set')}}}};`;
(async () => {
  fs.mkdirSync(path.resolve(__dirname, '..', 'build'), { recursive: true });
  const b = await chromium.launch();
  const url = 'file://' + path.resolve(__dirname, '..', 'dist', 'index.html');
  const errs = [];
  for (const [name, vp, mock] of [['phone',{width:390,height:844},true],['desktop',{width:1280,height:720},true],['nosdk',{width:390,height:844},false]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errs.push(name+': '+e.message));
    await p.route('https://sdk.crazygames.com/**', r => mock ? r.fulfill({contentType:'application/javascript', body: MOCK}) : r.abort());
    await p.goto(url); await p.waitForTimeout(1500);
    await p.screenshot({ path: path.resolve(__dirname, '..', 'build') + `/shot-${name}-menu.png` });
    await p.click('.diff[data-d="1"]'); await p.waitForTimeout(300); await p.click('#bContinue'); await p.waitForTimeout(1200);
    await p.screenshot({ path: path.resolve(__dirname, '..', 'build') + `/shot-${name}-game.png` });
    // auto-solve via hints until won
    for (let i=0;i<30;i++){ const won = await p.evaluate(()=>G&&G.won); if (won) break;
      await p.evaluate(()=>{ doHint(); const h=G.hint; if(h){ place(h.p,h.off); rebuildOcc(); G.hint=null; G.pieces.forEach(retarget); if (occ.size===G.boardSet.size) win(false);} }); }
    await p.waitForTimeout(1800);
    await p.screenshot({ path: path.resolve(__dirname, '..', 'build') + `/shot-${name}-win.png` });
    for (let k=0;k<3;k++){ await p.evaluate(()=>{ if(!G.won){ while(!G.won){doHint();const h=G.hint;place(h.p,h.off);rebuildOcc();G.hint=null;if(occ.size===G.boardSet.size)win(true);} } });
      await p.click('#bNext', {force:true}); await p.waitForTimeout(400); }
    console.log(name, mock ? await p.evaluate(()=>__cg.join(',')) : 'no sdk', await p.evaluate(()=>[G.level, $('app').getBoundingClientRect().width|0]));
    await p.close();
  }
  console.log('errors:', errs);
  await b.close();
  if (errs.length) process.exit(1);
})();
