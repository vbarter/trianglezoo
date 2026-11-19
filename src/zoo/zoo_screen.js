// ===================== zoo album =====================
const ZOO_THUMB = {};
function zooThumbs(){ for (const f of FIGS){ const b = ZOO_THUMB[f.id]; if (!b || Math.abs(f.n - 40) < Math.abs(b.n - 40)) ZOO_THUMB[f.id] = f; } }
const GREY = { base: '#C9D9DE', light: '#DCE8EB', dark: '#9FB4BC', side: '#B3C6CC' };
const zooCount = () => ZOO.filter(d => save.zoo[d.id]).length;
let zooCards = [], zooRaf = 0;
function zooThumb(card, t){
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
  cgPlay(false); $('menu').hidden = true; $('game').hidden = true; $('zoo').hidden = false;
  const t = L(), n = zooCount();
  $('tZoo').textContent = t.zoo; $('tZooN').textContent = t.zooN(n, ZOO.length); $('tZooTip').textContent = n < ZOO.length ? t.zooTip : t.zooAll;
  $('bZooBack').innerHTML = ICON.back; $('bZooBack').setAttribute('aria-label', t.back);
  zooThumbs(); const grid = $('zgrid'); grid.innerHTML = '';
  zooCards = ZOO.filter(d => ZOO_THUMB[d.id]).map((d, i) => { const on = !!save.zoo[d.id], el = document.createElement('button'); el.type = 'button'; el.className = 'zc' + (on ? '' : ' lock');
    el.innerHTML = '<canvas></canvas><span>' + (on ? t.figs[d.id] : t.locked) + '</span>'; grid.appendChild(el);
    const f = ZOO_THUMB[d.id], card = { el, cv: el.querySelector('canvas'), f, g: paths(geom(f.cells)), on, ph: i * 0.37, hopAt: -1 };
    el.addEventListener('click', () => { if (!card.on) return; card.hopAt = performance.now() / 1000; sfx('place'); /* [AUDIO] place */ });
    return card; });
  if (!zooRaf) zooRaf = requestAnimationFrame(zooLoop);
}
