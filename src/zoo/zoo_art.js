// ===================== zoo: illustrations =====================
// One flat cartoon per animal, drawn in a 100 x 100 box. It replaces the pieces when the board is complete
// and is the picture in the zoo album. Side-view animals face the same way as their board outline.
const ZI = '#1E3A4C';
const zEye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${ZI}" stroke-width="2"/><circle cx="${x + r * .1}" cy="${y + r * .15}" r="${r * .62}" fill="${ZI}" stroke="none"/><circle cx="${x - r * .2}" cy="${y - r * .2}" r="${r * .25}" fill="#fff" stroke="none"/>`;
const zDot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${ZI}" stroke="none"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .35}" fill="#fff" stroke="none"/>`;
const zCheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.6" fill="#FF8FA8" opacity=".6" stroke="none"/>`;
const zSmile = (x, y, w) => `<path d="M${x - w} ${y}q${w} ${w * .9} ${2 * w} 0" fill="none" stroke="${ZI}" stroke-width="2.2" stroke-linecap="round"/>`;
const ZOO_ART = {
  cat: `<path d="M18 46 L20 8 L44 26 Z M82 46 L80 8 L56 26 Z" fill="#F7973B"/><path d="M24 38 L25 17 L38 28 Z M76 38 L75 17 L62 28 Z" fill="#FFC9A3" stroke="none"/>
    <circle cx="50" cy="58" r="36" fill="#F7973B"/><path d="M50 22 l-4 12 h8 z M36 25 l0 10 M64 25 l0 10" fill="#D9741F" stroke="#D9741F"/>
    <ellipse cx="50" cy="72" rx="18" ry="12" fill="#FFE3CC" stroke="none"/>${zEye(37, 55, 6.5)}${zEye(63, 55, 6.5)}${zCheek(28, 66)}${zCheek(72, 66)}
    <path d="M46 66 h8 l-4 4 z" fill="#F07FAE"/>${zSmile(45, 72, 5)}<path d="M8 62 l16 2 M8 70 l16 -1 M92 62 l-16 2 M92 70 l-16 -1" stroke-width="1.6"/>`,
  fox: `<path d="M10 36 L18 4 L42 26 Z M90 36 L82 4 L58 26 Z" fill="#F7973B"/><path d="M17 30 L21 13 L34 25 Z M83 30 L79 13 L66 25 Z" fill="#3A2A2A" stroke="none"/>
    <path d="M6 34 Q50 8 94 34 Q86 66 50 96 Q14 66 6 34 Z" fill="#F7973B"/><path d="M20 58 Q36 60 50 70 Q64 60 80 58 Q70 80 50 96 Q30 80 20 58 Z" fill="#fff"/>
    ${zEye(35, 46, 6)}${zEye(65, 46, 6)}${zCheek(25, 58)}${zCheek(75, 58)}<ellipse cx="50" cy="88" rx="5" ry="3.6" fill="${ZI}"/>`,
  bear: `<circle cx="20" cy="22" r="14" fill="#A0714F"/><circle cx="80" cy="22" r="14" fill="#A0714F"/><circle cx="20" cy="22" r="7" fill="#E7C29F" stroke="none"/><circle cx="80" cy="22" r="7" fill="#E7C29F" stroke="none"/>
    <circle cx="50" cy="56" r="38" fill="#A0714F"/><ellipse cx="50" cy="70" rx="17" ry="13" fill="#E7C29F"/>${zEye(36, 50, 6)}${zEye(64, 50, 6)}${zCheek(26, 63)}${zCheek(74, 63)}
    <ellipse cx="50" cy="64" rx="6" ry="4.4" fill="${ZI}"/><path d="M50 68 v5" stroke-width="2"/>${zSmile(44, 73, 6)}`,
  panda: `<circle cx="20" cy="22" r="14" fill="${ZI}"/><circle cx="80" cy="22" r="14" fill="${ZI}"/>
    <circle cx="50" cy="56" r="38" fill="#fff"/><ellipse cx="35" cy="52" rx="10" ry="12" fill="${ZI}" transform="rotate(25 35 52)"/><ellipse cx="65" cy="52" rx="10" ry="12" fill="${ZI}" transform="rotate(-25 65 52)"/>
    <circle cx="36" cy="51" r="4.5" fill="#fff" stroke="none"/><circle cx="64" cy="51" r="4.5" fill="#fff" stroke="none"/><circle cx="37" cy="52" r="2.6" fill="${ZI}"/><circle cx="63" cy="52" r="2.6" fill="${ZI}"/>
    ${zCheek(26, 68)}${zCheek(74, 68)}<ellipse cx="50" cy="66" rx="5.5" ry="4" fill="${ZI}"/>${zSmile(45, 73, 5)}`,
  pig: `<path d="M14 40 L10 6 L40 24 Z M86 40 L90 6 L60 24 Z" fill="#F7A3C0"/><ellipse cx="50" cy="56" rx="42" ry="36" fill="#F7A3C0"/>
    ${zEye(33, 46, 6)}${zEye(67, 46, 6)}${zCheek(22, 60)}${zCheek(78, 60)}<ellipse cx="50" cy="66" rx="15" ry="11" fill="#FFC2D6"/>
    <ellipse cx="44" cy="66" rx="2.8" ry="4" fill="#B0476E" stroke="none"/><ellipse cx="56" cy="66" rx="2.8" ry="4" fill="#B0476E" stroke="none"/>${zSmile(45, 82, 5)}`,
  rabbit: `<ellipse cx="35" cy="26" rx="10" ry="25" fill="#fff"/><ellipse cx="65" cy="26" rx="10" ry="25" fill="#fff"/><ellipse cx="35" cy="28" rx="4.6" ry="17" fill="#FFC2D6" stroke="none"/><ellipse cx="65" cy="28" rx="4.6" ry="17" fill="#FFC2D6" stroke="none"/>
    <circle cx="50" cy="68" r="30" fill="#fff"/>${zEye(39, 64, 5.5)}${zEye(61, 64, 5.5)}${zCheek(31, 75)}${zCheek(69, 75)}
    <path d="M46 73 h8 l-4 4 z" fill="#F07FAE"/><path d="M50 77 v3" stroke-width="2"/>${zSmile(45, 80, 5)}`,
  owl: `<path d="M12 34 L12 4 L38 22 Z M88 34 L88 4 L62 22 Z" fill="#9C6B45"/><ellipse cx="50" cy="58" rx="38" ry="40" fill="#9C6B45"/>
    <ellipse cx="50" cy="74" rx="22" ry="20" fill="#F2D6A8"/><path d="M38 70 q4 4 8 0 M54 70 q4 4 8 0 M44 80 q6 5 12 0" fill="none" stroke="#C49A63" stroke-width="2"/>
    <circle cx="33" cy="42" r="15" fill="#F2D6A8"/><circle cx="67" cy="42" r="15" fill="#F2D6A8"/>${zEye(33, 42, 9.5)}${zEye(67, 42, 9.5)}
    <path d="M44 52 h12 l-6 9 z" fill="#FF9F1C"/><path d="M24 98 l4 -6 l4 6 M68 98 l4 -6 l4 6" fill="#FF9F1C"/>`,
  frog: `<ellipse cx="50" cy="66" rx="46" ry="30" fill="#69BE66"/><circle cx="26" cy="36" r="17" fill="#69BE66"/><circle cx="74" cy="36" r="17" fill="#69BE66"/>
    ${zEye(26, 36, 10)}${zEye(74, 36, 10)}<ellipse cx="50" cy="80" rx="28" ry="12" fill="#B7E3A6" stroke="none"/>${zCheek(18, 62)}${zCheek(82, 62)}
    <path d="M28 62 Q50 82 72 62" fill="#E2566B"/><circle cx="44" cy="52" r="1.6" fill="${ZI}"/><circle cx="56" cy="52" r="1.6" fill="${ZI}"/>`,
  mouse: `<circle cx="20" cy="30" r="20" fill="#A9B4BD"/><circle cx="80" cy="30" r="20" fill="#A9B4BD"/><circle cx="20" cy="30" r="11" fill="#FFC2D6" stroke="none"/><circle cx="80" cy="30" r="11" fill="#FFC2D6" stroke="none"/>
    <path d="M22 56 Q22 34 50 34 Q78 34 78 56 Q74 90 50 96 Q26 90 22 56 Z" fill="#A9B4BD"/>${zEye(39, 60, 5.5)}${zEye(61, 60, 5.5)}${zCheek(30, 74)}${zCheek(70, 74)}
    <circle cx="50" cy="82" r="5" fill="#F07FAE"/><path d="M12 76 l22 -2 M12 86 l22 -6 M88 76 l-22 -2 M88 86 l-22 -6" stroke-width="1.6"/>`,
  lion: `<path d="${Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12, r = i % 2 ? 40 : 49; return (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (50 + r * Math.sin(a)).toFixed(1); }).join(' ')} Z" fill="#D9741F"/>
    <circle cx="20" cy="26" r="8" fill="#F5C63C"/><circle cx="80" cy="26" r="8" fill="#F5C63C"/><circle cx="50" cy="52" r="30" fill="#F5C63C"/>
    <ellipse cx="50" cy="64" rx="14" ry="10" fill="#FFF1C9"/>${zEye(39, 47, 5.5)}${zEye(61, 47, 5.5)}${zCheek(30, 59)}${zCheek(70, 59)}
    <path d="M45 57 h10 l-5 5 z" fill="#6B3E26"/>${zSmile(45, 66, 5)}`,
  penguin: `<path d="M24 40 L6 78 L26 72 Z M76 40 L94 78 L74 72 Z" fill="#2E4A5E"/><ellipse cx="50" cy="54" rx="30" ry="44" fill="#2E4A5E"/>
    <path d="M50 22 Q72 26 70 50 Q74 92 50 96 Q26 92 30 50 Q28 26 50 22 Z" fill="#fff"/>${zEye(41, 34, 5.5)}${zEye(59, 34, 5.5)}${zCheek(35, 46)}${zCheek(65, 46)}
    <path d="M44 42 h12 l-6 7 z" fill="#FF9F1C"/><path d="M34 98 q6 -6 12 0 z M54 98 q6 -6 12 0 z" fill="#FF9F1C"/>`,
  chick: `<path d="M40 26 L44 6 L50 22 L58 6 L60 26 Z" fill="#FFD25E"/><circle cx="50" cy="60" r="38" fill="#FFD25E"/><path d="M14 64 q-6 12 8 16 M86 64 q6 12 -8 16" fill="none" stroke-width="2.2"/>
    ${zEye(37, 54, 6)}${zEye(63, 54, 6)}${zCheek(27, 66)}${zCheek(73, 66)}<path d="M42 62 h16 l-8 10 z" fill="#FF9F1C"/>`,
  fish: `<path d="M66 50 L98 18 L94 50 L98 82 Z" fill="#35B3AC"/><ellipse cx="42" cy="50" rx="38" ry="28" fill="#35B3AC"/>
    <path d="M30 24 Q46 8 58 26 Z M36 76 Q46 90 54 74 Z" fill="#2A8F89"/><path d="M50 30 q8 20 0 40 M60 34 q6 16 0 32" fill="none" stroke="#2A8F89" stroke-width="2.4"/>
    ${zEye(22, 44, 7)}${zCheek(24, 58)}<path d="M6 54 q5 4 10 0" fill="none" stroke-width="2.2"/>`,
  whale: `<path d="M76 58 L102 20 L98 44 L86 64 Z" fill="#4C98E6"/><path d="M2 60 Q2 30 44 30 Q86 30 88 62 Q86 90 44 90 Q2 90 2 60 Z" fill="#4C98E6"/>
    <path d="M8 70 Q44 98 82 72 Q60 84 44 84 Q20 84 8 70 Z" fill="#DCEEFF"/><path d="M36 26 q-2 -10 -8 -14 M36 26 q2 -10 8 -14" fill="none" stroke="#7FC4F5" stroke-width="3"/>
    ${zEye(22, 56, 6)}${zCheek(26, 68)}${zSmile(10, 70, 6)}<path d="M50 70 q10 8 18 0" fill="none" stroke="#2F6FB0" stroke-width="2.2"/>`,
  turtle: `<circle cx="30" cy="80" r="9" fill="#8BCF73"/><circle cx="70" cy="80" r="9" fill="#8BCF73"/><path d="M14 60 L0 70 L16 72 Z" fill="#8BCF73"/><circle cx="88" cy="55" r="12" fill="#8BCF73"/>
    <path d="M14 66 Q14 26 50 26 Q86 26 86 66 Z" fill="#4E9A49"/><path d="M38 34 l12 -6 l12 6 l0 14 l-12 6 l-12 -6 z M24 54 l8 -10 M76 54 l-8 -10 M38 48 l-10 14 M62 48 l10 14" fill="#69BE66" stroke-width="2"/>
    <path d="M10 66 h80" stroke-width="2.6"/>${zDot(91, 51, 3.4)}${zSmile(88, 59, 3)}`,
  snail: `<path d="M2 86 Q2 70 18 70 L80 74 Q98 76 98 86 Q98 94 80 94 L14 94 Q2 94 2 86 Z" fill="#F7C89A"/>
    <path d="M10 70 L6 52 M18 68 L18 50" stroke-width="2.4"/><circle cx="6" cy="51" r="3" fill="${ZI}"/><circle cx="18" cy="49" r="3" fill="${ZI}"/>
    <circle cx="60" cy="48" r="30" fill="#9879DE"/><path d="M60 48 m0 -20 a20 20 0 1 1 -18 26 a13 13 0 1 1 22 -12 a6 6 0 1 1 -8 6" fill="none" stroke="#6F4FC2" stroke-width="3"/>
    ${zCheek(16, 82)}${zSmile(4, 80, 4)}`,
  duck: `<path d="M86 58 L100 34 L96 66 Z" fill="#FFD25E"/><ellipse cx="56" cy="68" rx="40" ry="25" fill="#FFD25E"/><path d="M40 62 Q60 56 74 70 Q58 80 42 72 Z" fill="#F5B82E"/>
    <path d="M30 50 L42 52 L36 64 Z" fill="#FFD25E" stroke="none"/><circle cx="28" cy="34" r="19" fill="#FFD25E"/><path d="M12 36 L-2 40 Q4 48 14 44 Z" fill="#FF9F1C"/>
    ${zEye(24, 30, 5.5)}${zCheek(30, 42)}<path d="M40 96 l6 -6 l6 6 M60 96 l6 -6 l6 6" fill="#FF9F1C"/>`,
  crab: `<path d="M20 70 L4 90 M28 76 L16 96 M80 70 L96 90 M72 76 L84 96" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 34 Q16 46 30 54 M80 34 Q84 46 70 54" fill="none" stroke="#F0685C" stroke-width="7" stroke-linecap="round"/>
    <path d="M4 22 Q4 8 16 10 L14 22 L26 18 Q28 32 14 34 Q4 34 4 22 Z M96 22 Q96 8 84 10 L86 22 L74 18 Q72 32 86 34 Q96 34 96 22 Z" fill="#F0685C"/>
    <ellipse cx="50" cy="62" rx="38" ry="22" fill="#F0685C"/><path d="M40 44 V34 M60 44 V34" stroke-width="2.4"/>${zEye(40, 32, 5.5)}${zEye(60, 32, 5.5)}
    ${zCheek(30, 64)}${zCheek(70, 64)}${zSmile(45, 64, 5)}`,
  butterfly: `<ellipse cx="27" cy="35" rx="24" ry="25" fill="#F07FAE"/><ellipse cx="73" cy="35" rx="24" ry="25" fill="#F07FAE"/><ellipse cx="31" cy="72" rx="18" ry="18" fill="#9879DE"/><ellipse cx="69" cy="72" rx="18" ry="18" fill="#9879DE"/>
    <circle cx="25" cy="33" r="9" fill="#FFD25E"/><circle cx="75" cy="33" r="9" fill="#FFD25E"/><circle cx="30" cy="73" r="6" fill="#fff"/><circle cx="70" cy="73" r="6" fill="#fff"/>
    <ellipse cx="50" cy="58" rx="7" ry="34" fill="#5A4636"/><path d="M47 24 Q42 8 34 6 M53 24 Q58 8 66 6" fill="none" stroke-width="2.2"/><circle cx="34" cy="6" r="2.6" fill="${ZI}"/><circle cx="66" cy="6" r="2.6" fill="${ZI}"/>
    <circle cx="50" cy="28" r="9" fill="#5A4636"/>${zDot(46.5, 27, 2.2)}${zDot(53.5, 27, 2.2)}`,
  dino: `<path d="M24 60 L-2 88 L32 74 Z" fill="#69BE66"/><path d="M32 78 h12 v20 h-12 z M56 78 h12 v20 h-12 z" fill="#4E9A49"/><ellipse cx="48" cy="66" rx="30" ry="21" fill="#69BE66"/>
    <path d="M62 52 L70 22 L86 26 L76 58 Z" fill="#69BE66" stroke="none"/><path d="M62 52 L70 22 M86 26 L76 58" fill="none"/><ellipse cx="80" cy="22" rx="17" ry="11" fill="#69BE66"/>
    <path d="M30 46 l6 -9 l6 9 M44 44 l6 -10 l6 10 M58 48 l4 -8 l6 6" fill="#F5C63C"/><ellipse cx="46" cy="74" rx="18" ry="9" fill="#B7E3A6" stroke="none"/>
    ${zDot(84, 18, 3.4)}${zCheek(86, 27)}<path d="M90 28 q4 2 6 -1" fill="none" stroke-width="2"/>`,
  elephant: `<path d="M36 70 h12 v26 h-12 z M72 70 h12 v26 h-12 z" fill="#9AAFC0"/><ellipse cx="58" cy="55" rx="38" ry="28" fill="#9AAFC0"/>
    <path d="M10 44 Q4 70 6 90 Q12 96 18 90 Q16 70 22 52" fill="#9AAFC0"/><circle cx="26" cy="40" r="22" fill="#9AAFC0"/>
    <ellipse cx="42" cy="42" rx="14" ry="20" fill="#B9C9D6"/><ellipse cx="42" cy="43" rx="8" ry="13" fill="#FFC2D6" stroke="none"/>
    ${zDot(20, 36, 3.6)}${zCheek(24, 48)}<path d="M96 52 q6 6 2 14" fill="none" stroke-width="2.4"/>`,
  octopus: `${[20, 40, 60, 80].map(x => `<path d="M${x - 9} 52 Q${x - 12} 80 ${x - 4} 96 Q${x + 4} 98 ${x + 2} 88 Q${x} 74 ${x + 9} 52 Z" fill="#9879DE"/>`).join('')}
    <ellipse cx="50" cy="38" rx="36" ry="32" fill="#9879DE"/><circle cx="34" cy="20" r="4" fill="#B9A3EC" stroke="none"/><circle cx="68" cy="16" r="3" fill="#B9A3EC" stroke="none"/>
    ${zEye(38, 40, 6.5)}${zEye(62, 40, 6.5)}${zCheek(28, 52)}${zCheek(72, 52)}${zSmile(45, 53, 5)}`,
};
const zooArtImg = {};
function zooArt(id){ const im = zooArtImg[id]; return im && im.complete && im.naturalWidth ? im : null; }
// the art box is -4..104 in picture units
const ZA0 = -4, ZA1 = 104, ZAS = ZA1 - ZA0;
const zooArtLoaded = Promise.all(ZOO.map(d => new Promise(res => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ZA0 + ' ' + ZA0 + ' ' + ZAS + ' ' + ZAS + '" width="432" height="432"><g stroke="' + ZI + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">' + ZOO_ART[d.id] + '</g></svg>';
  const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false);
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); zooArtImg[d.id] = im; })));

