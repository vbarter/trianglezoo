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
