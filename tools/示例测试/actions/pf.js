// 21-02 项目 01：对初版（?v=a）与完成版运行同一组验收检查，结果写回完成版页面
module.exports = async page => {
  const base = page.url().split('?')[0], R = {};
  for (const v of ['A', 'B']) {
    await page.setViewportSize({ width: 1180, height: 800 });
    await page.goto(base + (v === 'A' ? '?v=a' : '?v=b'));
    await page.waitForTimeout(1300);   // 封面 600 毫秒后到达
    const cls = await page.evaluate(() => new Promise(res => { let s = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) s += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => res(s), 50); }));
    const r = { cls };
    for (const w of [360, 768, 1280]) { await page.setViewportSize({ width: w, height: 800 }); await page.waitForTimeout(100); r['w' + w] = await page.evaluate(() => window.__pf.measure()); }
    // 键盘：从页面开头按 Tab，记录到达的元素与焦点样式
    await page.setViewportSize({ width: 1180, height: 800 });
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    const seen = new Set(); let nav = 0, visible = 0;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body || !document.getElementById('site').contains(el)) return null; const cs = getComputedStyle(el), all = [...document.querySelectorAll('#site *')]; return { id: all.indexOf(el), nav: !!el.closest('nav'), vis: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none' }; });
      if (!f || seen.has(f.id)) break;
      seen.add(f.id); if (f.nav) nav++; if (f.vis) visible++;
    }
    r.tab = { stops: seen.size, nav, visible };
    // 默认字号放大到 200%
    await page.setViewportSize({ width: 360, height: 800 });
    r.zoom = await page.evaluate(() => { const p = document.querySelector('#site .lead'), before = parseFloat(getComputedStyle(p).fontSize); document.documentElement.style.fontSize = '200%'; const after = parseFloat(getComputedStyle(p).fontSize), m = window.__pf.measure(); document.documentElement.style.fontSize = ''; return { before, after, overflow: m.overflow }; });
    R[v] = r;
    if (process.env.SHOTS) {   // 另存几种宽度下的页面截图，供拼图使用
      await page.evaluate(() => window.scrollTo(0, 0));
      for (const w of v === 'A' ? [360] : [360, 768]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(150); await page.screenshot({ path: `${process.env.SHOTS}/pf-${v}-${w}.png` }); }
    }
  }
  await page.setViewportSize({ width: 1180, height: 800 });
  await page.goto(base + '?v=b'); await page.waitForTimeout(900);
  await page.evaluate(R => window.__pf.report(R), R);
  console.log(JSON.stringify(R));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log('height', h);
  await page.setViewportSize({ width: 1180, height: Number(process.env.H || h) });
  await page.waitForTimeout(200);
};
