// 21-08 项目 07：对初版与完成版的生成函数运行同一组检查
module.exports = async page => {
  await page.waitForTimeout(300);
  const R = await page.evaluate(async () => {
    const G = window.__gp, LONG = '城市步行地图：把补水点、遮阴路段、无障碍坡道与实时人流放在同一张地图上的周末路线', R = {};
    const base = { seed: 12, palette: 'lake', density: 120, title: '周末去湖边走走' }, mk = () => document.createElement('canvas');
    for (const v of ['A', 'B']) {
      const gen = v === 'A' ? G.generateA : G.generateB, r = {};
      const c1 = mk(), c2 = mk(); gen(c1, base); gen(c2, base); const same = G.hash(c1) === G.hash(c2);
      r.repro = { ok: same, text: same ? '相同' : '不同（每次都不一样）' };
      const hs = new Set(); for (let s = 1; s <= 6; s++) { const c = mk(); gen(c, { ...base, seed: s }); hs.add(G.hash(c)); }
      r.series = { ok: hs.size === 6, text: `${hs.size} 张不同${v === 'A' ? '（但种子不起作用，无法重现其中任何一张）' : ''}` };
      const cl = mk(), o = gen(cl, { ...base, title: LONG }), over = Math.max(0, o.box.x + o.box.w - cl.width);
      r.long = { ok: over === 0, text: over ? `超出画布 ${Math.round(over)} 像素（单行 44 像素）` : `${o.lines} 行，${o.size} 像素，没有超出${o.warnings.length ? '；' + o.warnings.join('；') : ''}` };
      const c0 = mk(), o0 = gen(c0, { ...base, density: 0 }), cov0 = G.coverage(c0, G.PALETTES.lake.bg);
      r.d0 = { ok: cov0 > 0.2 && o0.warnings.length > 0, text: `图案覆盖 ${(cov0 * 100).toFixed(0)}%${o0.warnings.length ? '；' + o0.warnings[0] : '（一片空白，没有提示）'}` };
      const t0 = performance.now(), cK = mk(), oK = gen(cK, { ...base, density: 1000 }), ms = performance.now() - t0, cells = Math.round(v === 'A' ? Math.round(Math.sqrt(1000)) ** 2 * 1.4 : 400);
      r.d1000 = { ok: oK.warnings.length > 0, text: `约 ${cells} 个格子，每格约 ${Math.round(v === 'A' ? 300 / Math.round(Math.sqrt(1000)) : Math.sqrt(300 * 420 * 0.73 / 400))} 像素${oK.warnings.length ? '；' + oK.warnings[0] : '（没有提示）'}` };
      let minC = 99; for (const pal of ['lake', 'dusk', 'ink']) { for (let s = 1; s <= 3; s++) { const c = mk(), o2 = gen(c, { ...base, palette: pal, seed: s }), under = o2.under ? G.hex(o2.under) : G.medianUnder(c, o2.box, o2.ink); minC = Math.min(minC, G.contrast(G.hex(o2.ink), under)); } }
      r.contrast = { ok: minC >= 4.5, text: `${minC.toFixed(2)} : 1${o.under ? '（单色色带）' : '（文字直接压在图案上）'}` };
      if (v === 'A') { const c = mk(); G.generateA(c, base); r.export = { ok: false, text: `${c.width} × ${c.height}（屏幕上的画布）` }; }
      else { document.getElementById('export').click(); const e = window.__lastExport; r.export = { ok: e.w >= 1200, text: `${e.w} × ${e.h}；文件名 ${e.name}` }; }
      R[v] = r;
    }
    return R;
  });
  await page.evaluate(R => window.__gp.report(R), R);
  console.log(JSON.stringify(R));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
