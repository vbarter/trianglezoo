// 小红书上架素材：封面 3:4（1080×1440）和图标 1:1（512×512），用游戏里的动物插画现画。
// 用法：npm run build:xhs 之后执行 node scripts/xhs_media.js → media/xhs_cover.jpg、media/xhs_icon.jpg
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('file://' + ROOT + '/dist/xhs/index.html'); await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const font = getComputedStyle(document.body).fontFamily;
    function tris(x, W, H, s, col){ x.fillStyle = col; const h = s * 0.866;
      for (let r = 0, yy = 0; yy < H; r++, yy += h) for (let xx = (r % 2) ? -s / 2 : 0; xx < W; xx += s){ x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + s / 2, yy + h); x.lineTo(xx + s, yy); x.fill(); } }
    function tile(x, cx, cy, s, up, col){ const h = s * 0.866; x.beginPath();
      if (up){ x.moveTo(cx, cy - h * 2 / 3); x.lineTo(cx + s / 2, cy + h / 3); x.lineTo(cx - s / 2, cy + h / 3); }
      else { x.moveTo(cx, cy + h * 2 / 3); x.lineTo(cx + s / 2, cy - h / 3); x.lineTo(cx - s / 2, cy - h / 3); }
      x.closePath(); x.fillStyle = col; x.fill(); x.lineWidth = s * 0.06; x.strokeStyle = 'rgba(30,58,76,.85)'; x.lineJoin = 'round'; x.stroke(); }
    // 封面
    const W = 1080, H = 1440, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#D6ECEB'; x.fillRect(0, 0, W, H); tris(x, W, H, 64, '#C9E3E2');
    x.fillStyle = '#1E3A4C'; x.textAlign = 'center'; x.font = '700 150px ' + font; x.fillText('角角入位', W / 2, 230);
    x.fillStyle = '#547080'; x.font = '500 50px ' + font; x.fillText('拼满三角，小动物就活过来', W / 2, 320);
    const big = zooArt('cat'); if (big) x.drawImage(big, W / 2 - 300, 400, 600, 600);
    ['fox', 'panda', 'penguin', 'turtle', 'octopus'].forEach((id, i) => { const im = zooArt(id); if (im) x.drawImage(im, 45 + i * 200, 1020, 190, 190); });
    x.fillStyle = '#FFB627'; const bw = 620, bh = 110, bx = (W - bw) / 2, by = 1260;
    x.beginPath(); x.moveTo(bx + 55, by); x.arcTo(bx + bw, by, bx + bw, by + bh, 55); x.arcTo(bx + bw, by + bh, bx, by + bh, 55); x.arcTo(bx, by + bh, bx, by, 55); x.arcTo(bx, by, bx + bw, by, 55); x.fill();
    x.fillStyle = '#1E3A4C'; x.font = '700 50px ' + font; x.fillText('22 只小动物等你收集', W / 2, by + 72);
    const cover = c.toDataURL('image/jpeg', 0.92);
    // 图标
    const I = 512, d = document.createElement('canvas'); d.width = I; d.height = I; const y = d.getContext('2d');
    y.fillStyle = '#FFB627'; y.fillRect(0, 0, I, I); tris(y, I, I, 64, '#FFC24D');
    const cat = zooArt('cat'); if (cat) y.drawImage(cat, 46, 40, 420, 420);
    return { cover, icon: d.toDataURL('image/jpeg', 0.92) };
  });
  fs.mkdirSync(ROOT + '/media', { recursive: true });
  fs.writeFileSync(ROOT + '/media/xhs_cover.jpg', Buffer.from(out.cover.split(',')[1], 'base64'));
  fs.writeFileSync(ROOT + '/media/xhs_icon.jpg', Buffer.from(out.icon.split(',')[1], 'base64'));
  console.log('media/xhs_cover.jpg, media/xhs_icon.jpg'); await b.close();
})();