// ---- the board for each animal is cut from its picture ----
// A grid triangle belongs to the board when most of it is covered by the picture. For each size the
// picture is slid around under the grid and the placement that matches the outline best is kept;
// sizes whose outline no longer looks like the picture are dropped.
const ZM = 216;   // alpha map resolution over the art box
function zooAlpha(id){
  const c = document.createElement('canvas'); c.width = c.height = ZM; const x = c.getContext('2d');
  x.drawImage(zooArtImg[id], 0, 0, ZM, ZM); const d = x.getImageData(0, 0, ZM, ZM).data, a = new Uint8Array(ZM * ZM);
  for (let n = 0; n < a.length; n++) a[n] = d[n * 4 + 3] > 110 ? 1 : 0; return a;
}
const ZBARY = []; for (let u = 0; u < 4; u++) for (let v = 0; v + u < 4; v++) ZBARY.push([(u + .5) / 4.5, (v + .5) / 4.5]);
// k: picture units per grid unit; (ox, oy): grid position of picture point (0, 0)
function zooCut(alpha, k, ox, oy){
  const L = ZA0 / k + ox, R = ZA1 / k + ox, T = ZA0 / k + oy, B = ZA1 / k + oy, cells = [], cov = [];
  const j0 = Math.floor(T / H) - 1, j1 = Math.ceil(B / H) + 1;
  for (let j = j0; j <= j1; j++) for (let i = Math.floor(L - j / 2) - 1; i <= Math.ceil(R - j / 2) + 1; i++) for (let t = 0; t < 2; t++){
    const vs = cverts([i, j, t]).map(vxy); let hit = 0;
    for (const w of ZBARY){ const px = vs[0][0] + (vs[1][0] - vs[0][0]) * w[0] + (vs[2][0] - vs[0][0]) * w[1], py = vs[0][1] + (vs[1][1] - vs[0][1]) * w[0] + (vs[2][1] - vs[0][1]) * w[1];
      const ax = Math.floor(((px - ox) * k - ZA0) / ZAS * ZM), ay = Math.floor(((py - oy) * k - ZA0) / ZAS * ZM);
      if (ax >= 0 && ay >= 0 && ax < ZM && ay < ZM && alpha[ay * ZM + ax]) hit++; }
    const f = hit / ZBARY.length; if (f > 0) cov.push([i, j, t, f]); }
  let inter = 0, uni = 0; const picked = [];
  for (const q of cov){ if (q[3] >= 0.5){ picked.push([q[0], q[1], q[2]]); inter += q[3]; uni += 1; } else uni += q[3]; }
  // one edge-connected piece, no stray triangles
  const set = new Map(picked.map(c => [K(c[0], c[1], c[2]), c])), seen = new Set(); let best = [];
  for (const [k0, c0] of set){ if (seen.has(k0)) continue; seen.add(k0); const comp = [c0];
    for (let h = 0; h < comp.length; h++) for (const nb of nbrs(comp[h])){ const kk = K(nb[0], nb[1], nb[2]); if (set.has(kk) && !seen.has(kk)){ seen.add(kk); comp.push(nb); } }
    if (comp.length > best.length) best = comp; }
  return { cells: best, iou: uni ? inter / uni * (best.length / Math.max(1, picked.length)) : 0 };
}
function buildZooFigs(){
  FIGS.length = 0;
  for (const d of ZOO){
    if (!zooArt(d.id)) continue;
    const alpha = zooAlpha(d.id), seen = new Set();
    for (const target of [20, 23, 27, 31, 36, 42, 48, 56, 66, 78, 90]){   // below ~20 triangles every head looks like a hexagon
      // scale for roughly this many triangles: area of the picture / area of one triangle
      let lo = 0.5, hi = 40, best = null;
      for (let n = 0; n < 12; n++){ const k = Math.sqrt(lo * hi), r = zooCut(alpha, k, 0, 0); if (r.cells.length > target) lo = k; else hi = k; }
      const k = Math.sqrt(lo * hi);
      for (let a = 0; a < 6; a++) for (let b = 0; b < 3; b++){ const r = zooCut(alpha, k, a / 6, b * H / 3);
        if (!best || r.iou > best.iou) best = Object.assign(r, { ox: a / 6, oy: b * H / 3, k }); }
      if (!best || best.cells.length < 19 || best.iou < 0.7 || seen.has(best.cells.length)) continue;
      seen.add(best.cells.length);
      FIGS.push({ id: d.id, cells: best.cells, n: best.cells.length, zoo: d, k: best.k, ox: best.ox, oy: best.oy, iou: best.iou });
    }
  }
}
// where the picture sits on the screen for a board drawn at (BX, BY, S); returns [left, top, size, flip]
function zooArtRect(f, mirror, c, bx, by, sc){
  const left = f.ox + ZA0 / f.k, top = f.oy + ZA0 / f.k, size = ZAS / f.k;
  return [bx + sc * (mirror ? c - left - size : left), by + sc * top, sc * size, mirror];
}
function drawZooArt(ctx, im, r){
  ctx.save(); if (r[3]){ ctx.translate(r[0] + r[2], r[1]); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, r[2], r[2]); } else ctx.drawImage(im, r[0], r[1], r[2], r[2]); ctx.restore();
}
